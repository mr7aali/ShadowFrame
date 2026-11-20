import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ResolvedProvider } from "./settings";

export type TextRequest = {
  creds: ResolvedProvider;
  model: string;
  system: string;
  prompt: string;
  signal?: AbortSignal;
};

/** Streams generated text from whichever provider is routed to "Script & text". */
export function streamText(req: TextRequest): AsyncGenerator<string> {
  switch (req.creds.id) {
    case "anthropic":
      return streamAnthropic(req);
    case "gemini":
      return streamGemini(req);
    case "openai":
    case "openrouter":
    case "ollama":
      return streamOpenAICompatible(req);
    default:
      throw new Error(`${req.creds.id} can't generate text.`);
  }
}

/* ---------- Anthropic (official SDK) ---------- */

// Models that accept server-side refusal fallbacks (`fallbacks: "default"`).
const FALLBACK_MODELS = /^claude-(fable-5-[12]|opus-5(-5)?|sonnet-5-5)$/;
// Models that accept output_config.effort.
const EFFORT_MODELS = /^claude-(fable|mythos|opus-5|sonnet-5|haiku-5|opus-4-[678]|sonnet-4-6)/;

async function* streamAnthropic({ creds, model, system, prompt, signal }: TextRequest) {
  const client = new Anthropic({ apiKey: creds.apiKey });
  const stream = client.beta.messages.stream(
    {
      model,
      max_tokens: 64000,
      system,
      messages: [{ role: "user", content: prompt }],
      // Long-form creative writing benefits from more thinking than the default.
      ...(EFFORT_MODELS.test(model) ? { output_config: { effort: "high" as const } } : {}),
      // If a request is declined by a safety classifier, retry on a fallback model
      // automatically (crime fiction occasionally trips one).
      ...(FALLBACK_MODELS.test(model)
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
    },
    { signal },
  );

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal")
    throw new Error("Claude declined this request. Rephrase the extra instructions and try again.");
  if (final.stop_reason === "max_tokens") yield "\n\n<!-- Output stopped at the length limit. -->";
}

/* ---------- OpenAI-compatible: OpenAI, OpenRouter, Ollama ---------- */

async function* streamOpenAICompatible({ creds, model, system, prompt, signal }: TextRequest) {
  const res = await fetch(`${creds.baseUrl}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(creds.apiKey ? { Authorization: `Bearer ${creds.apiKey}` } : {}),
      ...(creds.id === "openrouter" ? { "X-Title": "Case Studio" } : {}),
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });
  await assertOk(res, creds.id);
  for await (const data of sse(res)) {
    if (data === "[DONE]") return;
    const json = JSON.parse(data);
    if (json.error) throw new Error(json.error.message ?? "Provider error");
    const text = json.choices?.[0]?.delta?.content;
    if (text) yield text as string;
  }
}

/* ---------- Google Gemini ---------- */

async function* streamGemini({ creds, model, system, prompt, signal }: TextRequest) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "x-goog-api-key": creds.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });
  await assertOk(res, "gemini");
  for await (const data of sse(res)) {
    const json = JSON.parse(data);
    if (json.error) throw new Error(json.error.message ?? "Gemini error");
    for (const part of json.candidates?.[0]?.content?.parts ?? []) if (part.text) yield part.text as string;
  }
}

/* ---------- helpers ---------- */

export async function assertOk(res: Response, who: string) {
  if (res.ok) return;
  let detail = "";
  try {
    const body = await res.text();
    try {
      const j = JSON.parse(body);
      detail = j.error?.message ?? j.detail?.message ?? j.detail ?? j.message ?? body;
    } catch {
      detail = body;
    }
  } catch {}
  throw new Error(`${who} returned ${res.status}${detail ? `: ${String(detail).slice(0, 300)}` : ""}`);
}

/** Yields the `data:` payload of each server-sent event. */
async function* sse(res: Response): AsyncGenerator<string> {
  if (!res.body) return;
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).replace(/\r$/, "");
      buf = buf.slice(i + 1);
      if (line.startsWith("data:")) {
        const data = line.slice(5).trim();
        if (data) yield data;
      }
    }
  }
}
