import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { IconArrowRight, IconCheck, IconLock, IconSparkles } from "@/components/icons";
import { BTN, BTN_PRIMARY, Card, Skeleton, StatusPill } from "@/components/ui";
import { moduleUrl, PIPELINE, stepUrl } from "@/lib/pipeline";
import { getMediaStatus, mediaComplete } from "@/lib/production";
import { getWorkspace, type WorkspaceFile } from "@/lib/workspace";
import { EpisodeHeader } from "../../header";
import { CastPanel } from "../../panels/cast";
import { MusicPanel } from "../../panels/music";
import { PublishPanel } from "../../panels/publish";
import { RenderPanel } from "../../panels/render";
import { ShotsPanel } from "../../panels/shots";
import { VoicePanel } from "../../panels/voice";

export const metadata = { title: "Module" };

type Params = PageProps<"/episodes/[code]/m/[module]">["params"];

const PANEL_TITLE: Record<string, { title: string; intro: string }> = {
  voice: { title: "Narration", intro: "Generate each section with your voice AI, or record it yourself and upload the mp3." },
  cast: { title: "Faces & locations", intro: "Make one locked image per character and location. Every shot reuses them." },
  shots: { title: "Shot images", intro: "One still per shot. Generate with your image AI (references attached automatically) or upload." },
  motion: { title: "Animated clips", intro: "" },
  music: { title: "Music", intro: "" },
  render: { title: "Final video", intro: "" },
  publish: { title: "Release", intro: "" },
};

export default function ModulePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton rows={6} />}>
      <Module params={params} />
    </Suspense>
  );
}

async function Module({ params }: { params: Params }) {
  const { code, module } = await params;
  const ws = await getWorkspace(code);
  if (!ws) notFound();
  const stage = ws.stages.find((s) => s.key === module);
  if (!stage) notFound();
  const def = PIPELINE.find((p) => p.key === module)!;
  const media = (await getMediaStatus(code, ws.episode.folder))[module];
  const finished = stage.status === "done" && mediaComplete(module, media);
  const idx = PIPELINE.findIndex((p) => p.key === module);
  const next = PIPELINE[idx + 1];
  const prev = PIPELINE[idx - 1];
  const docsDone = stage.done === stage.files.length;
  const nextFile = stage.files.find((f) => f.status !== "done" && !f.locked);

  return (
    <>
      <EpisodeHeader episode={ws.episode} active={module} />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-semibold ${
              finished ? "bg-emerald-500 text-white" : stage.status === "locked" ? "bg-slate-100 text-slate-400" : "bg-accent text-white"
            }`}
          >
            {finished ? <IconCheck width={22} height={22} /> : stage.number}
          </span>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted">Module {stage.number} of {PIPELINE.length}</div>
            <h2 className="text-xl font-semibold tracking-tight">{stage.title}</h2>
            <p className="text-sm text-muted">{stage.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {prev && (
            <Link href={moduleUrl(code, prev.key)} className={BTN}>
              ← {prev.title}
            </Link>
          )}
          {next && (
            <Link href={moduleUrl(code, next.key)} className={BTN}>
              {next.title} →
            </Link>
          )}
        </div>
      </div>

      {stage.status === "locked" ? (
        <Card className="p-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
            <IconLock width={22} height={22} />
          </span>
          <h3 className="mt-4 text-lg font-semibold">{stage.title} unlocks after the earlier modules</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">Each module builds on the one before. Next up:</p>
          {ws.current && (
            <Link href={stepUrl(code, ws.current)} className={`${BTN_PRIMARY} mt-5`}>
              {ws.current.title} <IconArrowRight width={16} height={16} />
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Documents · {stage.done}/{stage.files.length}
              </h3>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <IconSparkles width={14} height={14} className="text-accent" /> Each one has a ready AI prompt built from the steps before it
              </span>
            </div>
            <Card className="divide-y divide-line">
              {stage.files.map((f, i) => (
                <DocRow key={f.path} code={code} file={f} n={i + 1} isNext={f.path === nextFile?.path} />
              ))}
            </Card>
          </section>

          {def.panel && (
            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">{PANEL_TITLE[def.panel].title}</h3>
                  {PANEL_TITLE[def.panel].intro && <p className="text-sm text-muted">{PANEL_TITLE[def.panel].intro}</p>}
                </div>
                {media && (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                      media.total && media.done === media.total
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-panel-2 text-slate-600 ring-line"
                    }`}
                  >
                    {media.done}/{media.total} {media.label}
                  </span>
                )}
              </div>
              {!docsDone && def.panel !== "render" && def.panel !== "music" && (
                <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Finish the documents above first. This step uses what they produce.
                </p>
              )}
              {def.panel === "cast" && <CastPanel ep={ws.episode} />}
              {def.panel === "voice" && <VoicePanel ep={ws.episode} />}
              {def.panel === "shots" && <ShotsPanel ep={ws.episode} />}
              {def.panel === "motion" && <ShotsPanel ep={ws.episode} motion />}
              {def.panel === "music" && <MusicPanel ep={ws.episode} />}
              {def.panel === "render" && <RenderPanel ep={ws.episode} />}
              {def.panel === "publish" && <PublishPanel ep={ws.episode} />}
            </section>
          )}

          {docsDone && next && (
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <span className="text-sm">
                <span className="font-medium">{stage.title} documents complete.</span>{" "}
                <span className="text-muted">Next module: {next.title}.</span>
              </span>
              <Link href={moduleUrl(code, next.key)} className={BTN_PRIMARY}>
                Go to {next.title} <IconArrowRight width={16} height={16} />
              </Link>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function DocRow({ code, file, n, isNext }: { code: string; file: WorkspaceFile; n: number; isNext: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-4 px-5 py-4 ${isNext ? "bg-accent-soft/40" : ""}`}>
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
          file.status === "done" ? "bg-emerald-50 text-emerald-600" : file.locked ? "bg-slate-50 text-slate-300" : "bg-accent-soft text-accent"
        }`}
      >
        {file.status === "done" ? <IconCheck width={16} height={16} /> : file.locked ? <IconLock width={14} height={14} /> : n}
      </span>
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{file.title}</span>
          <StatusPill status={file.locked ? "locked" : file.status} />
        </div>
        <div className="text-sm text-muted">{file.summary}</div>
        <div className="mt-0.5 font-mono text-[11px] text-slate-400">
          {file.path}
          {file.words > 0 && ` · ${file.words.toLocaleString()} words`}
        </div>
      </div>
      {!file.locked && (
        <Link href={stepUrl(code, file)} className={isNext ? BTN_PRIMARY : BTN}>
          {file.status === "done" ? "Open" : file.words ? "Continue" : (
            <>
              <IconSparkles width={15} height={15} /> Create with AI
            </>
          )}
        </Link>
      )}
    </div>
  );
}
