import { Suspense } from "react";
import { Card, PageTitle, Skeleton } from "@/components/ui";
import { CAPABILITIES, PROVIDERS } from "@/lib/ai/catalog";
import { getAiPublic } from "@/lib/ai/settings";
import { ProviderCard, RoutingRow } from "./forms";

export const metadata = { title: "AI connections" };

export default function AiSettingsPage() {
  return (
    <>
      <PageTitle
        title="AI connections"
        subtitle="Connect the AI services you use, then choose which one handles each kind of task. Without a connection, every step still gives you a ready-made prompt to copy."
      />
      <Suspense fallback={<Skeleton rows={5} />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  const ai = await getAiPublic();
  const connected = ai.providers.filter((p) => p.connected).map((p) => p.id);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 font-semibold">Task routing</h2>
        <p className="mb-3 text-sm text-muted">Which connected AI does which job. Models are editable — type any model ID the provider offers.</p>
        <Card className="divide-y divide-line">
          {CAPABILITIES.map((c) => (
            <RoutingRow key={c.key} capability={c} route={ai.routing[c.key]} connected={connected} />
          ))}
          <div className="grid gap-1 px-5 py-4 text-sm sm:grid-cols-[220px_1fr]">
            <div>
              <div className="font-medium">Video & music</div>
              <div className="text-xs text-muted">Image-to-video clips, music beds</div>
            </div>
            <p className="text-sm text-muted">
              Copy & paste for now. The studio writes the video prompts and the music cue sheet; generate the clips
              in Runway, Kling, Veo or Luma, and upload them on the Shot board.
            </p>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-1 font-semibold">Providers</h2>
        <p className="mb-3 text-sm text-muted">
          Keys are stored in your local MongoDB and only used by this app&apos;s server; the browser never sees them.
          You can also set them in <code>studio/.env.local</code> (e.g. <code>ANTHROPIC_API_KEY</code>).
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {PROVIDERS.map((info) => (
            <ProviderCard key={info.id} info={info} state={ai.providers.find((p) => p.id === info.id)!} />
          ))}
        </div>
      </section>
    </div>
  );
}
