import fs from "node:fs/promises";
import path from "node:path";
import { connectDB } from "./db";
import { Character, Episode, Location, Shot, type StepStatus } from "./models";
import { REPO_ROOT } from "./paths";
import { extractCodeBlocks, stripInline, tableRows } from "./markdown";

/**
 * Imports an episode folder (video_N/) into MongoDB.
 * Content (prompts, narration, titles) is refreshed from the markdown on every
 * import; work state (statuses, uploaded images, notes) is never overwritten.
 */

async function read(folder: string, rel: string): Promise<string> {
  try {
    return await fs.readFile(path.join(REPO_ROOT, folder, rel), "utf8");
  } catch {
    return "";
  }
}

function humanize(file: string): string {
  const base = path.basename(file, ".md").replace(/^\d+-/, "").replace(/-/g, " ");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function parseStatus(cell: string): { status: StepStatus; note: string } {
  const text = stripInline(cell);
  const status: StepStatus = text.includes("✅")
    ? "done"
    : /🟡|🔄|in progress/i.test(text)
      ? "in_progress"
      : "todo";
  const note = text
    .replace(/[✅⬜🟡🔄]/gu, "")
    .replace(/^\s*done\s*(→\s*)?/i, "")
    .trim();
  return { status, note };
}

export function parseEpisodeReadme(md: string, folder: string) {
  const h1 = md.match(/^#\s+(.+)$/m)?.[1] ?? folder;
  const [, code = folder.toUpperCase(), title = h1] =
    h1.match(/^(EP\d+)\s*[—–-]\s*(.+)$/) ?? [];
  const info: Record<string, string> = {};
  const steps: {
    order: number;
    label: string;
    title: string;
    file: string;
    tool: string;
    status: StepStatus;
    note: string;
  }[] = [];

  for (const cells of tableRows(md)) {
    const key = cells[0]?.match(/^\*\*(.+)\*\*$/)?.[1];
    if (key && cells.length >= 2) {
      info[key.toLowerCase()] = stripInline(cells[1]);
      continue;
    }
    if (cells.length >= 4 && /^(\d+(\s*[–-]\s*\d+)?|★)$/.test(cells[0])) {
      const link = cells[1].match(/\[([^\]]+)\]\(([^)]+)\)/);
      const file = link ? path.posix.join(folder, link[2]) : "";
      const desc = stripInline(cells[1].replace(/\[[^\]]+\]\([^)]+\)/, "")).replace(/^[—–-]\s*/, "");
      const { status, note } = parseStatus(cells[3]);
      steps.push({
        order: steps.length + 1,
        label: cells[0],
        title: (file ? humanize(file) : "Step") + (desc ? ` — ${desc}` : ""),
        file,
        tool: stripInline(cells[2]).replace(/^—$/, ""),
        status,
        note,
      });
    }
  }
  return { code, title: stripInline(title), info, steps };
}

function parseShots(shotList: string, imagePrompts: string, videoPrompts: string) {
  const shots = new Map<
    number,
    {
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
    }
  >();
  const get = (n: number) => {
    if (!shots.has(n))
      shots.set(n, {
        number: n,
        section: "",
        narration: "",
        characters: "",
        location: "",
        motion: "",
        animated: false,
        refs: [],
        imagePrompt: "",
        videoPrompt: "",
        overlay: "",
      });
    return shots.get(n)!;
  };

  for (const cells of tableRows(shotList)) {
    // "Text overlays" table: | 06 | `PINE HOLLOW…` |  /  | 06 (end) | …
    const o = cells[0]?.match(/^(\d+)\b(.*)$/);
    if (o && cells.length === 2) {
      const shot = get(Number(o[1]));
      const text = (o[2].trim() ? `${o[2].trim()}: ` : "") + stripInline(cells[1]);
      shot.overlay = shot.overlay ? `${shot.overlay}\n${text}` : text;
      continue;
    }
    const m = cells[0]?.match(/^(\d+)\s*(🎬)?$/u);
    if (!m || cells.length < 6) continue;
    Object.assign(get(Number(m[1])), {
      animated: Boolean(m[2]),
      section: stripInline(cells[1]),
      narration: stripInline(cells[2]),
      characters: stripInline(cells[3]).replace(/^—$/, ""),
      location: stripInline(cells[4]),
      motion: stripInline(cells[5]),
    });
  }

  // Section headings in image-prompts.md ("## HOOK [0:00–0:30]") fill gaps.
  let section = "";
  const sectionAt = new Map<number, string>();
  imagePrompts.split(/\r?\n/).forEach((l, i) => {
    const h = l.match(/^##\s+([^[]+)/);
    if (h) section = h[1].trim();
    sectionAt.set(i, section);
  });
  for (const b of extractCodeBlocks(imagePrompts)) {
    // "**01** · Refs: L1"  or just "**24**" when a shot needs no references
    const m = b.label.match(/^(\d+)\s*(?:·\s*Refs:\s*(.*))?$/);
    if (!m) continue;
    const shot = get(Number(m[1]));
    shot.imagePrompt = b.text.trim();
    shot.refs = (m[2] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!shot.section) shot.section = sectionAt.get(b.line) ?? "";
  }

  for (const b of extractCodeBlocks(videoPrompts)) {
    const m = b.label.match(/^(\d+)\s*[—–-]/);
    if (!m) continue;
    const shot = get(Number(m[1]));
    shot.videoPrompt = b.text.trim();
    shot.animated = true;
  }
  return [...shots.values()].sort((a, b) => a.number - b.number);
}

function parseCharacters(md: string) {
  return md
    .split(/^##\s+/m)
    .slice(1)
    .map((chunk) => {
      const heading = chunk.split(/\r?\n/)[0].trim();
      const name = heading.replace(/\s*\(.*\)\s*$/, "");
      const prompts = extractCodeBlocks(chunk).map((b) => ({
        label: b.label || "Prompt",
        text: b.text.trim(),
      }));
      return {
        slug: name.split(/\s+/)[0].toLowerCase(),
        name,
        notes: heading.match(/\((.*)\)/)?.[1] ?? "",
        prompts,
      };
    })
    .filter((c) => c.prompts.length > 0);
}

function parseLocations(md: string) {
  const locations = new Map<string, { code: string; name: string; usedIn: string; prompt: string }>();
  for (const cells of tableRows(md)) {
    if (/^L\d+$/.test(cells[0]) && cells.length >= 3)
      locations.set(cells[0], {
        code: cells[0],
        name: stripInline(cells[1]),
        usedIn: stripInline(cells[2]),
        prompt: "",
      });
  }
  for (const b of extractCodeBlocks(md)) {
    const m = b.label.match(/^(L\d+)\s*[—–-]\s*(.+)$/);
    if (!m) continue;
    const loc = locations.get(m[1]) ?? { code: m[1], name: m[2], usedIn: "", prompt: "" };
    loc.prompt = b.text.trim();
    locations.set(m[1], loc);
  }
  return [...locations.values()];
}

export type ImportResult = {
  code: string;
  folder: string;
  steps: number;
  shots: number;
  characters: number;
  locations: number;
};

export async function importEpisodeFolder(folder: string): Promise<ImportResult> {
  if (!/^video_\d+$/.test(folder)) throw new Error(`Not an episode folder: ${folder}`);
  await connectDB();

  const readme = await read(folder, "README.md");
  if (!readme) throw new Error(`${folder}/README.md not found`);
  const { code, title, info, steps } = parseEpisodeReadme(readme, folder);

  // Merge steps: keep status/note the user already set in the app.
  const existing = await Episode.findOne({ code }).lean();
  const prev = new Map(existing?.steps?.map((s) => [s.label + "|" + s.file, s]) ?? []);
  const mergedSteps = steps.map((s) => {
    const old = prev.get(s.label + "|" + s.file);
    return old ? { ...s, status: old.status, note: old.note } : s;
  });

  await Episode.updateOne(
    { code },
    {
      $set: {
        title,
        folder,
        logline: info.logline ?? "",
        length: info.length ?? "",
        style: info.style ?? "",
        storyShape: info["story shape"] ?? "",
        cast: info.cast ?? "",
        steps: mergedSteps,
      },
    },
    { upsert: true },
  );

  const shots = parseShots(
    await read(folder, "04-shots/shot-list.md"),
    await read(folder, "04-shots/image-prompts.md"),
    await read(folder, "04-shots/video-prompts.md"),
  );
  if (shots.length)
    await Shot.bulkWrite(
      shots.map((s) => ({
        updateOne: {
          filter: { episode: code, number: s.number },
          update: { $set: { ...s, episode: code } },
          upsert: true,
        },
      })),
    );

  const characters = parseCharacters(await read(folder, "02-characters/character-image-prompts.md"));
  if (characters.length)
    await Character.bulkWrite(
      characters.map(({ notes, ...c }) => ({
        updateOne: {
          filter: { episode: code, slug: c.slug },
          update: { $set: { ...c, episode: code }, $setOnInsert: { notes } },
          upsert: true,
        },
      })),
    );

  const locations = parseLocations(await read(folder, "03-locations/location-prompts.md"));
  if (locations.length)
    await Location.bulkWrite(
      locations.map((l) => ({
        updateOne: {
          filter: { episode: code, code: l.code },
          update: { $set: { ...l, episode: code } },
          upsert: true,
        },
      })),
    );

  return {
    code,
    folder,
    steps: steps.length,
    shots: shots.length,
    characters: characters.length,
    locations: locations.length,
  };
}

/** video_N folders that have a README.md (empty placeholder folders are skipped). */
export async function listEpisodeFolders(): Promise<string[]> {
  const entries = await fs.readdir(REPO_ROOT, { withFileTypes: true });
  const folders = entries
    .filter((e) => e.isDirectory() && /^video_\d+$/.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => Number(a.split("_")[1]) - Number(b.split("_")[1]));
  const withReadme = await Promise.all(
    folders.map((f) =>
      fs.access(path.join(REPO_ROOT, f, "README.md")).then(
        () => f,
        () => null,
      ),
    ),
  );
  return withReadme.filter((f): f is string => f !== null);
}

/** First video_N without a README.md — reuses an empty folder you already made. */
export async function nextEpisodeFolder(): Promise<string> {
  const taken = new Set(await listEpisodeFolders());
  let n = 1;
  while (taken.has(`video_${n}`)) n++;
  return `video_${n}`;
}
