import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const STEP_STATUSES = ["todo", "in_progress", "done"] as const;
export const ASSET_STATUSES = ["todo", "generated", "approved", "rejected"] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];
export type AssetStatus = (typeof ASSET_STATUSES)[number];

/* ---------- Episode ---------- */

const StepSchema = new Schema(
  {
    order: { type: Number, required: true },
    label: { type: String, required: true }, // "1", "3–4", "★"
    title: { type: String, required: true },
    file: { type: String, default: "" }, // repo-relative path, e.g. video_1/01-story/01-idea.md
    tool: { type: String, default: "" },
    status: { type: String, enum: STEP_STATUSES, default: "todo" },
    note: { type: String, default: "" }, // next action, e.g. "generate + approve faces"
  },
  { _id: true },
);

const EpisodeSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // EP001
    title: { type: String, required: true },
    folder: { type: String, required: true }, // video_1
    logline: { type: String, default: "" },
    length: { type: String, default: "" },
    style: { type: String, default: "" },
    storyShape: { type: String, default: "" },
    cast: { type: String, default: "" },
    releaseDate: { type: Date, default: null },
    steps: { type: [StepSchema], default: [] },
    // Picked from the series library when the episode was created (LibraryItem ids)
    libraryStory: { type: String, default: "" },
    libraryCast: { type: [String], default: [] },
    libraryLocations: { type: [String], default: [] },
  },
  { timestamps: true },
);

/* ---------- Characters & locations (per episode) ---------- */

const NamedPromptSchema = new Schema(
  { label: { type: String, required: true }, text: { type: String, required: true } },
  { _id: false },
);

const CharacterSchema = new Schema(
  {
    episode: { type: String, required: true, index: true }, // episode code
    slug: { type: String, required: true }, // mara
    name: { type: String, required: true },
    prompts: { type: [NamedPromptSchema], default: [] },
    status: { type: String, enum: ASSET_STATUSES, default: "todo" },
    image: { type: String, default: "" }, // repo-relative path of locked reference
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);
CharacterSchema.index({ episode: 1, slug: 1 }, { unique: true });

const LocationSchema = new Schema(
  {
    episode: { type: String, required: true, index: true },
    code: { type: String, required: true }, // L1
    name: { type: String, required: true },
    usedIn: { type: String, default: "" },
    prompt: { type: String, default: "" },
    status: { type: String, enum: ASSET_STATUSES, default: "todo" },
    image: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);
LocationSchema.index({ episode: 1, code: 1 }, { unique: true });

/* ---------- Shots ---------- */

const ShotSchema = new Schema(
  {
    episode: { type: String, required: true, index: true },
    number: { type: Number, required: true },
    section: { type: String, default: "" },
    narration: { type: String, default: "" },
    characters: { type: String, default: "" },
    location: { type: String, default: "" },
    motion: { type: String, default: "" },
    animated: { type: Boolean, default: false },
    refs: { type: [String], default: [] },
    imagePrompt: { type: String, default: "" },
    videoPrompt: { type: String, default: "" },
    overlay: { type: String, default: "" }, // text added in the editor, never in the AI image
    status: { type: String, enum: ASSET_STATUSES, default: "todo" },
    image: { type: String, default: "" },
    video: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);
ShotSchema.index({ episode: 1, number: 1 }, { unique: true });

/* ---------- Saved prompt fills ---------- */

const PromptRunSchema = new Schema(
  {
    template: { type: String, required: true, index: true }, // repo-relative .md path
    blockIndex: { type: Number, default: 0 },
    episode: { type: String, default: "" },
    title: { type: String, default: "" },
    values: { type: Map, of: String, default: {} },
    filled: { type: String, required: true },
    output: { type: String, default: "" }, // what the AI returned, pasted back by hand
  },
  { timestamps: true },
);

/* ---------- AI connections (one document, _id "ai") ---------- */

const ProviderConfigSchema = new Schema(
  {
    apiKey: { type: String, default: "" },
    baseUrl: { type: String, default: "" },
  },
  { _id: false },
);

const RouteSchema = new Schema(
  {
    provider: { type: String, default: "" },
    model: { type: String, default: "" },
    voice: { type: String, default: "" },
  },
  { _id: false },
);

const AiSettingsSchema = new Schema(
  {
    _id: { type: String, default: "ai" },
    providers: { type: Map, of: ProviderConfigSchema, default: {} },
    routing: {
      text: { type: RouteSchema, default: () => ({}) },
      image: { type: RouteSchema, default: () => ({}) },
      voice: { type: RouteSchema, default: () => ({}) },
    },
  },
  { timestamps: true },
);

/* ---------- Series library: characters, stories, locations reused across episodes ---------- */

const LibraryItemSchema = new Schema(
  {
    type: { type: String, enum: ["character", "story", "location"], required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true }, // character: first name ("mara") — matches shot refs like mara_front
    fields: { type: Map, of: String, default: {} },
    image: { type: String, default: "" }, // repo-relative path of the main image
  },
  { timestamps: true },
);

/* ---------- Image assets (library items and episodes) ---------- */

const AssetSchema = new Schema(
  {
    episode: { type: String, default: "", index: true }, // episode code, "" for library assets
    item: { type: String, default: "", index: true }, // LibraryItem id, "" if none
    kind: { type: String, default: "other" }, // character, location, story, shot, thumbnail, other
    title: { type: String, default: "" },
    prompt: { type: String, default: "" }, // the prompt the image was made from
    path: { type: String, required: true }, // repo-relative
    source: { type: String, enum: ["generated", "uploaded"], default: "generated" },
    model: { type: String, default: "" },
  },
  { timestamps: true },
);

/* ---------- Exports ---------- */

function model<T extends Schema>(name: string, schema: T) {
  // In dev, hot reload re-runs this file: replace the cached model so schema changes apply without a restart.
  if (process.env.NODE_ENV !== "production" && mongoose.models[name]) mongoose.deleteModel(name);
  return (mongoose.models[name] as Model<InferSchemaType<T>>) ?? mongoose.model(name, schema);
}

export const Episode = model("Episode", EpisodeSchema);
export const Character = model("Character", CharacterSchema);
export const Location = model("Location", LocationSchema);
export const Shot = model("Shot", ShotSchema);
export const PromptRun = model("PromptRun", PromptRunSchema);
export const AiSettings = model("AiSettings", AiSettingsSchema);
export const LibraryItem = model("LibraryItem", LibraryItemSchema);
export const Asset = model("Asset", AssetSchema);

export type EpisodeDoc = InferSchemaType<typeof EpisodeSchema>;
export type StepDoc = InferSchemaType<typeof StepSchema>;
