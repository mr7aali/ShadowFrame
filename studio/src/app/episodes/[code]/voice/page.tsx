import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BTN, Card, Skeleton } from "@/components/ui";
import { providerInfo } from "@/lib/ai/catalog";
import { getAiPublic } from "@/lib/ai/settings";
import { REPO_ROOT } from "@/lib/paths";
import { findFile, stepUrl } from "@/lib/pipeline";
import { getEpisode } from "@/lib/queries";
import { splitScript } from "@/lib/voice-sections";
import { readEpisodeFile } from "@/lib/workspace";
import { EpisodeHeader } from "../header";
import { VoiceRow } from "./row";

export const metadata = { title: "Voice" };

export default function VoicePage({ params }: PageProps<"/episodes/[code]/voice">) {
  return (
    <Suspense fallback={<Skeleton rows={6} />}>
      <Voice params={params} />
    </Suspense>
  );
}

async function Voice({ params }: { params: PageProps<"/episodes/[code]/voice">["params"] }) {
  const { code } = await params;
  const [ep, ai] = await Promise.all([getEpisode(code), getAiPublic()]);
  if (!ep) notFound();

  const sections = splitScript(await readEpisodeFile(ep.folder, "01-story/script-final.md"));
  const files = await Promise.all(
    sections.map(async (s) => {
      const rel = `${ep.folder}/assets/voice/${s.name}.mp3`;
      try {
        const st = await fs.stat(path.join(REPO_ROOT, rel));
        return { rel, version: String(st.mtimeMs) };
      } catch {
        return null;
      }
    }),
  );
  const route = ai.routing.voice;
  const totalWords = sections.reduce((n, s) => n + s.words, 0);
  const done = files.filter(Boolean).length;
  const scriptStep = findFile("01-story", "script-final")!.file;
  const setupStep = findFile("05-voice", "voice-setup")!.file;

  return (
    <>
      <EpisodeHeader episode={ep} active="voice" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-sm text-muted">
          One narration file per script section, saved to <code>{ep.folder}/assets/voice/</code>. Read the{" "}
          <Link className="text-accent hover:underline" href={stepUrl(ep.code, setupStep)}>
            voice setup
          </Link>{" "}
          first for the voice description and pronunciation.
        </p>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">
            {done}/{sections.length} recorded · ~{Math.round(totalWords / 150)} min
          </span>
          {route.provider ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">
              {providerInfo(route.provider)?.name} · {route.voice || route.model}
            </span>
          ) : (
            <Link href="/settings/ai" className={BTN}>
              Connect a voice AI
            </Link>
          )}
        </div>
      </div>

      {sections.length ? (
        <div className="space-y-3">
          {sections.map((s, i) => (
            <VoiceRow
              key={s.name}
              code={ep.code}
              section={s}
              file={files[i]}
              canGenerate={!!route.provider}
            />
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <p className="font-medium">No final script yet</p>
          <p className="mt-1 text-sm text-muted">The narration sections come from the locked script.</p>
          <Link href={stepUrl(ep.code, scriptStep)} className={`${BTN} mt-4`}>
            Open the final script
          </Link>
        </Card>
      )}
    </>
  );
}
