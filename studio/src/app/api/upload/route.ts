import fs from "node:fs/promises";
import path from "node:path";
import { connectDB } from "@/lib/db";
import { Character, Episode, Location, Shot } from "@/lib/models";
import { REPO_ROOT } from "@/lib/paths";

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov"]);
const MAX_BYTES = 300 * 1024 * 1024;

/**
 * Saves a generated file into the episode's assets folder, using the naming the
 * guides already use (shot_07.png, mara_front.png, L1.png), and records it.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const kind = String(form.get("kind"));
  const id = String(form.get("id"));
  const field = form.get("field") === "video" ? "video" : "image";
  const file = form.get("file");

  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "File too large" }, { status: 413 });

  const ext = path.extname(file.name).toLowerCase();

  // Music bed for the final mix: saved as assets/music/bed.(mp3|wav|m4a), replacing the old one
  if (kind === "music") {
    if (![".mp3", ".wav", ".m4a"].includes(ext)) return Response.json({ error: "Use .mp3, .wav or .m4a" }, { status: 400 });
    await connectDB();
    const episode = await Episode.findOne({ code: String(form.get("code")) }, { folder: 1 }).lean();
    if (!episode) return Response.json({ error: "Episode not found" }, { status: 404 });
    const dir = path.join(REPO_ROOT, episode.folder, "assets", "music");
    await fs.mkdir(dir, { recursive: true });
    for (const old of [".mp3", ".wav", ".m4a"]) await fs.rm(path.join(dir, `bed${old}`), { force: true });
    await fs.writeFile(path.join(dir, `bed${ext}`), Buffer.from(await file.arrayBuffer()));
    return Response.json({ path: `${episode.folder}/assets/music/bed${ext}` });
  }

  // Narration recorded elsewhere: saved as assets/voice/vo_01_hook.mp3
  if (kind === "voice") {
    const name = String(form.get("name"));
    if (!/^vo_\d{2}_[a-z0-9-]+$/.test(name)) return Response.json({ error: "Bad name" }, { status: 400 });
    if (ext !== ".mp3") return Response.json({ error: "Use .mp3" }, { status: 400 });
    await connectDB();
    const episode = await Episode.findOne({ code: String(form.get("code")) }, { folder: 1 }).lean();
    if (!episode) return Response.json({ error: "Episode not found" }, { status: 404 });
    const rel = `${episode.folder}/assets/voice/${name}.mp3`;
    const abs = path.join(REPO_ROOT, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, Buffer.from(await file.arrayBuffer()));
    return Response.json({ path: rel });
  }

  const allowed = field === "video" ? VIDEO_EXT : IMAGE_EXT;
  if (!allowed.has(ext))
    return Response.json({ error: `Use ${[...allowed].join(", ")}` }, { status: 400 });

  await connectDB();

  let episodeCode: string;
  let target: string; // relative to the episode folder
  let model: typeof Shot | typeof Character | typeof Location;

  if (kind === "shot") {
    const shot = await Shot.findById(id).lean();
    if (!shot) return Response.json({ error: "Shot not found" }, { status: 404 });
    const n = String(shot.number).padStart(2, "0");
    episodeCode = shot.episode;
    target = field === "video" ? `assets/video/shot_${n}${ext}` : `assets/images/shot_${n}${ext}`;
    model = Shot;
  } else if (kind === "character") {
    const c = await Character.findById(id).lean();
    if (!c) return Response.json({ error: "Character not found" }, { status: 404 });
    episodeCode = c.episode;
    target = `assets/references/${c.slug}_front${ext}`;
    model = Character;
  } else if (kind === "location") {
    const l = await Location.findById(id).lean();
    if (!l) return Response.json({ error: "Location not found" }, { status: 404 });
    episodeCode = l.episode;
    target = `assets/references/${l.code}${ext}`;
    model = Location;
  } else {
    return Response.json({ error: "Bad kind" }, { status: 400 });
  }

  const episode = await Episode.findOne({ code: episodeCode }, { folder: 1 }).lean();
  if (!episode) return Response.json({ error: "Episode not found" }, { status: 404 });

  const rel = `${episode.folder}/${target}`;
  const abs = path.join(REPO_ROOT, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, Buffer.from(await file.arrayBuffer()));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = model as any;
  await m.updateOne({ _id: id }, { $set: { [field]: rel } });
  // First upload moves the item from "todo" to "generated"; review is still yours.
  if (field === "image") await m.updateOne({ _id: id, status: "todo" }, { $set: { status: "generated" } });

  return Response.json({ path: rel });
}
