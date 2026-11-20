import fs from "node:fs/promises";
import path from "node:path";
import { safeRepoPath } from "@/lib/paths";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

/** Serves generated media from video_N/assets/ and library/assets/ only. */
export async function GET(_req: Request, ctx: RouteContext<"/api/files/[...path]">) {
  const { path: parts } = await ctx.params;
  const rel = parts.map(decodeURIComponent).join("/");
  const type = TYPES[path.extname(rel).toLowerCase()];
  const abs = /^(video_\d+|library)\/assets\//.test(rel) ? safeRepoPath(rel) : null;
  if (!abs || !type) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(abs);
    return new Response(data, {
      headers: { "Content-Type": type, "Cache-Control": "no-cache" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
