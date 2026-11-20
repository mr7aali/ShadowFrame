/** AI providers the studio can call, and what each one can do. Client-safe. */

export type Capability = "text" | "image" | "voice";

export const CAPABILITIES: { key: Capability; label: string; description: string }[] = [
  { key: "text", label: "Script & text", description: "Ideas, outline, script, character bible, every prompt file" },
  { key: "image", label: "Images", description: "Character faces, locations, shot stills" },
  { key: "voice", label: "Voice", description: "Narration audio, section by section" },
];

export type ProviderId = "anthropic" | "openai" | "gemini" | "openrouter" | "ollama" | "elevenlabs";

export type ProviderInfo = {
  id: ProviderId;
  name: string;
  blurb: string;
  keyUrl: string;
  envVar: string;
  /** Provider runs locally and needs no key (Ollama). */
  keyless?: boolean;
  /** Show a base URL field. */
  baseUrl?: string;
  /** Default model per capability. Users can override any of these. */
  models: Partial<Record<Capability, { default: string; suggestions: string[] }>>;
  /** Voice providers need a voice name / id too. */
  voice?: { label: string; default: string; suggestions: string[] };
};

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "anthropic",
    name: "Anthropic Claude",
    blurb: "Best for long-form story, script and editing passes.",
    keyUrl: "https://console.anthropic.com/settings/keys",
    envVar: "ANTHROPIC_API_KEY",
    models: {
      text: {
        default: "claude-opus-5-5",
        suggestions: ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5", "claude-fable-5-2"],
      },
    },
  },
  {
    id: "openai",
    name: "OpenAI",
    blurb: "Text, image generation with reference images, and text-to-speech.",
    keyUrl: "https://platform.openai.com/api-keys",
    envVar: "OPENAI_API_KEY",
    baseUrl: "https://api.openai.com/v1",
    models: {
      text: { default: "gpt-5", suggestions: ["gpt-5", "gpt-5-mini", "gpt-4.1"] },
      image: { default: "gpt-image-1", suggestions: ["gpt-image-1"] },
      voice: { default: "gpt-4o-mini-tts", suggestions: ["gpt-4o-mini-tts", "tts-1-hd"] },
    },
    voice: { label: "Voice", default: "onyx", suggestions: ["onyx", "ash", "sage", "echo", "fable", "nova", "alloy", "shimmer", "coral"] },
  },
  {
    id: "gemini",
    name: "Google Gemini",
    blurb: "Text and image generation (accepts reference images).",
    keyUrl: "https://aistudio.google.com/apikey",
    envVar: "GEMINI_API_KEY",
    models: {
      text: { default: "gemini-2.5-pro", suggestions: ["gemini-2.5-pro", "gemini-2.5-flash"] },
      image: { default: "gemini-2.5-flash-image", suggestions: ["gemini-2.5-flash-image"] },
    },
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    blurb: "One key for hundreds of text models (Llama, Mistral, DeepSeek…).",
    keyUrl: "https://openrouter.ai/keys",
    envVar: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1",
    models: {
      text: { default: "deepseek/deepseek-chat", suggestions: ["deepseek/deepseek-chat", "meta-llama/llama-3.3-70b-instruct", "mistralai/mistral-large"] },
    },
  },
  {
    id: "ollama",
    name: "Ollama (local)",
    blurb: "Free, runs on your own computer. Needs Ollama running.",
    keyUrl: "https://ollama.com/download",
    envVar: "OLLAMA_API_KEY",
    keyless: true,
    baseUrl: "http://localhost:11434/v1",
    models: {
      text: { default: "llama3.1", suggestions: ["llama3.1", "qwen2.5", "mistral"] },
    },
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    blurb: "Natural narration voices. Check your plan allows commercial use.",
    keyUrl: "https://elevenlabs.io/app/settings/api-keys",
    envVar: "ELEVENLABS_API_KEY",
    models: {
      voice: { default: "eleven_multilingual_v2", suggestions: ["eleven_multilingual_v2", "eleven_turbo_v2_5"] },
    },
    voice: { label: "Voice ID", default: "", suggestions: [] },
  },
];

export function providerInfo(id: string): ProviderInfo | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/** What the settings page and buttons get to see. Keys are never sent to the browser. */
export type ProviderPublic = {
  id: ProviderId;
  connected: boolean;
  source: "saved" | "env" | "none";
  keyHint: string; // "sk-…a1B2"
  baseUrl: string;
};

export type RouteConfig = { provider: ProviderId | ""; model: string; voice: string };

export type AiPublic = {
  providers: ProviderPublic[];
  routing: Record<Capability, RouteConfig>;
};
