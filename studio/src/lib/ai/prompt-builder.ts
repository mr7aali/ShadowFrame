import "server-only";
import fs from "node:fs/promises";
import { extractCodeBlocks } from "../markdown";
import { findFile } from "../pipeline";
import { safeRepoPath } from "../paths";
import type { EpisodeView } from "../queries";
import { readEpisodeFile } from "../workspace";

export const SYSTEM_PROMPT = `You are the head writer and production assistant for a YouTube channel of original, fictional crime-thriller episodes (narrated, ~14 minutes, AI-generated visuals) for adults in the U.S., UK, Canada and Australia.

You produce one production file at a time. Each file feeds the next step of the pipeline, and some are read by software, so follow the requested markdown structure exactly.

Standing rules:
- Fully original stories. No real people, real cases, real crimes, or reworked films, shows, books or games.
- Suspense over shock: no graphic gore; the body is never shown in detail.
- Keep names, character descriptions, locations and facts consistent with the context files.
- Plain, conversational American English and American spelling.
- Return ONLY the file's markdown, with no preamble, no closing remarks, and no surrounding code fence.`;

export type ContextFileInfo = { path: string; chars: number; missing: boolean };

export type BuiltPrompt = {
  system: string;
  prompt: string;
  context: ContextFileInfo[];
  templates: string[];
};

const EXAMPLE_FOLDER = "video_1";
const EXAMPLE_CHARS = 3500;

async function readRepo(rel: string): Promise<string> {
  const abs = safeRepoPath(rel);
  if (!abs) return "";
  try {
    return await fs.readFile(abs, "utf8");
  } catch {
    return "";
  }
}

/** Drop the "Prompt sent" sections and tool notes the worked example keeps for humans. */
function cleanExample(md: string) {
  return md
    .replace(/^##[^\n]*prompts? sent[^\n]*\n[\s\S]*?(?=^## |(?![\s\S]))/gim, "")
    .replace(/^\*\*Tools?:\*\*.*$/gm, "")
    .replace(/^\*\*Result:\*\*.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The most recent earlier episode's character bible: the series' recurring cast. */
async function seriesBible(folder: string): Promise<{ path: string; text: string } | null> {
  const n = Number(folder.split("_")[1]);
  for (let i = n - 1; i >= 1; i--) {
    const rel = `video_${i}/02-characters/character-bible.md`;
    const text = await readRepo(rel);
    if (text.trim()) return { path: rel, text };
  }
  return null;
}

function excerpt(md: string, max: number) {
  if (md.length <= max) return md;
  const cut = md.lastIndexOf("\n", max);
  const body = md.slice(0, cut > 0 ? cut : max);
  // Don't leave an unclosed code fence.
  const fences = (body.match(/^```/gm) ?? []).length;
  return `${body}${fences % 2 ? "\n```" : ""}\n\n[… example continues in the same pattern …]`;
}

export async function buildFilePrompt(
  episode: EpisodeView,
  stageKey: string,
  slug: string,
  extra = "",
): Promise<BuiltPrompt | null> {
  const found = findFile(stageKey, slug);
  if (!found) return null;
  const { file } = found;
  const target = `${episode.folder}/${file.path}`;

  const sections: string[] = [];

  // Episode facts
  const facts = [
    `Code: ${episode.code}`,
    `Working title: ${episode.title}`,
    episode.logline && episode.logline !== "TBD" ? `Logline: ${episode.logline}` : "",
    episode.storyShape && episode.storyShape !== "TBD" ? `Story shape: ${episode.storyShape}` : "",
    episode.length ? `Length: ${episode.length}` : "",
    episode.style ? `Style: ${episode.style}` : "",
  ].filter(Boolean);
  sections.push(`# Episode\n${facts.join("\n")}`);

  // Task
  sections.push(`# Your task: write \`${target}\` — ${file.title}\n${file.task}`);

  // Briefs from the prompt templates
  const templates: string[] = [];
  for (const t of file.templates) {
    const md = await readRepo(t);
    const blocks = extractCodeBlocks(md).filter((b) => b.lang === "text" || b.lang === "");
    if (!blocks.length) continue;
    templates.push(t);
    sections.push(
      `# Brief from \`${t}\`\nFollow this brief. Every [BRACKETED] placeholder in it is answered by the episode facts and context files below — fill them in yourself; never leave brackets in your output.\n\n` +
        blocks.map((b) => `<brief${b.label ? ` label="${b.label}"` : ""}>\n${b.text}\n</brief>`).join("\n\n"),
    );
  }

  // Context: earlier files of this episode + repo reference files
  const context: ContextFileInfo[] = [];
  const ctxBlocks: string[] = [];
  for (const rel of file.context) {
    const text = await readEpisodeFile(episode.folder, rel);
    const p = `${episode.folder}/${rel}`;
    context.push({ path: p, chars: text.length, missing: !text.trim() });
    if (text.trim()) ctxBlocks.push(`<file path="${p}">\n${text.trim()}\n</file>`);
  }
  if (file.seriesBible) {
    const bible = await seriesBible(episode.folder);
    if (bible) {
      context.push({ path: bible.path, chars: bible.text.length, missing: false });
      ctxBlocks.push(
        `<file path="${bible.path}" note="Series character bible from an earlier episode. Keep the recurring detective and partner exactly as written; the other characters belong to that episode only — do not reuse them.">\n${bible.text.trim()}\n</file>`,
      );
    }
  }
  for (const rel of file.repoContext ?? []) {
    const text = await readRepo(rel);
    context.push({ path: rel, chars: text.length, missing: !text.trim() });
    if (text.trim()) ctxBlocks.push(`<file path="${rel}">\n${text.trim()}\n</file>`);
  }
  if (ctxBlocks.length) sections.push(`# Context files\n${ctxBlocks.join("\n\n")}`);

  // Format, with a finished episode as a structure example
  let format = `# Output format\n${file.format}`;
  if (episode.folder !== EXAMPLE_FOLDER) {
    const example = cleanExample(await readRepo(`${EXAMPLE_FOLDER}/${file.path}`));
    if (example.trim())
      format += `\n\nStructure example from a finished episode. Copy its STRUCTURE and level of detail only — never its story, names or content:\n<example path="${EXAMPLE_FOLDER}/${file.path}">\n${excerpt(example.trim(), EXAMPLE_CHARS)}\n</example>`;
  }
  sections.push(format);

  if (extra.trim()) sections.push(`# Extra instructions from the creator\n${extra.trim()}`);

  sections.push(`Now write the complete markdown for \`${target}\`.`);

  return { system: SYSTEM_PROMPT, prompt: sections.join("\n\n"), context, templates };
}

/** System + user prompt as one block, for pasting into a chat app. */
export function asChatPrompt(p: BuiltPrompt) {
  return `${p.system}\n\n---\n\n${p.prompt}`;
}
