import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { ALL_FILES, PIPELINE, type PipelineFile, type PipelineStage } from "./pipeline";
import { REPO_ROOT } from "./paths";
import { getEpisode, type EpisodeView, type Step } from "./queries";

export type FileStatus = "todo" | "in_progress" | "done";

export type WorkspaceFile = PipelineFile & {
  stageKey: string;
  index: number;
  status: FileStatus;
  locked: boolean;
  words: number;
  /** Repo-relative path, e.g. video_2/01-story/01-idea.md */
  repoPath: string;
};

export type WorkspaceStage = Omit<PipelineStage, "files"> & {
  files: WorkspaceFile[];
  status: FileStatus | "locked";
  done: number;
};

export type Workspace = {
  episode: EpisodeView;
  stages: WorkspaceStage[];
  files: WorkspaceFile[];
  /** The first file that isn't done (where "Continue" goes). */
  current: WorkspaceFile | null;
  done: number;
};

export function episodeFilePath(folder: string, rel: string): string {
  if (!/^video_\d+$/.test(folder) || rel.includes("..")) throw new Error("Bad path");
  return path.join(REPO_ROOT, folder, rel);
}

export async function readEpisodeFile(folder: string, rel: string): Promise<string> {
  try {
    return await fs.readFile(episodeFilePath(folder, rel), "utf8");
  } catch {
    return "";
  }
}

export async function writeEpisodeFile(folder: string, rel: string, content: string) {
  const abs = episodeFilePath(folder, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content.replace(/\r\n/g, "\n"), "utf8");
}

function countWords(md: string) {
  return md.trim() ? md.trim().split(/\s+/).length : 0;
}

export function stepForFile(steps: Step[], repoPath: string): Step | undefined {
  return steps.find((s) => s.file === repoPath);
}

export async function getWorkspace(code: string): Promise<Workspace | null> {
  const episode = await getEpisode(code);
  if (!episode) return null;

  const contents = await Promise.all(ALL_FILES.map(({ file }) => readEpisodeFile(episode.folder, file.path)));

  let blocked = false;
  const files: WorkspaceFile[] = ALL_FILES.map(({ stage, file, index }) => {
    const repoPath = `${episode.folder}/${file.path}`;
    const status = (stepForFile(episode.steps, repoPath)?.status ?? "todo") as FileStatus;
    const locked = blocked;
    if (status !== "done") blocked = true;
    return { ...file, stageKey: stage.key, index, status, locked, words: countWords(contents[index]), repoPath };
  });

  const stages: WorkspaceStage[] = PIPELINE.map((stage) => {
    const sf = files.filter((x) => x.stageKey === stage.key);
    const done = sf.filter((x) => x.status === "done").length;
    const status: WorkspaceStage["status"] =
      done === sf.length
        ? "done"
        : sf[0].locked
          ? "locked"
          : sf.some((x) => x.status !== "todo" || x.words > 0) || done > 0
            ? "in_progress"
            : "todo";
    return { ...stage, files: sf, status, done };
  });

  return {
    episode,
    stages,
    files,
    current: files.find((x) => x.status !== "done") ?? null,
    done: files.filter((x) => x.status === "done").length,
  };
}
