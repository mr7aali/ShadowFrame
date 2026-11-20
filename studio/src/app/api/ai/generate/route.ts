import { buildFilePrompt } from "@/lib/ai/prompt-builder";
import { getRoute } from "@/lib/ai/settings";
import { streamText } from "@/lib/ai/text";
import { getEpisode } from "@/lib/queries";

/** Marker the client looks for when a stream fails part-way. */
const ERROR_MARK = "\u0000ERROR:";

/**
 * Streams a generated pipeline file as plain text.
 * Body: { code, stage, slug, extra }
 */
export async function POST(req: Request) {
  const { code, stage, slug, extra } = (await req.json().catch(() => ({}))) as Record<string, string>;
  const episode = code ? await getEpisode(code) : null;
  if (!episode) return Response.json({ error: "Episode not found" }, { status: 404 });

  const built = await buildFilePrompt(episode, stage, slug, extra ?? "");
  if (!built) return Response.json({ error: "Unknown file" }, { status: 404 });

  const route = await getRoute("text");
  if (!route)
    return Response.json(
      { error: "No text AI connected. Add one on the AI connections page, or copy the prompt instead." },
      { status: 400 },
    );

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamText({
          creds: route.creds,
          model: route.model,
          system: built.system,
          prompt: built.prompt,
          signal: req.signal,
        }))
          controller.enqueue(encoder.encode(chunk));
      } catch (e) {
        if (!req.signal.aborted)
          controller.enqueue(encoder.encode(`${ERROR_MARK}${e instanceof Error ? e.message : "Generation failed"}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Provider": route.provider,
      "X-Model": route.model,
    },
  });
}
