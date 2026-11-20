/** The series library: reusable characters, stories and locations. Client-safe. */

export type LibraryType = "character" | "story" | "location";

export type LibraryField = {
  key: string;
  label: string;
  placeholder?: string;
  long?: boolean;
  options?: string[];
};

export type LibraryTypeInfo = {
  type: LibraryType;
  plural: string;
  slug: string; // URL: /library/characters
  singular: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  /** Fields shown in the list card under the name. */
  summaryFields: string[];
  fields: LibraryField[];
  /** What "Fill with AI" is asked to do. */
  aiBrief: string;
  /** Builds the starting image prompt from the item's fields. */
  imagePrompt: (name: string, f: Record<string, string>) => string;
};

export const STORY_SHAPES = [
  "Classic whodunit",
  "Locked-room",
  "Heist gone wrong",
  "Unreliable narrator",
  "Told in reverse",
  "Race against time",
  "Detective is a suspect",
];

export const STYLE_LINE =
  "Cinematic 35mm film still, muted blue-grey palette with warm amber practical light, realistic, 16:9, no text, no logos, no watermark.";

const join = (...parts: (string | undefined)[]) => parts.map((p) => p?.trim()).filter(Boolean).join(", ");

export const LIBRARY: LibraryTypeInfo[] = [
  {
    type: "character",
    plural: "Characters",
    slug: "characters",
    singular: "Character",
    description: "Recurring and one-off characters. Lock a face once, reuse it in every episode.",
    nameLabel: "Full name",
    namePlaceholder: "Mara Quinn",
    summaryFields: ["role", "age"],
    fields: [
      { key: "role", label: "Role", placeholder: "Detective (recurring lead)" },
      { key: "age", label: "Age", placeholder: "late 30s" },
      { key: "face", label: "Face & distinctive features", placeholder: "pale skin, faint freckles, grey-green eyes, thin scar through left eyebrow", long: true },
      { key: "hair", label: "Hair", placeholder: "dark brown, low ponytail" },
      { key: "build", label: "Build / height", placeholder: "lean, tall" },
      { key: "outfit", label: "Outfit (locked)", placeholder: "long charcoal wool coat, mustard-yellow knit scarf", long: true },
      { key: "props", label: "Props & accessories", placeholder: "silver pocket notebook" },
      { key: "personality", label: "Personality, goal & flaw", long: true },
      { key: "voice", label: "Voice", placeholder: "low, calm, measured" },
      { key: "pronunciation", label: "Pronunciation", placeholder: "Quinn [KWIN]" },
      { key: "notes", label: "Notes / continuity", long: true },
    ],
    aiBrief:
      "Design an original fictional character for a narrated crime-thriller series. Descriptions must be concrete and visual so they can be pasted word-for-word into image prompts and stay consistent across episodes.",
    imagePrompt: (name, f) =>
      `Portrait photograph of ${name}${f.role ? `, ${f.role}` : ""}, ${join(f.age, f.face, f.hair ? `${f.hair} hair` : "", f.build, f.outfit, f.props)}. Serious, watchful expression. Softly out-of-focus background. Head and shoulders. ${STYLE_LINE}`,
  },
  {
    type: "story",
    plural: "Stories",
    slug: "stories",
    singular: "Story",
    description: "Premises and story ideas. Pick one when you start an episode.",
    nameLabel: "Working title",
    namePlaceholder: "The Clock That Stopped at 9:14",
    summaryFields: ["storyShape", "setting"],
    fields: [
      { key: "logline", label: "Logline", placeholder: "One sentence: the crime, the hook, the pressure.", long: true },
      { key: "storyShape", label: "Story shape", options: STORY_SHAPES },
      { key: "setting", label: "Setting & era", placeholder: "Pine Hollow, Minnesota (fictional), January 1996, blizzard" },
      { key: "crime", label: "The crime", long: true },
      { key: "twist", label: "The twist", long: true },
      { key: "stakes", label: "Why viewers care", long: true },
      { key: "clues", label: "Key clues", long: true },
      { key: "notes", label: "Notes", long: true },
    ],
    aiBrief:
      "Develop an original fictional crime-thriller premise for a 14-minute narrated YouTube episode. No real people, cases or crimes; suspense over gore; fair clues a viewer can follow by ear.",
    imagePrompt: (name, f) =>
      `Moody key art for an original crime thriller titled "${name}". ${join(f.setting, f.crime)}. One strong visual motif, dramatic rim light. ${STYLE_LINE}`,
  },
  {
    type: "location",
    plural: "Locations",
    slug: "locations",
    singular: "Location",
    description: "Recurring places. One approved reference image keeps every shot there consistent.",
    nameLabel: "Name",
    namePlaceholder: "Sheriff's office",
    summaryFields: ["era", "time"],
    fields: [
      { key: "description", label: "Description", placeholder: "Architecture, key objects, layout, signage style", long: true },
      { key: "town", label: "Town / city type", placeholder: "small Midwest town" },
      { key: "era", label: "Era", placeholder: "1990s" },
      { key: "time", label: "Time of day", placeholder: "night" },
      { key: "weather", label: "Weather", placeholder: "heavy snow" },
      { key: "lighting", label: "Lighting", placeholder: "sodium streetlights, warm lamp" },
      { key: "notes", label: "Notes", long: true },
    ],
    aiBrief:
      "Design a fictional location for a crime-thriller series. Be concrete and visual: layout, materials, key objects, light. No real brands or readable signage.",
    imagePrompt: (name, f) =>
      `Cinematic establishing shot of ${name}, a fictional location in a ${f.town || "small American town"}. ${join(f.description)}. Time of day: ${f.time || "night"}. Weather: ${f.weather || "clear"}. Era: ${f.era || "1990s"}. Lighting: ${f.lighting || "practical light, deep shadows"}. No people, no readable text. ${STYLE_LINE}`,
  },
];

export function libraryType(slugOrType: string): LibraryTypeInfo | undefined {
  return LIBRARY.find((t) => t.slug === slugOrType || t.type === slugOrType);
}

/** Character slug = first name, lower case; shot prompts reference "<slug>_front". */
export function librarySlug(type: LibraryType, name: string): string {
  const base = type === "character" ? name.trim().split(/\s+/)[0] : name;
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "item"
  );
}

export type LibraryItemView = {
  _id: string;
  type: LibraryType;
  name: string;
  slug: string;
  fields: Record<string, string>;
  image: string;
  updatedAt: string;
};

export type AssetView = {
  _id: string;
  episode: string;
  item: string;
  kind: string;
  title: string;
  prompt: string;
  path: string;
  source: "generated" | "uploaded";
  model: string;
  createdAt: string;
};

/** The item as text, for AI context. */
export function describeItem(item: Pick<LibraryItemView, "type" | "name" | "fields">): string {
  const info = libraryType(item.type);
  const lines = (info?.fields ?? [])
    .map((f) => (item.fields[f.key]?.trim() ? `- ${f.label}: ${item.fields[f.key].trim()}` : ""))
    .filter(Boolean);
  return `${info?.singular ?? item.type}: ${item.name}\n${lines.join("\n")}`;
}
