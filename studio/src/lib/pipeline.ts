/**
 * The A-to-Z production pipeline: 10 stages, 16 files, in the order you make them.
 * Pure data, safe to import from client components.
 *
 * Each file unlocks when the file before it is marked complete. "Create with AI"
 * builds a prompt from the file's `task`, the prompt template in prompts/
 * (when there is one), and the earlier files listed in `context`.
 */

export type TaskKind = "text" | "image" | "video" | "voice" | "music" | "manual";

export type PipelineFile = {
  /** Path inside the episode folder, e.g. "01-story/01-idea.md". */
  path: string;
  /** URL slug inside the stage: "01-idea". */
  slug: string;
  title: string;
  /** One line shown in lists. */
  summary: string;
  /** What the AI should produce for this file. */
  task: string;
  /** Format rules for the output, so the studio can import it (shot board, cast...). */
  format: string;
  /** Prompt template(s) in prompts/ that brief this step. */
  templates: string[];
  /** Earlier episode files fed to the AI as context. Paths inside the episode folder. */
  context: string[];
  /** Repo files (outside the episode) fed as context, e.g. templates/used-premises.md. */
  repoContext?: string[];
  /** Also feed the latest earlier episode's character bible (the recurring cast). */
  seriesBible?: boolean;
  /** Which connected AI writes this file (always text) and which AI makes the media afterwards. */
  writer: "text" | "you";
  /** Label and placeholder for the creator's input in the AI panel. */
  ask?: { label: string; placeholder: string };
  media?: { kind: TaskKind; label: string; href: string };
};

export type MediaPanel = "voice" | "cast" | "shots" | "motion" | "music" | "render" | "publish";

/** A production module: its documents, then the media work (panel) that uses them. */
export type PipelineStage = {
  key: string; // "voice" — URL: /episodes/EP001/m/voice
  panel?: MediaPanel;
  number: number;
  title: string;
  description: string;
  files: PipelineFile[];
};

const f = (
  stage: string,
  slug: string,
  def: Omit<PipelineFile, "path" | "slug">,
): PipelineFile => ({ path: `${stage}/${slug}.md`, slug, ...def });

export const PIPELINE: PipelineStage[] = [
  {
    key: "idea",
    number: 1,
    title: "Idea",
    description: "Start from a sentence. The AI turns it into a strong premise.",
    files: [
      f("01-story", "01-idea", {
        title: "Idea",
        summary: "Generate premises and choose one",
        seriesBible: true,
        writer: "text",
        ask: { label: "Your idea", placeholder: "A sentence or two is enough: who, where, the crime, the twist. Leave it empty and the AI generates 20 premises to choose from." },
        templates: ["prompts/script/01-idea-generator.md"],
        context: [],
        repoContext: ["templates/used-premises.md"],
        task: "If the creator gave an idea (see \"Extra instructions from the creator\") or picked a library story, develop THAT into the chosen premise: sharpen the hook, the crime, the twist and the stakes, and list 5 alternative angles on it. Otherwise generate 20 original premises and choose the strongest. If the episode already has a working title, logline or story shape (see Episode above), build around it.",
        format: `Markdown with:
- "# Step 1 — Idea"
- "## Premises" — a table: | # | Title | Shape | Setting | Crime | Twist | Why viewers care |
- "## Chosen: #N — <Title>" with a **Why:** paragraph, and the chosen premise written out in full (setting, era, crime, twist, emotional stakes).`,
      }),
    ],
  },
  {
    key: "script",
    number: 2,
    title: "Script",
    description: "Outline, draft and editor pass, then the locked narration script.",
    files: [
      f("01-story", "02-outline", {
        title: "Outline",
        summary: "Beats, clue map and the real timeline",
        seriesBible: true,
        writer: "text",
        ask: { label: "Notes for the outline", placeholder: "e.g. Make the deputy a suspect for a while. Keep it to 6 named characters." },
        templates: ["prompts/script/02-outline.md"],
        context: ["01-story/01-idea.md"],
        task: "Build the beat-by-beat outline for the chosen premise.",
        format: `Markdown with:
- "# Step 2 — Outline"
- "## Cast" — every named character, one line each
- "## Beats" — one "### [m:ss-m:ss] Section name" heading per section, bullet beats under each
- "## Clue map" — table: | Clue | Planted (section) | Paid off |
- "## What really happened" — the true timeline, in order.`,
      }),
      f("01-story", "03-script-prompts", {
        title: "Draft + editor pass",
        summary: "Write the draft, then review it like an editor",
        seriesBible: true,
        writer: "text",
        ask: { label: "Notes for the draft", placeholder: "e.g. More dialogue in the climax. A colder narrator voice." },
        templates: ["prompts/script/03-script-writer.md", "prompts/script/04-editor-pass.md"],
        context: ["01-story/01-idea.md", "01-story/02-outline.md"],
        task: "Do steps 3 and 4 in one pass: write the full draft narration script following the outline, then act as the script editor and review it.",
        format: `Markdown with:
- "# Steps 3–4 — Draft and editor pass"
- "## Draft script" — the full draft, with [m:ss-m:ss] section markers
- "## Editor notes" — numbered points 1–8 from the editor brief (word count, pacing, plot holes, unpaid clues, clichés with replacements, read-aloud problems, U.S. details, advertiser-friendliness).`,
      }),
      f("01-story", "script-final", {
        title: "Final script",
        summary: "The locked script — read it aloud before you lock it",
        writer: "text",
        ask: { label: "Notes for the final script", placeholder: "e.g. Cut 200 words from the investigation. Stronger last line." },
        templates: [],
        context: ["01-story/02-outline.md", "01-story/03-script-prompts.md"],
        task: "Apply every editor note to the draft and return the final, locked narration script. 2,000–2,300 narrated words. Mark each new image with [SHOT 01], [SHOT 02] … (about one shot every 10–15 seconds of narration).",
        format: `Markdown with:
- "# <Episode title> — Final script"
- one "## [m:ss-m:ss] Section name" heading per section (Hook, Setup, Investigation, Complication, Climax, Ending)
- narration paragraphs, each new image marked inline with **[SHOT NN]**
- nothing else: no notes, no word counts.`,
      }),
    ],
  },
  {
    key: "voice",
    number: 3,
    title: "Voice",
    description: "Design the narrator voice and record the narration, section by section.",
    panel: "voice",
    files: [
      f("05-voice", "voice-setup", {
        title: "Voice setup",
        summary: "Narrator voice design, delivery tags and pronunciation",
        writer: "text",
        ask: { label: "Voice you want", placeholder: "e.g. Deep, gravelly male narrator, slow and calm, slight Southern accent." },
        templates: ["prompts/voice-sample.md", "prompts/narration-direction.md"],
        context: ["01-story/script-final.md", "01-story/02-outline.md"],
        task: "Design the narrator voice and prepare the narration for recording.",
        format: `Markdown with:
- "## Voice description" — a \`\`\`text block for a voice-design tool
- "## Test lines" — a \`\`\`text block
- "## Pronunciation" — table | Name | Say it |
- "## Recording plan" — one row per script section: | File | Section | Words | Notes |  (files named vo_01_hook.mp3 …)
- "## Delivery-tagged script" — the final script with [pause 1s], [slower], [low] tags added WITHOUT changing any words.`,
        media: { kind: "voice", label: "Generate narration", href: "voice" },
      }),
    ],
  },
  {
    key: "cast",
    number: 4,
    title: "Cast & world",
    description: "Lock every face and location before making shots.",
    panel: "cast",
    files: [
      f("02-characters", "character-bible", {
        title: "Character bible",
        summary: "Fixed look, voice and pronunciation for every character",
        seriesBible: true,
        writer: "text",
        ask: { label: "Notes on the characters", placeholder: "e.g. Make the culprit look kind and harmless. Give the deputy glasses." },
        templates: [],
        context: ["01-story/02-outline.md", "01-story/script-final.md"],
        repoContext: ["templates/character-bible.md"],
        task: "Write the character bible for every named character in the final script. Descriptions must be exact and reusable word-for-word in image prompts.",
        format: `Markdown with one "## <Full name> — <role>" section per character, each with a table:
| | |
|---|---|
| **Age** | … |
| **Face** | … |
| **Hair** | … |
| **Build** | … |
| **Outfit (locked)** | … |
| **Props** | … |
| **Voice** | … |
| **Pronunciation** | … |
Then "## Style line" — one sentence appended to every image prompt (film look, era, palette, "16:9, no text, no logos, no watermark").`,
      }),
      f("02-characters", "character-image-prompts", {
        title: "Character image prompts",
        summary: "Portrait + reference-sheet prompts that lock each face",
        writer: "text",
        ask: { label: "Look & style notes", placeholder: "e.g. Painterly noir style, close-ups, rim light." },
        templates: ["prompts/character-reference-sheet.md"],
        context: ["02-characters/character-bible.md"],
        task: "Write the image prompts that create each character's locked reference face, then a reference sheet that uses it.",
        format: `Markdown. For EACH character:
"## <Full name>"
then "**Portrait (makes the locked face)**" followed by a \`\`\`text code block,
then "**Reference sheet (attach <firstname>_front.png)**" followed by a \`\`\`text code block.
Use the exact bible description in every prompt and end each with the style line. Separate characters with "---".`,
        media: { kind: "image", label: "Generate & approve faces", href: "cast" },
      }),
      f("03-locations", "location-prompts", {
        title: "Location prompts",
        summary: "Establishing reference for every location",
        writer: "text",
        ask: { label: "Notes on the locations", placeholder: "e.g. Everything wet from rain, neon reflections." },
        templates: ["prompts/location-reference.md"],
        context: ["01-story/script-final.md", "02-characters/character-bible.md"],
        task: "List every recurring location in the script, give each an ID (L1, L2 …) and write one establishing reference image prompt per location (no people).",
        format: `Markdown with:
- a table: | ID | Location | Used in shots |   (one row per location: | L1 | Name | 01–05, 12 |)
- "---"
- for each location: "**L1 — Name**" followed by a \`\`\`text code block with the prompt, ending with the style line.`,
        media: { kind: "image", label: "Generate & approve locations", href: "cast" },
      }),
    ],
  },
  {
    key: "shots",
    number: 5,
    title: "Shots",
    description: "One still image per shot, made from the locked references.",
    panel: "shots",
    files: [
      f("04-shots", "shot-list", {
        title: "Shot list",
        summary: "Every [SHOT NN] in the script, with location and motion",
        writer: "text",
        ask: { label: "Notes for the shot list", placeholder: "e.g. Animate the 8 most dramatic moments. More close-ups on clues." },
        templates: ["prompts/script/05-visual-notes.md"],
        context: ["01-story/script-final.md", "02-characters/character-bible.md", "03-locations/location-prompts.md"],
        task: "Turn every [SHOT NN] marker in the final script into one shot-list row. Mark about 10 key shots with 🎬 to be animated with image-to-video; all others are stills with a slow camera move.",
        format: `Markdown with a "**Motion key:**" line (IN, OUT, L→R, R→L, UP, DOWN, HOLD) and ONE table:
| Shot | Section | Narration starts with… | Characters | Loc | Motion |
|---|---|---|---|---|---|
| 01 🎬 | Hook | "First words of the narration…" | — | L1 | IN |
| 02 | Hook | "…" | Mara | L2 | HOLD |
Shot numbers are two digits. Characters are first names or "—". Loc is a location ID from the location prompts.
Optionally, a second 2-column table "| Shot | Text overlay |" for titles or on-screen text added in the editor.`,
      }),
      f("04-shots", "image-prompts", {
        title: "Image prompts",
        summary: "One still-image prompt per shot, with the refs to attach",
        writer: "text",
        ask: { label: "Notes for the image prompts", placeholder: "e.g. Low camera angles, heavier shadows." },
        templates: ["prompts/video-shot.md"],
        context: ["04-shots/shot-list.md", "02-characters/character-bible.md", "03-locations/location-prompts.md"],
        task: "Write one image prompt for every shot in the shot list. Copy character descriptions exactly from the bible; end every prompt with the style line. Never put readable text in the image.",
        format: `Markdown. Group shots under "## SECTION [m:ss–m:ss]" headings. For EVERY shot:
**01** · Refs: mara_front, L1
\`\`\`text
<one-paragraph prompt ending with the style line>
\`\`\`
Refs are <firstname>_front for characters in the shot and the location ID. Use "Refs: —" if none.`,
        media: { kind: "image", label: "Generate & approve shots", href: "shots" },
      }),
    ],
  },
  {
    key: "motion",
    number: 6,
    title: "Motion",
    description: "Animate the key shots with image-to-video.",
    panel: "motion",
    files: [
      f("04-shots", "video-prompts", {
        title: "Video prompts",
        summary: "Image-to-video prompts for the 🎬 shots",
        writer: "text",
        ask: { label: "Notes for the motion", placeholder: "e.g. Only slow push-ins; no character movement." },
        templates: ["prompts/video-shot.md"],
        context: ["04-shots/shot-list.md", "04-shots/image-prompts.md"],
        task: "Write a 5-second image-to-video prompt for every 🎬 shot in the shot list. Small, slow motion only — big movement makes faces drift.",
        format: `Markdown. For each 🎬 shot:
**01 — short label**
\`\`\`text
<what moves, how the camera moves, what must stay consistent>
\`\`\``,
        media: { kind: "video", label: "Upload animated clips", href: "shots" },
      }),
    ],
  },
  {
    key: "music",
    number: 7,
    title: "Music & SFX",
    description: "Music bed and sound effects under the narration.",
    panel: "music",
    files: [
      f("06-music-sfx", "cue-sheet", {
        title: "Cue sheet",
        summary: "Music and sound effects per section",
        writer: "text",
        ask: { label: "Music direction", placeholder: "e.g. Sparse piano and low strings, a heartbeat pulse in the climax." },
        templates: [],
        context: ["01-story/script-final.md", "04-shots/shot-list.md"],
        task: "Write the music and sound-effect cue sheet for the episode. Music must come from a licensed library or an AI music tool that allows commercial use; describe each cue so it can be searched for or generated.",
        format: `Markdown with:
- "## Music" — table | Cue | Section / shots | Mood | Search terms / AI music prompt | Volume under voice |
- "## Sound effects" — table | Shot | SFX | Notes |
- "## Rules" — short bullet list (ducking, silence before reveals, no lyrics under narration).`,
      }),
    ],
  },
  {
    key: "render",
    number: 8,
    title: "Edit & render",
    description: "Assemble voice, shots, clips and music into the final video.",
    panel: "render",
    files: [
      f("07-edit", "edit-plan", {
        title: "Edit plan",
        summary: "Timeline, motion, transitions and captions",
        writer: "text",
        ask: { label: "Notes for the edit", placeholder: "e.g. Hard cut to black before the reveal. Burned-in captions." },
        templates: [],
        context: ["04-shots/shot-list.md", "05-voice/voice-setup.md", "06-music-sfx/cue-sheet.md"],
        task: "Write a step-by-step edit plan for CapCut or DaVinci Resolve.",
        format: `Markdown with:
- "## Project settings" (resolution, fps, audio levels)
- "## Assembly order" — numbered steps: voice first, then shots, then music and SFX, then captions
- "## Section by section" — table | Section | Shots | Motion / transitions | Music | Notes |
- "## Captions and text" — title card and overlays
- "## Final checks" — checklist with "- [ ]".`,
      }),
    ],
  },
  {
    key: "publish",
    number: 9,
    title: "Publish",
    description: "Thumbnail, title, description, Shorts and the license log.",
    panel: "publish",
    files: [
      f("08-packaging", "title-description-thumbnail", {
        title: "Title, description, thumbnail",
        summary: "Everything viewers see before they click",
        writer: "text",
        ask: { label: "Notes for packaging", placeholder: "e.g. Put the stopped watch on the thumbnail." },
        templates: ["prompts/title-and-description.md", "prompts/thumbnail.md"],
        context: ["01-story/script-final.md", "02-characters/character-bible.md", "03-locations/location-prompts.md"],
        task: "Write the YouTube packaging and the thumbnail image prompt.",
        format: `Markdown with:
- "## Titles" — 5 numbered options under 60 characters, the recommended one in **bold**
- "## Description" — in a \`\`\`text block, ready to paste
- "## Thumbnail" — a \`\`\`text image prompt (no text in the image) + 3 text-overlay options of 3–4 words
- "## Pinned comment"
- "## Tags" — one comma-separated line.`,
      }),
      f("09-shorts", "shorts-scripts", {
        title: "Shorts scripts",
        summary: "Teaser, clue and character Shorts",
        writer: "text",
        ask: { label: "Notes for the Shorts", placeholder: "e.g. Make one Short about the red herring." },
        templates: ["prompts/script/06-shorts.md"],
        context: ["01-story/script-final.md", "04-shots/shot-list.md"],
        task: "Write the 3 Shorts scripts. Reuse existing shot numbers where possible (crop to 9:16) so no new images are needed.",
        format: `Markdown with one "## Short N — <Type>: <title>" section each, containing: **Hook text**, **Shots used**, the narration in a \`\`\`text block, and **Closing line**.`,
      }),
      f("10-rights", "license-log", {
        title: "License log",
        summary: "Every AI tool, plan and license used",
        writer: "text",
        ask: { label: "Tools you used", placeholder: "e.g. Claude Pro, Midjourney Standard, ElevenLabs Creator, Epidemic Sound." },
        templates: [],
        context: ["05-voice/voice-setup.md", "06-music-sfx/cue-sheet.md"],
        task: "Draft the license log for this episode. Pre-fill rows for every tool used (script AI, image AI, video AI, voice AI, music, SFX, fonts) and leave plan, licence and date cells for the creator to confirm. Add a short pre-publish checklist (AI-content disclosure, fiction disclaimer, music credits).",
        format: `Markdown with:
- table | Asset | Tool / source | Plan | Commercial use? | License link / ID | Date |
- "## Before publishing" — checklist with "- [ ]".`,
      }),
    ],
  },
];

export const ALL_FILES: { stage: PipelineStage; file: PipelineFile; index: number }[] = PIPELINE.flatMap(
  (stage) => stage.files.map((file) => ({ stage, file })),
).map((x, index) => ({ ...x, index }));

/** Find a file by its folder and slug, e.g. ("05-voice", "voice-setup"). */
export function findFile(folder: string, slug: string) {
  return ALL_FILES.find((x) => x.file.path === `${folder}/${slug}.md`) ?? null;
}

export function moduleUrl(code: string, key: string) {
  return `/episodes/${code}/m/${key}`;
}

export function stepUrl(code: string, file: PipelineFile) {
  return `/episodes/${code}/step/${file.path.replace(/\.md$/, "")}`;
}
