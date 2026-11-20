/** Splits the locked script into narration sections for voice recording. */

export type VoiceSection = {
  index: number;
  heading: string;
  /** vo_01_hook */
  name: string;
  text: string;
  words: number;
};

function slugify(s: string) {
  return (
    s
      .replace(/\[[^\]]*\]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "section"
  );
}

/** Narration only: no shot markers, no markdown, no stage directions. */
export function narrationText(md: string) {
  return md
    .replace(/\*\*\[SHOT[^\]]*\]\*\*|\[SHOT[^\]]*\]/gi, "")
    .replace(/\[VISUAL:[^\]]*\]/gi, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/[*_`#]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitScript(md: string): VoiceSection[] {
  const lines = md.split(/\r?\n/);
  const raw: { heading: string; body: string[] }[] = [];
  for (const line of lines) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) raw.push({ heading: h[1].replace(/[*`]/g, "").trim(), body: [] });
    else if (raw.length) raw[raw.length - 1].body.push(line);
  }
  // A script with no "##" sections is recorded as one file.
  if (!raw.length && md.trim()) raw.push({ heading: "Narration", body: lines.filter((l) => !/^#\s/.test(l)) });

  return raw
    .map((r) => ({ heading: r.heading, text: narrationText(r.body.join("\n")) }))
    .filter((r) => r.text)
    .map((r, i) => {
      const label = r.heading.replace(/^\[[^\]]*\]\s*/, "").replace(/^[—–-]\s*/, "") || r.heading;
      return {
        index: i,
        heading: r.heading,
        name: `vo_${String(i + 1).padStart(2, "0")}_${slugify(label)}`,
        text: r.text,
        words: r.text.split(/\s+/).length,
      };
    });
}
