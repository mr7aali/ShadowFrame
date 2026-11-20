"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { refresh } from "next/cache";
import { CAPABILITIES, providerInfo, type Capability, type ProviderId, type RouteConfig } from "./ai/catalog";
import { generateImage, generateSpeech, testConnection } from "./ai/media";
import {
  getProviderCreds,
  getRoute,
  removeProviderConfig,
  saveProviderConfig,
  saveRouteConfig,
} from "./ai/settings";
import { connectDB } from "./db";
import { importEpisodeFolder } from "./importer";
import { Character, Episode, LibraryItem, Location, Shot } from "./models";
import { ALL_FILES, findFile, stepUrl } from "./pipeline";
import { REPO_ROOT } from "./paths";
import { splitScript } from "./voice-sections";
import { readEpisodeFile, writeEpisodeFile } from "./workspace";

/* ---------- Pipeline files ---------- */

async function episodeFor(code: string) {
  await connectDB();
  const ep = await Episode.findOne({ code }, { folder: 1, steps: 1 }).lean();
  if (!ep) throw new Error(`Episode ${code} not found`);
  return ep;
}

function fileDef(stageKey: string, slug: string) {
  const found = findFile(stageKey, slug);
  if (!found) throw new Error("Unknown pipeline file");
  return found;
}

async function setFileStatus(code: string, repoPath: string, title: string, status: "todo" | "in_progress" | "done") {
  const r = await Episode.updateOne({ code, "steps.file": repoPath }, { $set: { "steps.$.status": status } });
  if (r.matchedCount === 0)
    await Episode.updateOne(
      { code },
      { $push: { steps: { order: 99, label: "•", title, file: repoPath, tool: "", status, note: "" } } },
    );
}

/** Save the editor's content. A file you have started moves to "In progress". */
export async function saveStepFile(code: string, stageKey: string, slug: string, content: string) {
  const ep = await episodeFor(code);
  const { file } = fileDef(stageKey, slug);
  await writeEpisodeFile(ep.folder, file.path, content);
  const repoPath = `${ep.folder}/${file.path}`;
  const step = ep.steps.find((s) => s.file === repoPath);
  if (content.trim() && (!step || step.status === "todo")) await setFileStatus(code, repoPath, file.title, "in_progress");
  refresh();
}

/** Save, mark done, re-import (fills the shot board and cast), and return the next step's URL. */
export async function completeStepFile(
  code: string,
  stageKey: string,
  slug: string,
  content: string,
): Promise<{ next: string | null; error?: string }> {
  if (!content.trim()) return { next: null, error: "This file is empty. Write it or create it with AI first." };
  const ep = await episodeFor(code);
  const { file, index } = fileDef(stageKey, slug);
  await writeEpisodeFile(ep.folder, file.path, content);
  await setFileStatus(code, `${ep.folder}/${file.path}`, file.title, "done");
  try {
    await importEpisodeFolder(ep.folder);
  } catch {
    // Import problems show up on the shot board; never block completing a file.
  }
  refresh();
  const next = ALL_FILES[index + 1];
  return { next: next ? stepUrl(code, next.file) : `/episodes/${code}` };
}

export async function reopenStepFile(code: string, stageKey: string, slug: string) {
  const ep = await episodeFor(code);
  const { file } = fileDef(stageKey, slug);
  await setFileStatus(code, `${ep.folder}/${file.path}`, file.title, "in_progress");
  refresh();
}

/* ---------- AI connections ---------- */

export async function saveProvider(id: ProviderId, apiKey: string | null, baseUrl: string) {
  const info = providerInfo(id);
  if (!info) throw new Error("Unknown provider");
  const key = apiKey?.trim() ?? null;
  if (key !== null && !key && !info.keyless) throw new Error("Paste an API key.");
  await saveProviderConfig(id, key, info.baseUrl ? baseUrl.trim() || info.baseUrl : "");
  refresh();
}

export async function removeProvider(id: ProviderId) {
  await removeProviderConfig(id);
  refresh();
}

export async function testProvider(id: ProviderId): Promise<{ ok: boolean; message: string }> {
  const creds = await getProviderCreds(id);
  if (!creds) return { ok: false, message: "Not connected — save a key first." };
  try {
    return { ok: true, message: await testConnection(creds) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Connection failed" };
  }
}

export async function saveRouting(cap: Capability, route: RouteConfig) {
  if (!CAPABILITIES.some((c) => c.key === cap)) throw new Error("Bad task");
  if (route.provider && !providerInfo(route.provider)?.models[cap]) throw new Error("That provider can't do this task");
  await saveRouteConfig(cap, {
    provider: route.provider,
    model: route.model.trim().slice(0, 120),
    voice: route.voice.trim().slice(0, 120),
  });
  refresh();
}

/* ---------- Image generation (cast, locations, shots) ---------- */

const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".webp"];

async function findReference(folder: string, name: string): Promise<string | null> {
  const dir = path.join(REPO_ROOT, folder, "assets", "references");
  for (const ext of IMAGE_EXT) {
    const p = path.join(dir, `${name}${ext}`);
    try {
      await fs.access(p);
      return p;
    } catch {}
  }
  // Fall back to the series library: "mara_front" → library character "mara"'s main image.
  const slug = name.replace(/_front$/, "");
  const lib = await LibraryItem.findOne({ type: "character", slug, image: { $ne: "" } }, { image: 1 }).lean();
  if (lib?.image) {
    const p = path.join(REPO_ROOT, lib.image);
    try {
      await fs.access(p);
      return p;
    } catch {}
  }
  return null;
}

export async function generateAssetImage(
  kind: "shot" | "character" | "location",
  id: string,
): Promise<{ error?: string }> {
  const route = await getRoute("image");
  if (!route) return { error: "Connect an image AI on the AI connections page first." };
  await connectDB();

  let episodeCode: string;
  let prompt: string;
  let target: string; // inside the episode folder, without extension
  let refNames: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let model: any;

  if (kind === "shot") {
    const s = await Shot.findById(id).lean();
    if (!s) return { error: "Shot not found" };
    episodeCode = s.episode;
    prompt = s.imagePrompt;
    target = `assets/images/shot_${String(s.number).padStart(2, "0")}`;
    refNames = s.refs;
    model = Shot;
  } else if (kind === "character") {
    const c = await Character.findById(id).lean();
    if (!c) return { error: "Character not found" };
    episodeCode = c.episode;
    prompt = c.prompts[0]?.text ?? "";
    target = `assets/references/${c.slug}_front`;
    model = Character;
  } else {
    const l = await Location.findById(id).lean();
    if (!l) return { error: "Location not found" };
    episodeCode = l.episode;
    prompt = l.prompt;
    target = `assets/references/${l.code}`;
    model = Location;
  }
  if (!prompt.trim()) return { error: "This item has no prompt yet." };

  const ep = await Episode.findOne({ code: episodeCode }, { folder: 1 }).lean();
  if (!ep) return { error: "Episode not found" };

  const refs = (await Promise.all(refNames.map((r) => findReference(ep.folder, r)))).filter(
    (r): r is string => r !== null,
  );

  try {
    const img = await generateImage({ creds: route.creds, model: route.model, prompt, refs });
    const rel = `${ep.folder}/${target}${img.ext}`;
    const abs = path.join(REPO_ROOT, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, img.data);
    await model.updateOne({ _id: id }, { $set: { image: rel } });
    await model.updateOne({ _id: id, status: { $in: ["todo", "rejected"] } }, { $set: { status: "generated" } });
    refresh();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Image generation failed" };
  }
}

/* ---------- Voice generation ---------- */

export async function generateVoiceSection(code: string, index: number): Promise<{ error?: string }> {
  const route = await getRoute("voice");
  if (!route) return { error: "Connect a voice AI on the AI connections page first." };
  const ep = await episodeFor(code);
  const sections = splitScript(await readEpisodeFile(ep.folder, "01-story/script-final.md"));
  const section = sections[index];
  if (!section) return { error: "Section not found — is the final script written?" };
  try {
    const audio = await generateSpeech({
      creds: route.creds,
      model: route.model,
      voice: route.voice,
      text: section.text,
    });
    const abs = path.join(REPO_ROOT, ep.folder, "assets", "voice", `${section.name}.mp3`);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, audio);
    refresh();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Voice generation failed" };
  }
}
