import "server-only";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { connectDB } from "./db";
import { Episode, RenderJob, Shot } from "./models";
import { REPO_ROOT } from "./paths";
import { splitScript, type VoiceSection } from "./voice-sections";
import { readEpisodeFile } from "./workspace";

/**
 * Assembles the final video with ffmpeg:
 *   narration (one file per script section) sets the timing,
 *   each shot fills an equal share of its section's narration,
 *   stills get the slow camera move from the shot list (IN, OUT, L→R …),
 *   animated shots use their clip, missing shots get a placeholder card,
 *   then the music bed is mixed under the voice (ducked) and captions are written.
 */

export const FFMPEG = process.env.FFMPEG_PATH || ffmpegInstaller.path;
const FPS = 30;
const SHOT_SECONDS_WITHOUT_VOICE = 4;
const MIN_SHOT_SECONDS = 0.5;
const FONT = "C:/Windows/Fonts/arial.ttf";

export type RenderOptions = { resolution: "720p" | "1080p"; music: boolean; musicVolume: number };

// Running ffmpeg processes per episode, so a render can be canceled.
const globalJobs = globalThis as unknown as { __renders?: Map<string, { child: ChildProcess | null; canceled: boolean }> };
const running = (globalJobs.__renders ??= new Map());

/* ---------- ffmpeg helpers ---------- */

function run(args: string[], episode: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG, ["-hide_banner", "-y", ...args], { windowsHide: true });
    const state = running.get(episode);
    if (state) state.child = child;
    let err = "";
    child.stderr.on("data", (d) => {
      err = (err + d.toString()).slice(-6000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (state) state.child = null;
      if (state?.canceled) reject(new Error("Canceled"));
      else if (code === 0) resolve(err);
      else reject(new Error(err.split("\n").filter(Boolean).slice(-6).join("\n") || `ffmpeg exited with ${code}`));
    });
  });
}

/** Media duration in seconds (ffmpeg prints it to stderr). */
export async function probeDuration(file: string): Promise<number> {
  const out = await new Promise<string>((resolve) => {
    const child = spawn(FFMPEG, ["-hide_banner", "-i", file], { windowsHide: true });
    let err = "";
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("close", () => resolve(err));
    child.on("error", () => resolve(""));
  });
  const m = out.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
}

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/* ---------- Planning ---------- */

export type PlannedShot = {
  number: number;
  section: string;
  narration: string;
  motion: string;
  kind: "clip" | "image" | "placeholder";
  file: string; // absolute, "" for placeholder
  start: number; // seconds
  frames: number;
};

export type RenderPlan = {
  shots: PlannedShot[];
  /** seconds = narration length; slot = picture time the section's audio is padded to. */
  sections: (VoiceSection & { voice: string; seconds: number; start: number; slot: number })[];
  seconds: number;
  counts: { shots: number; images: number; clips: number; voiced: number; sections: number };
  music: string; // absolute path or ""
};

function norm(s: string) {
  return s.toLowerCase().replace(/\[[^\]]*\]/g, "").replace(/[^a-z]+/g, " ").trim();
}

export async function musicBed(folder: string): Promise<string> {
  for (const ext of [".mp3", ".wav", ".m4a"]) {
    const p = path.join(REPO_ROOT, folder, "assets", "music", `bed${ext}`);
    if (await exists(p)) return p;
  }
  return "";
}

export async function planRender(code: string): Promise<RenderPlan> {
  await connectDB();
  const ep = await Episode.findOne({ code }, { folder: 1 }).lean();
  if (!ep) throw new Error("Episode not found");
  const folder = ep.folder;
  const shots = await Shot.find({ episode: code }).sort({ number: 1 }).lean();
  const sections = splitScript(await readEpisodeFile(folder, "01-story/script-final.md"));

  // Narration file + duration per section
  const voiced = await Promise.all(
    sections.map(async (s) => {
      const voice = path.join(REPO_ROOT, folder, "assets", "voice", `${s.name}.mp3`);
      const ok = await exists(voice);
      return { ...s, voice: ok ? voice : "", seconds: ok ? await probeDuration(voice) : 0, start: 0, slot: 0 };
    }),
  );

  // Which section each shot belongs to (by section name, else the previous shot's section)
  const groups: number[] = [];
  let last = 0;
  for (const s of shots) {
    const key = norm(s.section);
    let idx = key ? voiced.findIndex((v) => norm(v.heading).includes(key) || key.includes(norm(v.heading).split(" ")[0] || "#")) : -1;
    if (idx < 0) idx = Math.min(last, Math.max(0, voiced.length - 1));
    groups.push(idx);
    last = idx;
  }

  // Seconds per shot: an equal share of its section's narration (or a default without voice).
  // Each section gets a "slot" = the picture time of its shots; its audio is padded to fill it,
  // so picture and sound always stay in sync.
  const secs = shots.map(() => SHOT_SECONDS_WITHOUT_VOICE);
  const slot = voiced.map(() => 0);
  const extensions: [number, number][] = []; // [shot index, extra seconds]
  voiced.forEach((v, i) => {
    const members = shots.map((_, k) => k).filter((k) => groups[k] === i);
    if (!members.length) {
      // A narrated section with no shots: hold the previous shot (or the next one) over it.
      if (v.seconds) {
        const prev = groups.lastIndexOf(i - 1);
        const target = prev >= 0 ? prev : groups.findIndex((g) => g > i);
        if (target >= 0) {
          extensions.push([target, v.seconds]);
          slot[i] = v.seconds;
        }
      }
      return;
    }
    const total = v.seconds || members.length * SHOT_SECONDS_WITHOUT_VOICE;
    for (const k of members) secs[k] = Math.max(MIN_SHOT_SECONDS, total / members.length);
    slot[i] = members.reduce((n, k) => n + secs[k], 0);
  });
  for (const [k, extra] of extensions) secs[k] += extra;

  // Frames from cumulative time, so rounding never drifts out of sync with the voice.
  const planned: PlannedShot[] = [];
  let t = 0;
  for (let k = 0; k < shots.length; k++) {
    const s = shots[k];
    const frames = Math.max(1, Math.round((t + secs[k]) * FPS) - Math.round(t * FPS));
    const clip = s.animated && s.video ? path.join(REPO_ROOT, s.video) : "";
    const img = s.image ? path.join(REPO_ROOT, s.image) : "";
    const kind: PlannedShot["kind"] = clip && (await exists(clip)) ? "clip" : img && (await exists(img)) ? "image" : "placeholder";
    planned.push({
      number: s.number,
      section: s.section,
      narration: s.narration,
      motion: s.motion,
      kind,
      file: kind === "clip" ? clip : kind === "image" ? img : "",
      start: t,
      frames,
    });
    t += secs[k];
  }

  // Section start times (for captions) and the audio slot each section fills
  let st = 0;
  for (let i = 0; i < voiced.length; i++) {
    voiced[i].start = st;
    voiced[i].slot = slot[i];
    st += slot[i];
  }

  return {
    shots: planned,
    sections: voiced,
    seconds: planned.reduce((n, p) => n + p.frames / FPS, 0),
    counts: {
      shots: shots.length,
      images: planned.filter((p) => p.kind === "image").length,
      clips: planned.filter((p) => p.kind === "clip").length,
      voiced: voiced.filter((v) => v.voice).length,
      sections: voiced.length,
    },
    music: await musicBed(folder),
  };
}

/* ---------- Segments ---------- */

function motionFilter(motion: string, frames: number, w: number, h: number) {
  const m = motion.toUpperCase().replace(/\s/g, "");
  const d = frames;
  const cx = "iw/2-(iw/zoom/2)";
  const cy = "ih/2-(ih/zoom/2)";
  let z = `1.04+0.02*on/${d}`;
  let x = cx;
  let y = cy;
  if (m.startsWith("IN")) z = `1+0.15*on/${d}`;
  else if (m.startsWith("OUT")) z = `1.15-0.15*on/${d}`;
  else if (m.includes("L→R") || m.includes("L->R")) {
    z = "1.12";
    x = `(iw-iw/zoom)*on/${d}`;
  } else if (m.includes("R→L") || m.includes("R->L")) {
    z = "1.12";
    x = `(iw-iw/zoom)*(1-on/${d})`;
  } else if (m.startsWith("UP")) {
    z = "1.12";
    y = `(ih-ih/zoom)*(1-on/${d})`;
  } else if (m.startsWith("DOWN")) {
    z = "1.12";
    y = `(ih-ih/zoom)*on/${d}`;
  }
  const W = Math.round(w * 1.5);
  const H = Math.round(h * 1.5);
  return `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},zoompan=z='${z}':x='${x}':y='${y}':d=${d}:s=${w}x${h}:fps=${FPS},setsar=1,format=yuv420p`;
}

const ENCODE = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(FPS), "-an"];

async function renderSegment(p: PlannedShot, out: string, w: number, h: number, episode: string, hasFont: boolean) {
  const secs = (p.frames / FPS).toFixed(3);
  if (p.kind === "clip") {
    await run(
      ["-stream_loop", "-1", "-i", p.file, "-t", secs, "-vf", `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=${FPS}`, "-frames:v", String(p.frames), ...ENCODE, out],
      episode,
    );
  } else if (p.kind === "image") {
    await run(["-i", p.file, "-vf", motionFilter(p.motion, p.frames, w, h), "-frames:v", String(p.frames), ...ENCODE, out], episode);
  } else {
    const label = `Shot ${String(p.number).padStart(2, "0")} — no image yet`;
    const text = hasFont
      ? `,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='${label.replace(/[':\\]/g, "")}':fontcolor=0x9aa0aa:fontsize=${Math.round(h / 22)}:x=(w-text_w)/2:y=(h-text_h)/2`
      : "";
    await run(["-f", "lavfi", "-i", `color=c=0x15171c:s=${w}x${h}:r=${FPS}`, "-vf", `format=yuv420p${text}`, "-frames:v", String(p.frames), ...ENCODE, out], episode);
  }
}

/* ---------- Captions (approximate: sentences spread over each section's narration) ---------- */

function srtTime(t: number) {
  const ms = Math.max(0, Math.round(t * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
}

function buildSrt(plan: RenderPlan) {
  const cues: string[] = [];
  let n = 1;
  for (const s of plan.sections) {
    if (!s.voice || !s.seconds) continue;
    const sentences = s.text.replace(/\s+/g, " ").split(/(?<=[.!?…"”])\s+/).filter((x) => x.trim());
    const chars = sentences.reduce((a, x) => a + x.length, 0) || 1;
    let t = s.start;
    for (const sentence of sentences) {
      const dur = (sentence.length / chars) * s.seconds;
      // Split long sentences into ~2-line captions
      const words = sentence.split(" ");
      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += 14) chunks.push(words.slice(i, i + 14).join(" "));
      for (const c of chunks) {
        const d = dur * (c.length / sentence.length);
        cues.push(`${n++}\n${srtTime(t)} --> ${srtTime(t + d)}\n${c}\n`);
        t += d;
      }
    }
  }
  return cues.join("\n");
}

/* ---------- The job ---------- */

async function update(id: string, set: Record<string, unknown>) {
  await RenderJob.updateOne({ _id: id }, { $set: set });
}

export async function startRender(code: string, options: RenderOptions): Promise<string> {
  await connectDB();
  const ep = await Episode.findOne({ code }, { folder: 1 }).lean();
  if (!ep) throw new Error("Episode not found");
  if (running.has(code)) throw new Error("A render is already running for this episode.");
  await RenderJob.updateMany({ episode: code, status: "running" }, { $set: { status: "canceled", step: "Interrupted" } });

  const job = await RenderJob.create({ episode: code, status: "running", step: "Planning", progress: 0, options });
  const id = String(job._id);
  running.set(code, { child: null, canceled: false });
  // Runs in the background; the page polls the job document.
  void execute(id, code, ep.folder, options).finally(() => running.delete(code));
  return id;
}

export function cancelRender(code: string) {
  const state = running.get(code);
  if (!state) return false;
  state.canceled = true;
  state.child?.kill();
  return true;
}

async function execute(id: string, code: string, folder: string, opt: RenderOptions) {
  const [w, h] = opt.resolution === "1080p" ? [1920, 1080] : [1280, 720];
  const exportDir = path.join(REPO_ROOT, folder, "export");
  const tmp = path.join(exportDir, "render-tmp");
  try {
    const plan = await planRender(code);
    if (!plan.shots.length) throw new Error("No shots yet. Complete the shot list (Shots module) first.");
    await fs.rm(tmp, { recursive: true, force: true });
    await fs.mkdir(tmp, { recursive: true });
    const hasFont = await exists(FONT);

    // 1. One video segment per shot (≈85% of the work)
    const segs: string[] = [];
    for (let i = 0; i < plan.shots.length; i++) {
      const p = plan.shots[i];
      await update(id, { step: `Shot ${i + 1} of ${plan.shots.length} (${p.kind})`, progress: Math.round((i / plan.shots.length) * 85) });
      const out = path.join(tmp, `seg_${String(i).padStart(3, "0")}.mp4`);
      await renderSegment(p, out, w, h, code, hasFont);
      segs.push(out);
    }

    // 2. Join the segments
    await update(id, { step: "Joining shots", progress: 86 });
    const list = path.join(tmp, "list.txt");
    await fs.writeFile(list, segs.map((s) => `file '${s.replace(/\\/g, "/")}'`).join("\n"));
    const video = path.join(tmp, "video.mp4");
    await run(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", video], code);

    // 3. Narration track: voice files in order, silence where a section has no voice yet
    await update(id, { step: "Building the narration track", progress: 90 });
    const narration = path.join(tmp, "narration.wav");
    const audioInputs: string[] = [];
    const parts: string[] = [];
    let n = 0;
    for (const s of plan.sections) {
      if (s.slot < 0.05) continue; // nothing on screen for this section
      const len = s.slot.toFixed(3);
      if (s.voice) audioInputs.push("-i", s.voice);
      else audioInputs.push("-f", "lavfi", "-t", len, "-i", "anullsrc=r=44100:cl=stereo");
      // Pad (or trim) each section to exactly its picture time
      parts.push(
        `[${n}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo,apad=whole_len=${Math.round(s.slot * 44100)},atrim=0:${len},asetpts=N/SR/TB[a${n}]`,
      );
      n++;
    }
    if (n) {
      await run(
        [...audioInputs, "-filter_complex", `${parts.join(";")};${Array.from({ length: n }, (_, i) => `[a${i}]`).join("")}concat=n=${n}:v=0:a=1[out]`, "-map", "[out]", narration],
        code,
      );
    } else {
      await run(["-f", "lavfi", "-t", plan.seconds.toFixed(3), "-i", "anullsrc=r=44100:cl=stereo", narration], code);
    }

    // 4. Mix music under the voice (ducked) and mux with the video
    await update(id, { step: plan.music && opt.music ? "Mixing music and voice" : "Adding the voice", progress: 94 });
    await fs.mkdir(exportDir, { recursive: true });
    const outRel = `${folder}/export/${code}_final.mp4`;
    const outAbs = path.join(REPO_ROOT, outRel);
    const partial = path.join(tmp, "final.mp4");
    if (plan.music && opt.music) {
      const vol = Math.min(1, Math.max(0, opt.musicVolume));
      await run(
        [
          "-i", video, "-i", narration, "-stream_loop", "-1", "-i", plan.music,
          "-filter_complex",
          `[1:a]asplit=2[v1][v2];[2:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${vol}[m];[m][v1]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=500[duck];[v2][duck]amix=inputs=2:duration=first:dropout_transition=0,volume=2[a]`,
          "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", partial,
        ],
        code,
      );
    } else {
      await run(["-i", video, "-i", narration, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", partial], code);
    }
    await fs.rename(partial, outAbs).catch(async () => {
      await fs.copyFile(partial, outAbs);
    });

    // 5. Captions
    const srt = buildSrt(plan);
    const srtRel = srt ? `${folder}/export/${code}_final.srt` : "";
    if (srt) await fs.writeFile(path.join(REPO_ROOT, srtRel), srt, "utf8");

    await fs.rm(tmp, { recursive: true, force: true });
    await update(id, {
      status: "done",
      step: "Done",
      progress: 100,
      output: outRel,
      captions: srtRel,
      seconds: await probeDuration(outAbs),
      finishedAt: new Date(),
    });
  } catch (e) {
    const canceled = running.get(code)?.canceled;
    await update(id, {
      status: canceled ? "canceled" : "error",
      step: canceled ? "Canceled" : "Failed",
      log: e instanceof Error ? e.message.slice(-3000) : String(e),
      finishedAt: new Date(),
    });
  }
}
