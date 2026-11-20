/** Small, dependency-free helpers for the repo's markdown conventions. */

export type CodeBlock = {
  lang: string;
  text: string;
  /** Nearest heading or bold line above the block, markdown stripped. */
  label: string;
  /** Line index of the opening fence. */
  line: number;
};

export function stripInline(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*`]/g, "") // keep "_" — file names like mara_front matter
    .replace(/^#+\s*/, "")
    .trim();
}

export function extractCodeBlocks(md: string): CodeBlock[] {
  const lines = md.split(/\r?\n/);
  const blocks: CodeBlock[] = [];
  let label = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const start = i;
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
      blocks.push({ lang: fence[1], text: body.join("\n"), label, line: start });
      continue;
    }
    if (/^#{1,6}\s/.test(line) || /^\*\*[^*]+\*\*/.test(line)) label = stripInline(line);
  }
  return blocks;
}

/** Parse every markdown table row in `md` into arrays of trimmed cells. */
export function tableRows(md: string): string[][] {
  return md
    .split(/\r?\n/)
    .filter((l) => /^\|.*\|\s*$/.test(l) && !/^\|[\s|:-]+\|\s*$/.test(l))
    .map((l) =>
      l
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim()),
    );
}

export function firstHeading(md: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? stripInline(m[1]) : "";
}

/** First paragraph after the H1, markdown stripped. */
export function firstParagraph(md: string): string {
  const lines = md.split(/\r?\n/);
  const h1 = lines.findIndex((l) => /^#\s/.test(l));
  const para: string[] = [];
  for (let i = h1 + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) {
      if (para.length) break;
      continue;
    }
    if (l.startsWith("```") || l.startsWith("#") || l.startsWith("|")) break;
    para.push(l);
  }
  return stripInline(para.join(" "));
}

/* ---------- Prompt placeholders ---------- */

export type Placeholder = {
  key: string; // exact text inside the brackets
  multiline: boolean;
  options: string[]; // suggestions for "a / b / c" placeholders
};

const PLACEHOLDER_RE = /\[([^\]\n]{2,90})\]/g;
const MULTILINE_HINT = /^(PASTE\b|USED PREMISES$|LIST$|CREDITS$|DETAILS$)/;

function isPlaceholder(inner: string): boolean {
  if (inner.includes("...")) return false; // "[VISUAL: ...]" is a script marker
  if (/^[A-Z][A-Z0-9 ,+&'()/.–-]*$/.test(inner)) return /[A-Z]{2}/.test(inner);
  // lower-case choice lists like "slow/measured/brisk" or "Low/medium/high"
  return /^[A-Za-z][A-Za-z -]*(\s*\/\s*[A-Za-z][A-Za-z -]*)+$/.test(inner);
}

export function findPlaceholders(text: string): Placeholder[] {
  const seen = new Map<string, Placeholder>();
  for (const m of text.matchAll(PLACEHOLDER_RE)) {
    const key = m[1];
    if (seen.has(key) || !isPlaceholder(key)) continue;
    const options = key.includes("/")
      ? key.split("/").map((s) => s.trim()).filter(Boolean)
      : [];
    seen.set(key, { key, multiline: MULTILINE_HINT.test(key), options });
  }
  return [...seen.values()];
}

export function fillPlaceholders(text: string, values: Record<string, string>): string {
  return text.replace(PLACEHOLDER_RE, (whole, inner: string) => {
    const v = values[inner];
    return v && v.trim() ? v : whole;
  });
}
