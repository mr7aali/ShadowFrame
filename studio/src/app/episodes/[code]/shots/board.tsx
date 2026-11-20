"use client";

import { useMemo, useState } from "react";
import { AssetNotes, AssetStatusControl, CopyButton, GenerateImageButton, UploadButton } from "@/components/client";
import { fileUrl, STATUS_LABELS } from "@/components/ui";
import type { ShotView } from "@/lib/queries";

type Shot = ShotView & { updatedAt?: string };

const STATUSES = ["all", "todo", "generated", "approved", "rejected"] as const;

export function ShotBoard({ shots, canGenerate, motion = false }: { shots: Shot[]; canGenerate: boolean; motion?: boolean }) {
  const sections = useMemo(() => [...new Set(shots.map((s) => s.section).filter(Boolean))], [shots]);
  const [section, setSection] = useState("all");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [animatedOnly, setAnimatedOnly] = useState(false);
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: shots.length };
    for (const s of shots) c[s.status] = (c[s.status] ?? 0) + 1;
    return c;
  }, [shots]);

  const q = query.trim().toLowerCase();
  const visible = shots.filter(
    (s) =>
      (section === "all" || s.section === section) &&
      (status === "all" || s.status === status) &&
      (!animatedOnly || s.animated) &&
      (!q ||
        [s.narration, s.characters, s.imagePrompt, s.refs.join(" "), String(s.number)]
          .join(" ")
          .toLowerCase()
          .includes(q)),
  );

  const select =
    "rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-accent focus:outline-none";

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs ring-1 ring-inset transition ${
                status === s ? "bg-accent text-white ring-accent" : "bg-white text-muted ring-line hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]} · {counts[s] ?? 0}
            </button>
          ))}
        </div>
        <select value={section} onChange={(e) => setSection(e.target.value)} className={select}>
          <option value="all">All sections</option>
          {sections.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-muted">
          <input type="checkbox" checked={animatedOnly} onChange={(e) => setAnimatedOnly(e.target.checked)} />
          🎬 animated only
        </label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search narration, refs, prompt…"
          className={`${select} ml-auto w-64`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((s) => (
          <ShotCard key={s._id} shot={s} canGenerate={canGenerate && !motion} motion={motion} />
        ))}
      </div>
      {!visible.length && <p className="text-sm text-muted">No shots match these filters.</p>}
    </>
  );
}

function ShotCard({ shot: s, canGenerate, motion }: { shot: Shot; canGenerate: boolean; motion: boolean }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-panel shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="relative aspect-video bg-panel-2">
        {s.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(s.image, s.updatedAt)} alt={`Shot ${s.number}`} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-4xl font-semibold text-slate-300">
            {String(s.number).padStart(2, "0")}
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          <span className="rounded bg-white/90 shadow-sm px-1.5 py-0.5 font-mono text-xs">#{String(s.number).padStart(2, "0")}</span>
          {s.animated && <span className="rounded bg-white/90 shadow-sm px-1.5 py-0.5 text-xs">🎬</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          <span>{s.section}</span>
          {s.location && <span>📍 {s.location}</span>}
          {s.motion && <span>↔ {s.motion}</span>}
          {s.characters && <span>👤 {s.characters}</span>}
        </div>
        {s.narration && <p className="text-sm italic text-slate-700">{s.narration}</p>}
        {s.overlay && (
          <p className="whitespace-pre-line rounded border border-accent/30 bg-accent/5 px-2 py-1 text-xs text-accent">
            <span className="font-semibold">Text overlay (add in editor):</span> {s.overlay}
          </p>
        )}

        {s.refs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted">Attach:</span>
            {s.refs.map((r) => (
              <span key={r} className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-xs">
                {r}
              </span>
            ))}
          </div>
        )}

        {!motion && <PromptBox label="Image prompt" text={s.imagePrompt} />}
        {s.videoPrompt && <PromptBox label="Video prompt (5s, image-to-video)" text={s.videoPrompt} />}

        {s.video && (
          <video src={fileUrl(s.video, s.updatedAt)} controls muted className="w-full rounded" />
        )}

        <div className="mt-auto space-y-2 border-t border-line pt-3">
          <AssetStatusControl kind="shot" id={s._id} status={s.status} />
          <div className="flex flex-wrap gap-2">
            {canGenerate && s.imagePrompt && <GenerateImageButton kind="shot" id={s._id} again={!!s.image} />}
            <UploadButton kind="shot" id={s._id} label={s.image ? "Replace image" : "Upload image"} />
            {s.animated && (
              <UploadButton kind="shot" id={s._id} field="video" label={s.video ? "Replace clip" : "Upload clip"} />
            )}
          </div>
          <AssetNotes kind="shot" id={s._id} notes={s.notes} />
        </div>
      </div>
    </article>
  );
}

function PromptBox({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <details className="group rounded border border-line bg-panel-2/50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-1.5 text-xs text-muted">
        <span>
          <span className="inline-block transition group-open:rotate-90">▸</span> {label}
        </span>
        <CopyButton text={text} />
      </summary>
      <p className="whitespace-pre-wrap px-2.5 pb-2.5 font-mono text-xs leading-relaxed text-slate-700">{text}</p>
    </details>
  );
}
