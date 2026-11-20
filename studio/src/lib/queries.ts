import "server-only";
import { connection } from "next/server";
import { connectDB } from "./db";
import { Character, Episode, Location, PromptRun, Shot } from "./models";

/** Mongo docs → plain JSON (string ids, ISO dates) safe to pass to client components. */
function plain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export type Step = {
  _id: string;
  order: number;
  label: string;
  title: string;
  file: string;
  tool: string;
  status: "todo" | "in_progress" | "done";
  note: string;
};

export type EpisodeView = {
  _id: string;
  code: string;
  title: string;
  folder: string;
  logline: string;
  length: string;
  style: string;
  storyShape: string;
  cast: string;
  steps: Step[];
  updatedAt: string;
  libraryStory?: string;
  libraryCast?: string[];
  libraryLocations?: string[];
};

export type AssetStatus = "todo" | "generated" | "approved" | "rejected";

export type ShotView = {
  _id: string;
  episode: string;
  number: number;
  section: string;
  narration: string;
  characters: string;
  location: string;
  motion: string;
  animated: boolean;
  refs: string[];
  imagePrompt: string;
  videoPrompt: string;
  overlay: string;
  status: AssetStatus;
  image: string;
  video: string;
  notes: string;
};

export type CharacterView = {
  _id: string;
  episode: string;
  slug: string;
  name: string;
  prompts: { label: string; text: string }[];
  status: AssetStatus;
  image: string;
  notes: string;
  updatedAt?: string;
};

export type LocationView = {
  _id: string;
  episode: string;
  code: string;
  name: string;
  usedIn: string;
  prompt: string;
  status: AssetStatus;
  image: string;
  notes: string;
  updatedAt?: string;
};

export type PromptRunView = {
  _id: string;
  template: string;
  blockIndex: number;
  episode: string;
  title: string;
  values: Record<string, string>;
  filled: string;
  output: string;
  createdAt: string;
};

export type EpisodeSummary = EpisodeView & {
  stepsDone: number;
  shotsTotal: number;
  shotsApproved: number;
};

async function ready() {
  await connection(); // DB data is per-request, never part of the static shell
  await connectDB();
}

export async function getEpisodes(): Promise<EpisodeSummary[]> {
  await ready();
  const [episodes, shotStats] = await Promise.all([
    Episode.find().sort({ code: 1 }).lean(),
    Shot.aggregate<{ _id: string; total: number; approved: number }>([
      {
        $group: {
          _id: "$episode",
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
        },
      },
    ]),
  ]);
  const stats = new Map(shotStats.map((s) => [s._id, s]));
  return plain<EpisodeView[]>(episodes).map((e) => ({
    ...e,
    stepsDone: e.steps.filter((s) => s.status === "done").length,
    shotsTotal: stats.get(e.code)?.total ?? 0,
    shotsApproved: stats.get(e.code)?.approved ?? 0,
  }));
}

export async function getEpisode(code: string): Promise<EpisodeView | null> {
  await ready();
  const doc = await Episode.findOne({ code }).lean();
  return doc ? plain<EpisodeView>(doc) : null;
}

export async function getEpisodeCodes(): Promise<{ code: string; title: string }[]> {
  await ready();
  return plain(await Episode.find({}, { code: 1, title: 1 }).sort({ code: 1 }).lean());
}

export async function getShots(episode: string): Promise<ShotView[]> {
  await ready();
  return plain(await Shot.find({ episode }).sort({ number: 1 }).lean());
}

export async function getCharacters(episode: string): Promise<CharacterView[]> {
  await ready();
  return plain(await Character.find({ episode }).sort({ createdAt: 1 }).lean());
}

export async function getLocations(episode: string): Promise<LocationView[]> {
  await ready();
  const docs = plain<LocationView[]>(await Location.find({ episode }).lean());
  return docs.sort((a, b) => Number(a.code.slice(1)) - Number(b.code.slice(1)));
}

export async function getPromptRuns(template: string): Promise<PromptRunView[]> {
  await ready();
  return plain(await PromptRun.find({ template }).sort({ createdAt: -1 }).limit(50).lean());
}

export async function getRecentPromptRuns(limit = 8): Promise<PromptRunView[]> {
  await ready();
  return plain(await PromptRun.find().sort({ createdAt: -1 }).limit(limit).lean());
}
