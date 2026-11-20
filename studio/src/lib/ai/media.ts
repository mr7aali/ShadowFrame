import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { ResolvedProvider } from "./settings";
import { assertOk } from "./text";

/* ---------- Images ---------- */

export type ImageResult = { data: Buffer; ext: ".png" | ".jpg" | ".webp" };

/**
 * Generates one 16:9 image. `refs` are absolute paths to approved reference
 * images (locked faces, locations); providers that accept them use them to
 * keep characters consistent.
 */
export async function generateImage(opts: {
  creds: ResolvedProvider;
  model: string;
  prompt: string;
  refs: string[];
}): Promise<ImageResult> {
  if (opts.creds.id === "openai") return openaiImage(opts);
  if (opts.creds.id === "gemini") return geminiImage(opts);
  throw new Error(`${opts.creds.id} can't generate images.`);
}

async function openaiImage({ creds, model, prompt, refs }: { creds: ResolvedProvider; model: string; prompt: string; refs: string[] }) {
  let res: Response;
  if (refs.length) {
    const form = new FormData();
    form.set("model", model);
    form.set("prompt", prompt);
    form.set("size", "1536x1024");
    for (const r of refs.slice(0, 10)) {
      const buf = await fs.readFile(r);
      form.append("image[]", new Blob([buf], { type: mimeOf(r) }), path.basename(r));
    }
    res = await fetch(`${creds.baseUrl}/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.apiKey}` },
      body: form,
    });
  } else {
    res = await fetch(`${creds.baseUrl}/images/generations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, size: "1536x1024", n: 1 }),
    });
  }
  await assertOk(res, "OpenAI");
  const json = await res.json();
  const item = json.data?.[0];
  if (item?.b64_json) return { data: Buffer.from(item.b64_json, "base64"), ext: ".png" as const };
  if (item?.url) {
    const img = await fetch(item.url);
    return { data: Buffer.from(await img.arrayBuffer()), ext: ".png" as const };
  }
  throw new Error("OpenAI returned no image.");
}

async function geminiImage({ creds, model, prompt, refs }: { creds: ResolvedProvider; model: string; prompt: string; refs: string[] }) {
  const parts: object[] = [];
  for (const r of refs.slice(0, 3)) {
    parts.push({ inlineData: { mimeType: mimeOf(r), data: (await fs.readFile(r)).toString("base64") } });
  }
  parts.push({
    text: refs.length
      ? `Use the attached images as identity and location references. ${prompt}`
      : prompt,
  });
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": creds.apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } },
      }),
    },
  );
  await assertOk(res, "Gemini");
  const json = await res.json();
  for (const part of json.candidates?.[0]?.content?.parts ?? []) {
    const inline = part.inlineData ?? part.inline_data;
    if (inline?.data) {
      const mime: string = inline.mimeType ?? inline.mime_type ?? "image/png";
      return { data: Buffer.from(inline.data, "base64"), ext: mime.includes("jpeg") ? (".jpg" as const) : (".png" as const) };
    }
  }
  const reason = json.candidates?.[0]?.finishReason ?? json.promptFeedback?.blockReason;
  throw new Error(`Gemini returned no image${reason ? ` (${reason})` : ""}.`);
}

function mimeOf(file: string) {
  const ext = path.extname(file).toLowerCase();
  return ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : "image/png";
}

/* ---------- Voice ---------- */

/** Text-to-speech for one narration section. Returns MP3 bytes. */
export async function generateSpeech(opts: {
  creds: ResolvedProvider;
  model: string;
  voice: string;
  text: string;
}): Promise<Buffer> {
  const chunks = splitForTts(opts.text, opts.creds.id === "openai" ? 3800 : 4500);
  const parts: Buffer[] = [];
  for (const chunk of chunks) parts.push(await speakChunk(opts, chunk));
  return Buffer.concat(parts);
}

async function speakChunk(
  { creds, model, voice }: { creds: ResolvedProvider; model: string; voice: string },
  text: string,
): Promise<Buffer> {
  let res: Response;
  if (creds.id === "openai") {
    res = await fetch(`${creds.baseUrl}/audio/speech`, {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        voice: voice || "onyx",
        input: text,
        response_format: "mp3",
        ...(model.includes("gpt-4o")
          ? { instructions: "Calm, controlled narrator for a dark, cinematic crime thriller. Measured pace; let tension build; slight pauses before reveals." }
          : {}),
      }),
    });
  } else if (creds.id === "elevenlabs") {
    if (!voice) throw new Error("Set an ElevenLabs Voice ID on the AI connections page.");
    res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": creds.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ text, model_id: model }),
      },
    );
  } else {
    throw new Error(`${creds.id} can't generate speech.`);
  }
  await assertOk(res, creds.id === "openai" ? "OpenAI" : "ElevenLabs");
  return Buffer.from(await res.arrayBuffer());
}

function splitForTts(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const out: string[] = [];
  let cur = "";
  for (const para of text.split(/\n{2,}/)) {
    if (cur && cur.length + para.length + 2 > max) {
      out.push(cur);
      cur = "";
    }
    if (para.length > max) {
      for (const sentence of para.split(/(?<=[.!?…])\s+/)) {
        if (cur && cur.length + sentence.length + 1 > max) {
          out.push(cur);
          cur = "";
        }
        cur += (cur ? " " : "") + sentence;
      }
    } else cur += (cur ? "\n\n" : "") + para;
  }
  if (cur) out.push(cur);
  return out;
}

/* ---------- Connection test ---------- */

export async function testConnection(creds: ResolvedProvider): Promise<string> {
  switch (creds.id) {
    case "anthropic": {
      const client = new Anthropic({ apiKey: creds.apiKey });
      const page = await client.models.list({ limit: 5 });
      return `Connected · ${page.data.length ? page.data.map((m) => m.id).slice(0, 3).join(", ") : "key works"}`;
    }
    case "gemini": {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=5", {
        headers: { "x-goog-api-key": creds.apiKey },
      });
      await assertOk(res, "Gemini");
      return "Connected";
    }
    case "elevenlabs": {
      const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": creds.apiKey } });
      await assertOk(res, "ElevenLabs");
      const json = await res.json();
      const voices = (json.voices ?? []).slice(0, 4).map((v: { name: string; voice_id: string }) => `${v.name} (${v.voice_id})`);
      return `Connected${voices.length ? ` · voices: ${voices.join(", ")}` : ""}`;
    }
    default: {
      const res = await fetch(`${creds.baseUrl}/models`, {
        headers: creds.apiKey ? { Authorization: `Bearer ${creds.apiKey}` } : {},
      });
      await assertOk(res, creds.id);
      return "Connected";
    }
  }
}
