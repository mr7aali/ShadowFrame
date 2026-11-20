import path from "node:path";
import { saveAsset } from "@/lib/assets";

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MAX_BYTES = 30 * 1024 * 1024;

/** Upload an image you made elsewhere. FormData: file, kind, item, episode, title, prompt. */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return Response.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Images up to 30 MB" }, { status: 413 });
  const ext = path.extname(file.name).toLowerCase();
  if (!IMAGE_EXT.has(ext)) return Response.json({ error: "Use PNG, JPG or WebP" }, { status: 400 });
  try {
    const asset = await saveAsset(
      Buffer.from(await file.arrayBuffer()),
      ext === ".jpeg" ? ".jpg" : ext,
      {
        kind: String(form.get("kind") || "other"),
        item: String(form.get("item") || ""),
        episode: String(form.get("episode") || ""),
        title: String(form.get("title") || file.name).slice(0, 200),
        prompt: String(form.get("prompt") || ""),
      },
      "uploaded",
    );
    return Response.json({ asset });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
