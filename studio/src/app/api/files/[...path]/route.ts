import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import { Readable } from "node:stream";
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
  ".m4a": "audio/mp4",
  ".srt": "text/plain; charset=utf-8",
};

/** Serves generated media from video_N/assets/, video_N/export/ and library/assets/ only. */
export async function GET(req: Request, ctx: RouteContext<"/api/files/[...path]">) {
  const { path: parts } = await ctx.params;
  const rel = parts.map(decodeURIComponent).join("/");
  const type = TYPES[path.extname(rel).toLowerCase()];
  const abs = /^(video_\d+\/(assets|export)|library\/assets)\//.test(rel) ? safeRepoPath(rel) : null;
  if (!abs || !type) return new Response("Not found", { status: 404 });

  let size: number;
  try {
    size = (await fs.stat(abs)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Cache-Control": "no-cache",
    "Accept-Ranges": "bytes",
  };
  if (new URL(req.url).searchParams.has("download"))
    headers["Content-Disposition"] = `attachment; filename="${path.basename(rel)}"`;

  // Range requests let the video player seek without loading the whole file.
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const stream = createReadStream(abs, { start, end });
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const stream = createReadStream(abs);
  return new Response(Readable.toWeb(stream) as ReadableStream, { headers: { ...headers, "Content-Length": String(size) } });
}
