import fs from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { REPO_ROOT, safeRepoPath, toPosix } from "./paths";
import {
  extractCodeBlocks,
  findPlaceholders,
  firstHeading,
  firstParagraph,
  type Placeholder,
} from "./markdown";

export type PromptBlock = {
  index: number;
  label: string;
  text: string;
  placeholders: Placeholder[];
};

export type PromptTemplate = {
  path: string; // repo-relative, e.g. prompts/script/01-idea-generator.md
  slug: string; // path without "prompts/" and ".md"
  group: string;
  title: string;
  summary: string;
  markdown: string;
  blocks: PromptBlock[];
};

const PROMPTS_DIR = "prompts";

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (e.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function groupFor(slug: string): string {
  if (slug.startsWith("script/")) return "Script pipeline";
  if (/thumbnail|title/.test(slug)) return "Packaging";
  if (/voice|narration/.test(slug)) return "Voice";
  return "Images & video";
}

export async function loadTemplate(relPath: string): Promise<PromptTemplate | null> {
  await connection(); // read the repo at request time so edits show up without a rebuild
  const abs = safeRepoPath(relPath);
  if (!abs || !relPath.startsWith(`${PROMPTS_DIR}/`) || !relPath.endsWith(".md")) return null;
  let markdown: string;
  try {
    markdown = await fs.readFile(abs, "utf8");
  } catch {
    return null;
  }
  const slug = relPath.slice(PROMPTS_DIR.length + 1, -3);
  const blocks = extractCodeBlocks(markdown)
    .filter((b) => b.lang === "text" || b.lang === "")
    .map((b, index) => ({
      index,
      label: b.label,
      text: b.text,
      placeholders: findPlaceholders(b.text),
    }));
  return {
    path: relPath,
    slug,
    group: groupFor(slug),
    title: firstHeading(markdown).replace(/^Prompt\s*[—-]\s*/i, "") || slug,
    summary: firstParagraph(markdown),
    markdown,
    blocks,
  };
}

export async function listTemplates(): Promise<PromptTemplate[]> {
  await connection();
  const files = await walk(path.join(REPO_ROOT, PROMPTS_DIR));
  const templates = await Promise.all(
    files.map((f) => loadTemplate(toPosix(path.relative(REPO_ROOT, f)))),
  );
  const order = ["Script pipeline", "Images & video", "Voice", "Packaging"];
  return templates
    .filter((t): t is PromptTemplate => t !== null)
    .sort(
      (a, b) =>
        order.indexOf(a.group) - order.indexOf(b.group) || a.slug.localeCompare(b.slug),
    );
}
