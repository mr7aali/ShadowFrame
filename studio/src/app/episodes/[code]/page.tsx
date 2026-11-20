import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionButton } from "@/components/client";
import { IconArrowRight, IconCheck, IconFilm, IconLock } from "@/components/icons";
import { BTN, BTN_PRIMARY, Card, docUrl, fileUrl, Progress, Skeleton } from "@/components/ui";
import { reimportEpisode } from "@/lib/actions";
import { getLibrary } from "@/lib/library-server";
import { moduleUrl, stepUrl } from "@/lib/pipeline";
import { getFinalVideo, getMediaStatus, withMedia, type MediaStatus } from "@/lib/production";
import { getWorkspace, type WorkspaceStage } from "@/lib/workspace";
import { EpisodeHeader } from "./header";
import { LibraryCard } from "./library-card";

export default function EpisodePage({ params }: PageProps<"/episodes/[code]">) {
  return (
    <Suspense fallback={<Skeleton rows={8} />}>
      <Overview params={params} />
    </Suspense>
  );
}

async function Overview({ params }: { params: PageProps<"/episodes/[code]">["params"] }) {
  const { code } = await params;
  const [ws, library] = await Promise.all([getWorkspace(code), getLibrary()]);
  if (!ws) notFound();
  const { episode: ep, stages, current } = ws;
  const [media, final] = await Promise.all([getMediaStatus(code, ep.folder), getFinalVideo(code)]);
  const currentStage = current ? stages.find((s) => s.key === current.stageKey) : null;

  const info = [
    ["Logline", ep.logline],
    ["Length", ep.length],
    ["Style", ep.style],
    ["Story shape", ep.storyShape],
    ["Cast", ep.cast],
  ].filter(([, v]) => v && v !== "TBD");

  return (
    <>
      <EpisodeHeader episode={ep} active="overview" />

      <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* The goal: a finished video */}
        <Card className="overflow-hidden">
          {final ? (
            <div className="grid md:grid-cols-[1.4fr_1fr]">
              <video controls className="aspect-video w-full bg-black" src={fileUrl(final.output, final.updatedAt)} />
              <div className="flex flex-col justify-center gap-2 p-5">
                <div className="text-xs font-medium uppercase tracking-wider text-emerald-600">Latest render</div>
                <div className="font-semibold">{final.output.split("/").pop()}</div>
                <div className="text-sm text-muted">
                  {final.options.resolution} · {Math.floor(final.seconds / 60)}:{String(Math.round(final.seconds % 60)).padStart(2, "0")}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a href={`${fileUrl(final.output)}?download`} className={BTN_PRIMARY}>
                    Download
                  </a>
                  <Link href={moduleUrl(code, "render")} className={BTN}>
                    Re-render
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 bg-linear-to-r from-accent-soft to-white p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-white">
                  <IconFilm width={22} height={22} />
                </span>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-accent">
                    {current ? `Up next · Module ${currentStage?.number} · ${currentStage?.title}` : "Ready to render"}
                  </div>
                  <div className="mt-0.5 text-lg font-semibold">{current ? current.title : "Every document is complete"}</div>
                  <div className="text-sm text-muted">{current ? current.summary : "Render the final video in Edit & render."}</div>
                </div>
              </div>
              <Link href={current ? stepUrl(code, current) : moduleUrl(code, "render")} className={`${BTN_PRIMARY} px-4! py-2!`}>
                {current ? (current.words ? "Continue" : "Start") : "Render video"} <IconArrowRight width={16} height={16} />
              </Link>
            </div>
          )}
        </Card>
        <Card className="space-y-3 p-4">
          <Progress value={ws.done} total={ws.files.length} label="Documents" />
          <Progress
            value={Object.values(media).filter((m) => m.total && m.done === m.total).length}
            total={Object.values(media).length}
            label="Media steps complete"
          />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Production · idea to video</h2>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {withMedia(stages, media).map((s) => (
              <ModuleCard key={s.key} code={code} stage={s} media={media[s.key]} isCurrent={s.key === currentStage?.key} />
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <LibraryCard
            code={ep.code}
            library={library}
            story={ep.libraryStory ?? ""}
            cast={ep.libraryCast ?? []}
            locations={ep.libraryLocations ?? []}
          />
          {info.length > 0 && (
            <Card className="space-y-3 p-4 text-sm">
              {info.map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs uppercase tracking-wider text-muted">{k}</div>
                  <div className="mt-0.5">{v}</div>
                </div>
              ))}
            </Card>
          )}
          <Card className="space-y-3 p-4 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted">Repo</div>
            <Link className="block text-accent hover:underline" href={docUrl(`${ep.folder}/README.md`)}>
              {ep.folder}/README.md
            </Link>
            <ActionButton action={reimportEpisode.bind(null, ep.folder)} pendingText="Re-importing…">
              Re-import {ep.folder}
            </ActionButton>
            <p className="text-xs text-muted">Edited a file outside the studio? Re-import to refresh shots and cast.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}

function ModuleCard({
  code,
  stage: s,
  media,
  isCurrent,
}: {
  code: string;
  stage: WorkspaceStage;
  media?: MediaStatus;
  isCurrent: boolean;
}) {
  const locked = s.status === "locked";
  const body = (
    <Card
      className={`flex h-full flex-col p-4 transition ${locked ? "opacity-60" : "group-hover:border-accent/50 group-hover:shadow-md"} ${
        isCurrent ? "ring-2 ring-accent/40" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-semibold ${
            s.status === "done" ? "bg-emerald-500 text-white" : locked ? "bg-slate-100 text-slate-400" : "bg-accent text-white"
          }`}
        >
          {s.status === "done" ? <IconCheck width={16} height={16} /> : locked ? <IconLock width={14} height={14} /> : s.number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold group-hover:text-accent">{s.title}</span>
            {isCurrent && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white">Now</span>}
          </div>
          <p className="text-xs text-muted">{s.description}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-xs">
        <Bar label="Documents" done={s.done} total={s.files.length} />
        {media && <Bar label={media.label[0].toUpperCase() + media.label.slice(1)} done={media.done} total={media.total} />}
      </div>
    </Card>
  );
  return locked ? (
    <div>{body}</div>
  ) : (
    <Link href={moduleUrl(code, s.key)} className="group">
      {body}
    </Link>
  );
}

function Bar({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const full = total > 0 && done === total;
  return (
    <div>
      <div className="mb-1 flex justify-between text-muted">
        <span>{label}</span>
        <span className="tabular-nums">{total ? `${done}/${total}` : "—"}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className={`h-full rounded-full ${full ? "bg-emerald-500" : "bg-accent"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
