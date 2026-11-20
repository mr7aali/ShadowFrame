import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { IconCheck, IconLock } from "@/components/icons";
import { BTN_PRIMARY, Card, Skeleton } from "@/components/ui";
import { providerInfo } from "@/lib/ai/catalog";
import { asChatPrompt, buildFilePrompt } from "@/lib/ai/prompt-builder";
import { getAiPublic } from "@/lib/ai/settings";
import { ALL_FILES, stepUrl } from "@/lib/pipeline";
import { getWorkspace, readEpisodeFile, type Workspace } from "@/lib/workspace";
import { EpisodeHeader } from "../../../header";
import { StepWorkspace } from "./workspace";

export const metadata = { title: "Step" };

type Params = PageProps<"/episodes/[code]/step/[stage]/[file]">["params"];

export default function StepPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton rows={8} />}>
      <Step params={params} />
    </Suspense>
  );
}

async function Step({ params }: { params: Params }) {
  const { code, stage: stageKey, file: slug } = await params;
  const ws = await getWorkspace(code);
  if (!ws) notFound();
  const file = ws.files.find((f) => f.stageKey === stageKey && f.slug === slug);
  if (!file) notFound();
  const stage = ws.stages.find((s) => s.key === stageKey)!;

  const prev = ALL_FILES[file.index - 1];
  const next = ALL_FILES[file.index + 1];

  return (
    <>
      <EpisodeHeader episode={ws.episode} active="step" />
      <div className="grid gap-6 2xl:grid-cols-[250px_1fr]">
        <Stepper ws={ws} activePath={file.path} />
        <div className="min-w-0">
          <CompactStepper ws={ws} activePath={file.path} />
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-full bg-panel-2 px-2 py-0.5 font-medium">
              Stage {stage.number} · {stage.title}
            </span>
            <span>
              File {file.index + 1} of {ws.files.length}
            </span>
            <span className="font-mono">{file.repoPath}</span>
          </div>

          {file.locked ? (
            <Locked ws={ws} title={file.title} />
          ) : (
            <Unlocked
              ws={ws}
              stageKey={stageKey}
              slug={slug}
              prevUrl={prev ? stepUrl(code, prev.file) : null}
              nextUrl={next ? stepUrl(code, next.file) : null}
            />
          )}
        </div>
      </div>
    </>
  );
}

async function Unlocked({
  ws,
  stageKey,
  slug,
  prevUrl,
  nextUrl,
}: {
  ws: Workspace;
  stageKey: string;
  slug: string;
  prevUrl: string | null;
  nextUrl: string | null;
}) {
  const file = ws.files.find((f) => f.stageKey === stageKey && f.slug === slug)!;
  const [content, built, ai] = await Promise.all([
    readEpisodeFile(ws.episode.folder, file.path),
    buildFilePrompt(ws.episode, stageKey, slug),
    getAiPublic(),
  ]);
  if (!built) notFound();

  // Split so the browser can insert "extra instructions" before the final line.
  const chat = asChatPrompt(built);
  const cut = chat.lastIndexOf("\n\nNow write");
  const route = ai.routing.text;

  return (
    <StepWorkspace
      code={ws.episode.code}
      stageKey={stageKey}
      slug={slug}
      title={file.title}
      summary={file.summary}
      task={file.task}
      status={file.status}
      initialContent={content}
      prompt={{ before: chat.slice(0, cut), after: chat.slice(cut) }}
      context={built.context}
      templates={built.templates}
      ai={route.provider ? { provider: providerInfo(route.provider)?.name ?? route.provider, model: route.model } : null}
      media={file.media ?? null}
      prevUrl={prevUrl}
      nextUrl={nextUrl}
    />
  );
}

function Locked({ ws, title }: { ws: Workspace; title: string }) {
  const current = ws.current!;
  return (
    <Card className="p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
        <IconLock width={22} height={22} />
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title} is locked</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">
        Each file builds on the ones before it. Complete <strong className="text-foreground">{current.title}</strong>{" "}
        first, and this step unlocks.
      </p>
      <Link href={stepUrl(ws.episode.code, current)} className={`${BTN_PRIMARY} mt-6`}>
        Go to {current.title}
      </Link>
    </Card>
  );
}

function Stepper({ ws, activePath }: { ws: Workspace; activePath: string }) {
  return (
    <Card className="hidden h-fit p-3 2xl:sticky 2xl:top-6 2xl:block">
      <div className="mb-2 flex items-center justify-between px-2 text-xs text-muted">
        <span className="font-semibold uppercase tracking-wider">Pipeline</span>
        <span className="tabular-nums">
          {ws.done}/{ws.files.length}
        </span>
      </div>
      <ol className="space-y-3">
        {ws.stages.map((s) => (
          <li key={s.key}>
            <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-500">
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                  s.status === "done"
                    ? "bg-emerald-500 text-white"
                    : s.status === "locked"
                      ? "bg-slate-100 text-slate-400"
                      : "bg-accent text-white"
                }`}
              >
                {s.status === "done" ? <IconCheck width={11} height={11} strokeWidth={3} /> : s.number}
              </span>
              {s.title}
            </div>
            <ul className="mt-1 space-y-0.5 border-l border-line pl-2 ml-4.5">
              {s.files.map((f) => {
                const active = f.path === activePath;
                const cls = `flex items-center gap-2 rounded-md px-2 py-1 text-[13px] ${
                  active
                    ? "bg-accent-soft font-medium text-accent"
                    : f.locked
                      ? "text-slate-400"
                      : "text-slate-600 hover:bg-panel-2 hover:text-foreground"
                }`;
                const icon =
                  f.status === "done" ? (
                    <IconCheck width={13} height={13} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
                  ) : f.locked ? (
                    <IconLock width={12} height={12} className="shrink-0" />
                  ) : (
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${f.status === "in_progress" ? "bg-amber-400" : "bg-accent"}`} />
                  );
                return (
                  <li key={f.path}>
                    {f.locked ? (
                      <span className={cls}>
                        {icon}
                        <span className="truncate">{f.title}</span>
                      </span>
                    ) : (
                      <Link href={stepUrl(ws.episode.code, f)} className={cls}>
                        {icon}
                        <span className="truncate">{f.title}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** Below 2xl: stage dots + the current stage's files, in one strip. */
function CompactStepper({ ws, activePath }: { ws: Workspace; activePath: string }) {
  const stage = ws.stages.find((s) => s.files.some((f) => f.path === activePath))!;
  return (
    <Card className="mb-4 p-3 2xl:hidden">
      <div className="flex flex-wrap items-center gap-1.5">
        {ws.stages.map((s) => {
          const first = s.files.find((f) => f.status !== "done") ?? s.files[0];
          const cls = `grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-semibold ${
            s.key === stage.key
              ? "bg-accent text-white ring-2 ring-accent/25"
              : s.status === "done"
                ? "bg-emerald-500 text-white"
                : s.status === "locked"
                  ? "bg-slate-100 text-slate-400"
                  : "bg-accent-soft text-accent"
          }`;
          return s.status === "locked" ? (
            <span key={s.key} className={cls} title={`${s.number}. ${s.title} (locked)`}>
              {s.number}
            </span>
          ) : (
            <Link key={s.key} href={stepUrl(ws.episode.code, first)} className={cls} title={`${s.number}. ${s.title}`}>
              {s.status === "done" && s.key !== stage.key ? <IconCheck width={12} height={12} strokeWidth={3} /> : s.number}
            </Link>
          );
        })}
        <span className="ml-2 text-sm font-semibold">{stage.title}</span>
        <span className="ml-auto text-xs text-muted tabular-nums">
          {ws.done}/{ws.files.length} files
        </span>
      </div>
      {stage.files.length > 1 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
          {stage.files.map((f) => {
            const active = f.path === activePath;
            const cls = `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
              active ? "bg-accent-soft text-accent" : f.locked ? "text-slate-400" : "text-slate-600 hover:bg-panel-2"
            }`;
            const icon =
              f.status === "done" ? (
                <IconCheck width={12} height={12} className="text-emerald-500" strokeWidth={2.5} />
              ) : f.locked ? (
                <IconLock width={11} height={11} />
              ) : null;
            return f.locked ? (
              <span key={f.path} className={cls}>
                {icon}
                {f.title}
              </span>
            ) : (
              <Link key={f.path} href={stepUrl(ws.episode.code, f)} className={cls}>
                {icon}
                {f.title}
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
