"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { connectDB } from "./db";
import {
  ASSET_STATUSES,
  Character,
  Episode,
  Location,
  PromptRun,
  Shot,
  STEP_STATUSES,
  type AssetStatus,
  type StepStatus,
} from "./models";
import { importEpisodeFolder, listEpisodeFolders, nextEpisodeFolder } from "./importer";
import { REPO_ROOT } from "./paths";

const ASSET_MODELS = { shot: Shot, character: Character, location: Location } as const;
export type AssetKind = keyof typeof ASSET_MODELS;

/* ---------- Steps ---------- */

export async function setStepStatus(code: string, stepId: string, status: StepStatus) {
  if (!STEP_STATUSES.includes(status)) throw new Error("Bad status");
  await connectDB();
  await Episode.updateOne({ code, "steps._id": stepId }, { $set: { "steps.$.status": status } });
  refresh();
}

export async function setStepNote(code: string, stepId: string, note: string) {
  await connectDB();
  await Episode.updateOne(
    { code, "steps._id": stepId },
    { $set: { "steps.$.note": note.slice(0, 500) } },
  );
  refresh();
}

/* ---------- Shots, characters, locations ---------- */

export async function setAssetStatus(kind: AssetKind, id: string, status: AssetStatus) {
  if (!ASSET_STATUSES.includes(status)) throw new Error("Bad status");
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (ASSET_MODELS[kind] as any).updateOne({ _id: id }, { $set: { status } });
  refresh();
}

export async function setAssetNotes(kind: AssetKind, id: string, notes: string) {
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (ASSET_MODELS[kind] as any).updateOne({ _id: id }, { $set: { notes: notes.slice(0, 2000) } });
  refresh();
}

/* ---------- Saved prompt fills ---------- */

export async function savePromptRun(input: {
  template: string;
  blockIndex: number;
  episode: string;
  title: string;
  values: Record<string, string>;
  filled: string;
}) {
  if (!input.template.startsWith("prompts/")) throw new Error("Bad template");
  await connectDB();
  await PromptRun.create(input);
  refresh();
}

export async function updatePromptRunOutput(id: string, output: string) {
  await connectDB();
  await PromptRun.updateOne({ _id: id }, { $set: { output } });
  refresh();
}

export async function deletePromptRun(id: string) {
  await connectDB();
  await PromptRun.deleteOne({ _id: id });
  refresh();
}

/* ---------- Episodes ---------- */

export async function importAllEpisodes() {
  for (const folder of await listEpisodeFolders()) await importEpisodeFolder(folder);
  refresh();
}

export async function reimportEpisode(folder: string) {
  await importEpisodeFolder(folder);
  refresh();
}

/** The standard 16-step pipeline, same as video_1/README.md. */
const STEP_TEMPLATE: [string, string, string, string][] = [
  ["1", "01-story/01-idea.md", "Claude", "pick a premise"],
  ["2", "01-story/02-outline.md — beats, clue map, real timeline", "Claude", "outline"],
  ["3–4", "01-story/03-script-prompts.md — writer + editor prompts", "Claude", "draft + edit"],
  ["★", "01-story/script-final.md — **locked script**", "You", "read aloud + lock"],
  ["5", "02-characters/character-bible.md", "—", "fill in"],
  ["6", "02-characters/character-image-prompts.md", "Image AI", "generate + approve faces"],
  ["7", "03-locations/location-prompts.md", "Image AI", "generate locations"],
  ["8", "04-shots/shot-list.md", "—", "write shot list"],
  ["9", "04-shots/image-prompts.md", "Image AI", "generate shots"],
  ["10", "04-shots/video-prompts.md", "Video AI", "animate key shots"],
  ["11", "05-voice/voice-setup.md", "Voice AI", "design voice + record"],
  ["12", "06-music-sfx/cue-sheet.md", "Music library", "pick tracks + SFX"],
  ["13", "07-edit/edit-plan.md", "CapCut / DaVinci", "assemble"],
  ["14", "08-packaging/title-description-thumbnail.md", "Claude + image AI + Canva", "thumbnail"],
  ["15", "09-shorts/shorts-scripts.md", "CapCut", "cut Shorts"],
  ["16", "10-rights/license-log.md", "—", "fill in"],
];

export async function createEpisode(_prev: { error?: string } | undefined, form: FormData) {
  const title = String(form.get("title") ?? "").trim();
  const logline = String(form.get("logline") ?? "").trim();
  const storyShape = String(form.get("storyShape") ?? "").trim();
  if (!title) return { error: "Title is required." };

  const folder = await nextEpisodeFolder();
  const next = Number(folder.split("_")[1]);
  const code = `EP${String(next).padStart(3, "0")}`;
  const dir = path.join(REPO_ROOT, folder);

  const rows = STEP_TEMPLATE.map(([label, file, tool, todo]) => {
    const [f, ...desc] = file.split(" — ");
    const cell = `[${f}](${f})${desc.length ? ` — ${desc.join(" — ")}` : ""}`;
    return `| ${label} | ${cell} | ${tool} | ⬜ ${todo} |`;
  });

  const readme = [
    `# ${code} — ${title}`,
    "",
    "| | |",
    "|---|---|",
    `| **Logline** | ${logline || "TBD"} |`,
    `| **Length** | ~14 min |`,
    `| **Story shape** | ${storyShape || "TBD"} |`,
    "",
    "## Files — in the order you use them",
    "",
    "| Step | File | Tool | Status |",
    "|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");

  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.writeFile(path.join(dir, "README.md"), readme, { encoding: "utf8", flag: "wx" });
  } catch {
    return { error: `${folder}/README.md already exists.` };
  }
  await importEpisodeFolder(folder);
  const ids = (k: string) => form.getAll(k).map(String).filter((x) => /^[a-f0-9]{24}$/.test(x));
  const story = String(form.get("story") ?? "");
  await Episode.updateOne(
    { code },
    {
      $set: {
        libraryStory: /^[a-f0-9]{24}$/.test(story) ? story : "",
        libraryCast: ids("cast"),
        libraryLocations: ids("locations"),
      },
    },
  );
  redirect(`/episodes/${code}/step/01-story/01-idea`);
}
