"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { IconFilm } from "@/components/icons";
import { BTN, BTN_PRIMARY, Card, fileUrl } from "@/components/ui";
import type { RenderJobView } from "@/lib/production";
import { cancelRenderAction, startRenderAction } from "@/lib/studio-actions";

export function RenderControls({
  code,
  job,
  final,
  ready,
  estimated,
}: {
  code: string;
  job: RenderJobView | null;
  final: RenderJobView | null;
  ready: boolean;
  estimated: string;
}) {
  const router = useRouter();
  const [resolution, setResolution] = useState<"720p" | "1080p">((job?.options.resolution as "720p" | "1080p") ?? "720p");
  const [music, setMusic] = useState(job?.options.music ?? true);
  const [volume, setVolume] = useState(job?.options.musicVolume ?? 0.18);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const runningNow = job?.status === "running";

  // Poll while a render is running.
  useEffect(() => {
    if (!runningNow) return;
    const t = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(t);
  }, [runningNow, router]);

  const lastDone = final;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line bg-linear-to-r from-accent-soft to-white px-4 py-3">
          <IconFilm className="text-accent" />
          <h3 className="font-semibold">Render the video</h3>
          {estimated && <span className="ml-auto text-xs text-muted">≈ {estimated}</span>}
        </div>
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <label className="text-xs font-medium text-muted">
              Quality
              <div className="mt-1 flex gap-1 rounded-lg bg-panel-2 p-0.5">
                {(["720p", "1080p"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResolution(r)}
                    className={`rounded-md px-3 py-1 text-sm ${resolution === r ? "bg-white font-medium text-foreground shadow-sm" : "text-muted"}`}
                  >
                    {r === "720p" ? "720p draft" : "1080p final"}
                  </button>
                ))}
              </div>
            </label>
            <label className="flex items-center gap-2 pb-1.5 text-sm">
              <input type="checkbox" checked={music} onChange={(e) => setMusic(e.target.checked)} />
              Music bed
            </label>
            {music && (
              <label className="text-xs font-medium text-muted">
                Music volume {Math.round(volume * 100)}%
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="mt-2 block w-40 accent-(--accent)"
                />
              </label>
            )}
          </div>

          {runningNow ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{job.step}</span>
                <span className="tabular-nums text-muted">{job.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-panel-2">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${job.progress}%` }} />
              </div>
              <button type="button" className={BTN} disabled={pending} onClick={() => start(() => cancelRenderAction(code))}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={pending || !ready}
                className={`${BTN_PRIMARY} px-4! py-2!`}
                onClick={() =>
                  start(async () => {
                    setError("");
                    const r = await startRenderAction(code, { resolution, music, musicVolume: volume });
                    if (r.error) setError(r.error);
                  })
                }
              >
                {pending ? "Starting…" : lastDone ? "Render again" : "Render video"}
              </button>
              <span className="text-xs text-muted">
                {resolution === "720p" ? "Fast draft to check pacing." : "Full quality; takes longer."} Runs on this computer
                with ffmpeg.
              </span>
            </div>
          )}

          {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
          {job?.status === "error" && (
            <details className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700" open>
              <summary className="cursor-pointer font-medium">The last render failed</summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap">{job.log}</pre>
            </details>
          )}
          {job?.status === "canceled" && <p className="text-xs text-muted">The last render was canceled.</p>}
        </div>
      </Card>

      {lastDone && (
        <Card className="overflow-hidden">
          <video key={lastDone.output + lastDone.updatedAt} controls className="aspect-video w-full bg-black" src={fileUrl(lastDone.output, lastDone.updatedAt)} />
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="text-sm">
              <div className="font-medium">{lastDone.output.split("/").pop()}</div>
              <div className="text-xs text-muted">
                {lastDone.options.resolution} · {Math.floor(lastDone.seconds / 60)}:{String(Math.round(lastDone.seconds % 60)).padStart(2, "0")} ·
                rendered {new Date(lastDone.finishedAt ?? lastDone.updatedAt).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`${fileUrl(lastDone.output)}?download`} className={BTN_PRIMARY}>
                Download MP4
              </a>
              {lastDone.captions && (
                <a href={`${fileUrl(lastDone.captions)}?download`} className={BTN}>
                  Captions (.srt)
                </a>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
