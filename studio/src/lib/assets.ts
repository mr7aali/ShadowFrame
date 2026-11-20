import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { connectDB } from "./db";
import type { AssetView } from "./library";
import { Asset, Episode, LibraryItem } from "./models";
import { REPO_ROOT, safeRepoPath } from "./paths";

const ID = /^[a-f0-9]{24}$/;

function plain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export function assetPathOk(rel: string) {
  return (/^library\/assets\//.test(rel) || /^video_\d+\/assets\//.test(rel)) && !!safeRepoPath(rel);
}

async function assetTarget(ctx: { item?: string; episode?: string; kind: string }, ext: string) {
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14) + Math.random().toString(36).slice(2, 5);
  const kind = ctx.kind.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "other";
  if (ctx.episode) {
    const ep = await Episode.findOne({ code: ctx.episode }, { folder: 1 }).lean();
    if (!ep) throw new Error("Episode not found");
    return `${ep.folder}/assets/gallery/${kind}-${stamp}${ext}`;
  }
  if (ctx.item && ID.test(ctx.item)) {
    const item = await LibraryItem.findById(ctx.item, { type: 1, slug: 1 }).lean();
    if (item) return `library/assets/${item.type}/${item.slug}/${stamp}${ext}`;
  }
  return `library/assets/other/${kind}-${stamp}${ext}`;
}

export async function saveAsset(
  data: Buffer,
  ext: string,
  ctx: { item?: string; episode?: string; kind: string; title?: string; prompt?: string },
  source: "generated" | "uploaded",
  model = "",
): Promise<AssetView> {
  await connectDB();
  const rel = await assetTarget(ctx, ext);
  const abs = path.join(REPO_ROOT, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, data);
  const doc = await Asset.create({
    episode: ctx.episode ?? "",
    item: ctx.item && ID.test(ctx.item) ? ctx.item : "",
    kind: ctx.kind,
    title: (ctx.title ?? "").slice(0, 200),
    prompt: (ctx.prompt ?? "").slice(0, 8000),
    path: rel,
    source,
    model,
  });
  // The first image of a library item becomes its main image.
  if (doc.item) await LibraryItem.updateOne({ _id: doc.item, image: "" }, { $set: { image: rel } });
  return plain(doc.toObject());
}


export async function removeFile(rel: string) {
  if (!assetPathOk(rel)) return;
  try {
    await fs.unlink(path.join(REPO_ROOT, rel));
  } catch {}
}
