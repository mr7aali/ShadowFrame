import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { connectDB } from "./db";
import { Asset, Character, Location, RenderJob, Shot } from "./models";
import { REPO_ROOT } from "./paths";
import { musicBed } from "./render";
import { splitScript } from "./voice-sections";
import { readEpisodeFile } from "./workspace";

/** What each module has produced (beyond its documents). */
export type MediaStatus = { label: string; done: number; total: number };

export type RenderJobView = {
  _id: string;
  status: "running" | "done" | "error" | "canceled";
  step: string;
  progress: number;
  log: string;
  output: string;
  captions: string;
  seconds: number;
  options: { resolution: string; music: boolean; musicVolume: number };
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
};

async function exists(rel: string) {
  try {
    await fs.access(path.join(REPO_ROOT, rel));
    return true;
  } catch {
    return false;
  }
}

export async function getLatestRender(code: string): Promise<RenderJobView | null> {
  await connection();
  await connectDB();
  const job = await RenderJob.findOne({ episode: code }).sort({ createdAt: -1 }).lean();
  return job ? (JSON.parse(JSON.stringify(job)) as RenderJobView) : null;
}

/** The finished video, if one has been rendered and still exists on disk. */
export async function getFinalVideo(code: string): Promise<RenderJobView | null> {
  await connectDB();
  const job = await RenderJob.findOne({ episode: code, status: "done" }).sort({ createdAt: -1 }).lean();
  if (!job?.output || !(await exists(job.output))) return null;
  return JSON.parse(JSON.stringify(job)) as RenderJobView;
}

export async function getMediaStatus(code: string, folder: string): Promise<Record<string, MediaStatus>> {
  await connection();
  await connectDB();
  const [sections, characters, locations, shots, bed, final, thumbs] = await Promise.all([
    readEpisodeFile(folder, "01-story/script-final.md").then(splitScript),
    Character.find({ episode: code }, { image: 1 }).lean(),
    Location.find({ episode: code }, { image: 1 }).lean(),
    Shot.find({ episode: code }, { image: 1, video: 1, animated: 1 }).lean(),
    musicBed(folder),
    getFinalVideo(code),
    Asset.countDocuments({ episode: code, kind: "thumbnail" }),
  ]);
  const recorded = (
    await Promise.all(sections.map((s) => exists(`${folder}/assets/voice/${s.name}.mp3`)))
  ).filter(Boolean).length;
  const animated = shots.filter((s) => s.animated);

  return {
    voice: { label: "narration files", done: recorded, total: sections.length },
    cast: {
      label: "faces & locations locked",
      done: [...characters, ...locations].filter((x) => x.image).length,
      total: characters.length + locations.length,
    },
    shots: { label: "shot images", done: shots.filter((s) => s.image).length, total: shots.length },
    motion: { label: "animated clips", done: animated.filter((s) => s.video).length, total: animated.length },
    music: { label: "music bed", done: bed ? 1 : 0, total: 1 },
    render: { label: "final video", done: final ? 1 : 0, total: 1 },
    publish: { label: "thumbnail", done: thumbs ? 1 : 0, total: 1 },
  };
}

/** True when a module's media work is finished (no media work counts as finished). */
export function mediaComplete(key: string, m: MediaStatus | undefined) {
  if (!m) return true;
  if (m.total === 0) return key === "motion"; // no 🎬 shots → nothing to animate
  return m.done >= m.total;
}

/** A module is done only when its documents AND its media are done. */
export function withMedia<T extends { key: string; status: string }>(stages: T[], media: Record<string, MediaStatus>): T[] {
  return stages.map((s) => (s.status === "done" && !mediaComplete(s.key, media[s.key]) ? { ...s, status: "in_progress" } : s));
}
