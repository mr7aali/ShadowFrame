"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { refresh } from "next/cache";
import { generateImage } from "./ai/media";
import { getRoute } from "./ai/settings";
import { generateText } from "./ai/text";
import { connectDB } from "./db";
import {
  describeItem,
  libraryType,
  librarySlug,
  type AssetView,
  type LibraryItemView,
  type LibraryType,
} from "./library";
import { getLibraryItems } from "./library-server";
import { assetPathOk, removeFile, saveAsset } from "./assets";
import { Asset, Character, Episode, LibraryItem } from "./models";
import { REPO_ROOT } from "./paths";

const ID = /^[a-f0-9]{24}$/;

/* ---------- Library items ---------- */

export async function createLibraryItem(type: LibraryType, name: string): Promise<string> {
  const info = libraryType(type);
  if (!info) throw new Error("Unknown type");
  const clean = name.trim().slice(0, 120);
  if (!clean) throw new Error(`${info.nameLabel} is required`);
  await connectDB();
  const doc = await LibraryItem.create({ type, name: clean, slug: librarySlug(type, clean), fields: {} });
  refresh();
  return `/library/${info.slug}/${doc._id}`;
}

export async function updateLibraryItem(id: string, name: string, fields: Record<string, string>) {
  if (!ID.test(id)) throw new Error("Bad id");
  await connectDB();
  const item = await LibraryItem.findById(id, { type: 1 }).lean();
  if (!item) throw new Error("Not found");
  const info = libraryType(item.type)!;
  const allowed = new Set(info.fields.map((f) => f.key));
  const clean = Object.fromEntries(
    Object.entries(fields)
      .filter(([k]) => allowed.has(k))
      .map(([k, v]) => [k, String(v).slice(0, 4000)]),
  );
  const n = name.trim().slice(0, 120) || "Untitled";
  await LibraryItem.updateOne(
    { _id: id },
    { $set: { name: n, slug: librarySlug(item.type as LibraryType, n), fields: clean } },
  );
  refresh();
}

export async function deleteLibraryItem(id: string): Promise<string> {
  if (!ID.test(id)) throw new Error("Bad id");
  await connectDB();
  const item = await LibraryItem.findById(id).lean();
  if (!item) return "/";
  const assets = await Asset.find({ item: id }).lean();
  for (const a of assets) await removeFile(a.path);
  await Asset.deleteMany({ item: id });
  await LibraryItem.deleteOne({ _id: id });
  await Episode.updateMany({}, { $pull: { libraryCast: id, libraryLocations: id } });
  await Episode.updateMany({ libraryStory: id }, { $set: { libraryStory: "" } });
  refresh();
  return `/library/${libraryType(item.type)!.slug}`;
}

export async function setItemImage(id: string, imagePath: string) {
  if (!ID.test(id) || !assetPathOk(imagePath)) throw new Error("Bad input");
  await connectDB();
  await LibraryItem.updateOne({ _id: id }, { $set: { image: imagePath } });
  refresh();
}

/** "Fill with AI": the text AI writes the item's fields from a short brief. */
export async function aiFillLibraryItem(
  type: LibraryType,
  name: string,
  brief: string,
  current: Record<string, string>,
): Promise<{ fields?: Record<string, string>; name?: string; error?: string }> {
  const info = libraryType(type);
  if (!info) return { error: "Unknown type" };
  const route = await getRoute("text");
  if (!route) return { error: "Connect a text AI on the AI connections page first." };

  const keys = info.fields.map((f) => `"${f.key}": ${f.label}${f.options ? ` (one of: ${f.options.join(", ")})` : ""}`);
  const filled = Object.entries(current).filter(([, v]) => v?.trim());
  const prompt = [
    info.aiBrief,
    name.trim() ? `${info.nameLabel}: ${name.trim()}` : `Also invent a ${info.nameLabel.toLowerCase()}.`,
    brief.trim() ? `Creator's brief: ${brief.trim()}` : "",
    filled.length
      ? `Keep these existing values unless the brief says otherwise:\n${filled.map(([k, v]) => `- ${k}: ${v}`).join("\n")}`
      : "",
    `Return ONLY a JSON object with these string keys (no markdown, no commentary):\n"name": ${info.nameLabel}\n${keys.join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const text = await generateText({
      creds: route.creds,
      model: route.model,
      system:
        "You develop original fiction for a narrated crime-thriller YouTube series. No real people, cases or brands. You answer with a single JSON object.",
      prompt,
      quick: true,
    });
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return { error: "The AI didn't return JSON. Try again." };
    const data = JSON.parse(json) as Record<string, unknown>;
    const fields: Record<string, string> = {};
    for (const f of info.fields) if (data[f.key] != null) fields[f.key] = String(data[f.key]);
    return { fields, name: typeof data.name === "string" ? data.name : undefined };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI request failed" };
  }
}

/* ---------- Image prompts & generation ---------- */

type ImageContext = { item?: string; episode?: string; kind: string; refs?: string[] };

async function contextFor(ctx: ImageContext): Promise<{ text: string; item: LibraryItemView | null }> {
  const parts: string[] = [];
  let item: LibraryItemView | null = null;
  if (ctx.item && ID.test(ctx.item)) {
    [item] = await getLibraryItems([ctx.item]);
    if (item) parts.push(describeItem(item));
  }
  if (ctx.episode) {
    await connectDB();
    const ep = await Episode.findOne({ code: ctx.episode }).lean();
    if (ep) {
      parts.push(`Episode ${ep.code} — ${ep.title}${ep.logline ? `\nLogline: ${ep.logline}` : ""}`);
      const cast = await getLibraryItems([...(ep.libraryCast ?? []), ...(ep.libraryLocations ?? [])]);
      if (cast.length) parts.push(`Series cast and places in this episode:\n${cast.map(describeItem).join("\n\n")}`);
    }
  }
  return { text: parts.join("\n\n"), item };
}

/** Rewrites a rough image prompt into a strong one, using the item's / episode's details. */
export async function enhanceImagePrompt(
  prompt: string,
  ctx: ImageContext,
): Promise<{ prompt?: string; error?: string }> {
  if (!prompt.trim()) return { error: "Write a prompt (or a few words) first." };
  const route = await getRoute("text");
  if (!route) return { error: "Connect a text AI (e.g. Claude) on the AI connections page to enhance prompts." };
  const { text: context } = await contextFor(ctx);
  try {
    const out = await generateText({
      creds: route.creds,
      model: route.model,
      quick: true,
      system: `You write prompts for AI image generators (gpt-image, Gemini, Midjourney, Flux) for a grounded, cinematic, original crime-thriller YouTube series.

Rewrite the creator's prompt into ONE detailed paragraph (60–140 words) that an image model follows reliably:
- Subject first, then action/pose, setting, time and weather, framing and lens, lighting, mood, then the style line.
- Copy every character detail from the context exactly (face, hair, age, outfit, props). Never change a character's look.
- Concrete visual nouns, no abstract adjectives, no story exposition.
- ${ctx.refs?.length ? `${ctx.refs.length} reference image(s) will be attached: say "Use the attached reference image(s) for the character's identity and the location."` : "No reference images are attached."}
- Always end with: 16:9, no text, no captions, no logos, no watermark.
- No gore; suspense over shock. No real people or brands.
Return only the prompt text.`,
      prompt: `${context ? `Context:\n${context}\n\n` : ""}Kind of image: ${ctx.kind}\n\nCreator's prompt:\n${prompt.trim()}`,
    });
    return { prompt: out.replace(/^["'`]+|["'`]+$/g, "").trim() };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Enhance failed" };
  }
}

/** Generate with the routed image AI and save it as an asset. */
export async function generateImageAsset(
  prompt: string,
  ctx: ImageContext & { title?: string },
): Promise<{ asset?: AssetView; error?: string }> {
  if (!prompt.trim()) return { error: "The prompt is empty." };
  const route = await getRoute("image");
  if (!route) return { error: "Connect an image AI (OpenAI or Gemini) on the AI connections page first." };
  const refs = (ctx.refs ?? []).filter(assetPathOk).map((r) => path.join(REPO_ROOT, r));
  try {
    const img = await generateImage({ creds: route.creds, model: route.model, prompt, refs });
    const asset = await saveAsset(img.data, img.ext, { ...ctx, prompt }, "generated", `${route.provider}/${route.model}`);
    refresh();
    return { asset };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Image generation failed" };
  }
}

export async function deleteAsset(id: string) {
  if (!ID.test(id)) throw new Error("Bad id");
  await connectDB();
  const a = await Asset.findById(id).lean();
  if (!a) return;
  await removeFile(a.path);
  await Asset.deleteOne({ _id: id });
  await LibraryItem.updateMany({ image: a.path }, { $set: { image: "" } });
  refresh();
}

/* ---------- Episodes ↔ library ---------- */

export async function setEpisodeLibrary(code: string, story: string, cast: string[], locations: string[]) {
  await connectDB();
  await Episode.updateOne(
    { code },
    {
      $set: {
        libraryStory: ID.test(story) ? story : "",
        libraryCast: cast.filter((x) => ID.test(x)),
        libraryLocations: locations.filter((x) => ID.test(x)),
      },
    },
  );
  refresh();
}

/** Copy a library character's main image in as this episode's locked reference (<slug>_front). */
export async function applyLibraryFace(characterId: string): Promise<{ error?: string }> {
  if (!ID.test(characterId)) return { error: "Bad id" };
  await connectDB();
  const c = await Character.findById(characterId).lean();
  if (!c) return { error: "Character not found" };
  const lib = await LibraryItem.findOne({ type: "character", slug: c.slug, image: { $ne: "" } }).lean();
  if (!lib) return { error: "No library character with this first name has a main image." };
  const ep = await Episode.findOne({ code: c.episode }, { folder: 1 }).lean();
  if (!ep) return { error: "Episode not found" };
  const ext = path.extname(lib.image);
  const rel = `${ep.folder}/assets/references/${c.slug}_front${ext}`;
  await fs.mkdir(path.dirname(path.join(REPO_ROOT, rel)), { recursive: true });
  await fs.copyFile(path.join(REPO_ROOT, lib.image), path.join(REPO_ROOT, rel));
  await Character.updateOne({ _id: characterId }, { $set: { image: rel, status: "approved" } });
  refresh();
  return {};
}
