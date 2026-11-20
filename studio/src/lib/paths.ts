import path from "node:path";

/**
 * The channel repo (guides/, prompts/, templates/, video_N/) lives one level
 * above the studio app. Markdown files there stay the source of truth for
 * guides and prompt templates; the app reads them directly from disk.
 */
export const REPO_ROOT = path.resolve(
  process.env.REPO_ROOT ?? path.join(process.cwd(), ".."),
);

/** Resolve a repo-relative path and refuse anything that escapes the repo. */
export function safeRepoPath(relative: string): string | null {
  const abs = path.resolve(REPO_ROOT, relative);
  const rel = path.relative(REPO_ROOT, abs);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  if (rel.split(path.sep).some((part) => part.startsWith("."))) return null;
  return abs;
}

/** Normalise to forward slashes for URLs and storage. */
export function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}
