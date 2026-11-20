"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteAsset, enhanceImagePrompt, generateImageAsset, setItemImage } from "@/lib/library-actions";
import type { AssetView } from "@/lib/library";
import { CopyButton } from "./client";
import { IconImage, IconSparkles } from "./icons";
import { BTN, BTN_PRIMARY, Card, fileUrl, INPUT } from "./ui";

export type RefOption = { path: string; label: string };

type Ctx = { item?: string; episode?: string };

/**
 * Prompt → (optional) enhance with the text AI → generate with the image AI,
 * or upload an image made elsewhere. Every result is saved as an asset below.
 */
export function AssetWorkspace({
  ctx,
  assets,
  initialPrompt = "",
  kinds,
  defaultKind,
  refOptions = [],
  ai,
  mainImage,
  emptyText = "No images yet. Generate one or upload your own.",
}: {
  ctx: Ctx;
  assets: AssetView[];
  initialPrompt?: string;
  kinds?: string[];
  defaultKind: string;
  refOptions?: RefOption[];
  ai: { text: string | null; image: string | null };
  /** Library items: current main image path (enables "Set as main"). */
  mainImage?: string;
  emptyText?: string;
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  return (
    <div className="space-y-6">
      <ImageStudio
        ctx={ctx}
        prompt={prompt}
        setPrompt={setPrompt}
        kinds={kinds}
        defaultKind={defaultKind}
        refOptions={refOptions}
        ai={ai}
      />
      <AssetGrid
        assets={assets}
        itemId={ctx.item}
        mainImage={mainImage}
        onReuse={(p) => {
          setPrompt(p);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        emptyText={emptyText}
      />
    </div>
  );
}

function ImageStudio({
  ctx,
  prompt,
  setPrompt,
  kinds,
  defaultKind,
  refOptions,
  ai,
}: {
  ctx: Ctx;
  prompt: string;
  setPrompt: (p: string) => void;
  kinds?: string[];
  defaultKind: string;
  refOptions: RefOption[];
  ai: { text: string | null; image: string | null };
}) {
  const router = useRouter();
  const [kind, setKind] = useState(defaultKind);
  const [title, setTitle] = useState("");
  const [refs, setRefs] = useState<string[]>([]);
  const [before, setBefore] = useState<string | null>(null); // prompt before enhancing (for undo)
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"" | "enhance" | "generate" | "upload">("");
  const [, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const context = { ...ctx, kind, refs };

  function run(what: "enhance" | "generate", fn: () => Promise<void>) {
    setError("");
    setNote("");
    setBusy(what);
    start(async () => {
      try {
        await fn();
      } finally {
        setBusy("");
      }
    });
  }

  const enhance = () =>
    run("enhance", async () => {
      const r = await enhanceImagePrompt(prompt, context);
      if (r.error) return setError(r.error);
      setBefore(prompt);
      setPrompt(r.prompt!);
      setNote("Enhanced — edit it if you like, then generate or copy it.");
    });

  const generate = () =>
    run("generate", async () => {
      const r = await generateImageAsset(prompt, { ...context, title });
      if (r.error) return setError(r.error);
      setNote("Saved to assets ↓");
    });

  async function upload(file: File) {
    setError("");
    setNote("");
    setBusy("upload");
    const body = new FormData();
    body.set("file", file);
    body.set("kind", kind);
    body.set("title", title || file.name);
    body.set("prompt", prompt);
    if (ctx.item) body.set("item", ctx.item);
    if (ctx.episode) body.set("episode", ctx.episode);
    try {
      const res = await fetch("/api/assets/upload", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setNote("Uploaded to assets ↓");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy("");
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-linear-to-r from-accent-soft to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <IconImage className="text-accent" />
          <h3 className="font-semibold">Image studio</h3>
        </div>
        <div className="flex gap-1.5 text-[11px]">
          <span className={`rounded-full px-2 py-0.5 ring-1 ${ai.text ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-50 text-slate-500 ring-slate-200"}`}>
            Enhance: {ai.text ?? "not connected"}
          </span>
          <span className={`rounded-full px-2 py-0.5 ring-1 ${ai.image ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-50 text-slate-500 ring-slate-200"}`}>
            Images: {ai.image ?? "not connected"}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex flex-wrap gap-3">
          {kinds && kinds.length > 1 && (
            <label className="text-xs font-medium text-muted">
              Type
              <select value={kind} onChange={(e) => setKind(e.target.value)} className={`${INPUT} mt-1 w-40! capitalize`}>
                {kinds.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="min-w-48 flex-1 text-xs font-medium text-muted">
            Name <span className="font-normal">(optional)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Front portrait v2" className={`${INPUT} mt-1`} />
          </label>
        </div>

        <label className="block text-xs font-medium text-muted">
          <span className="flex items-center justify-between">
            Prompt
            {before !== null && (
              <button
                type="button"
                className="font-normal text-accent hover:underline"
                onClick={() => {
                  setPrompt(before);
                  setBefore(null);
                  setNote("");
                }}
              >
                Undo enhance
              </button>
            )}
          </span>
          <textarea
            rows={6}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image — even a few words. Enhance with AI turns it into a detailed prompt using this item's details."
            className={`${INPUT} mt-1 resize-y font-mono text-[13px] leading-relaxed`}
          />
        </label>

        {refOptions.length > 0 && (
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted">
              Reference images <span className="font-normal">— attached so faces and places stay the same</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {refOptions.map((r) => {
                const on = refs.includes(r.path);
                return (
                  <button
                    key={r.path}
                    type="button"
                    onClick={() => setRefs(on ? refs.filter((x) => x !== r.path) : [...refs, r.path])}
                    className={`flex items-center gap-2 rounded-lg border p-1 pr-2.5 text-xs transition ${
                      on ? "border-accent bg-accent-soft text-accent" : "border-line bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fileUrl(r.path)} alt="" className="h-8 w-8 rounded object-cover" />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {ai.text ? (
            <button type="button" disabled={!!busy || !prompt.trim()} onClick={enhance} className={BTN}>
              <IconSparkles width={16} height={16} className="text-accent" />
              {busy === "enhance" ? "Enhancing…" : "Enhance with AI"}
            </button>
          ) : (
            <Link href="/settings/ai" className={BTN} title="Connect Claude or another text AI to enhance prompts">
              <IconSparkles width={16} height={16} /> Connect AI to enhance
            </Link>
          )}
          {ai.image ? (
            <button type="button" disabled={!!busy || !prompt.trim()} onClick={generate} className={BTN_PRIMARY}>
              {busy === "generate" ? "Generating… (up to a minute)" : "Generate image"}
            </button>
          ) : (
            <Link href="/settings/ai" className={BTN}>
              Connect an image AI
            </Link>
          )}
          <input
            ref={fileInput}
            type="file"
            hidden
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <button type="button" disabled={!!busy} onClick={() => fileInput.current?.click()} className={BTN}>
            {busy === "upload" ? "Uploading…" : "Upload image"}
          </button>
          {prompt.trim() && <CopyButton text={prompt} label="Copy prompt" className="py-1.5! text-sm!" />}
        </div>

        {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
        {note && <p className="text-xs text-emerald-600">{note}</p>}
        {!ai.image && (
          <p className="text-xs text-muted">
            No image AI connected: copy the prompt into Midjourney, Ideogram, Leonardo or ChatGPT, then upload the result here.
          </p>
        )}
      </div>
    </Card>
  );
}

export function AssetGrid({
  assets,
  itemId,
  mainImage,
  onReuse,
  emptyText,
  owners,
}: {
  assets: AssetView[];
  itemId?: string;
  mainImage?: string;
  onReuse?: (prompt: string) => void;
  emptyText?: string;
  /** Where each asset belongs, by asset id (gallery page). */
  owners?: Record<string, { label: string; href: string }>;
}) {
  if (!assets.length) return <p className="text-sm text-muted">{emptyText}</p>;
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Assets · {assets.length}</div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {assets.map((a) => (
          <AssetCard key={a._id} asset={a} itemId={itemId} isMain={!!mainImage && mainImage === a.path} onReuse={onReuse} owner={owners?.[a._id] ?? null} />
        ))}
      </div>
    </div>
  );
}

function AssetCard({
  asset: a,
  itemId,
  isMain,
  onReuse,
  owner,
}: {
  asset: AssetView;
  itemId?: string;
  isMain: boolean;
  onReuse?: (prompt: string) => void;
  owner: { label: string; href: string } | null;
}) {
  const [pending, start] = useTransition();
  return (
    <Card className={`flex flex-col overflow-hidden ${pending ? "opacity-50" : ""} ${isMain ? "ring-2 ring-accent" : ""}`}>
      <a href={fileUrl(a.path)} target="_blank" rel="noreferrer" className="relative block aspect-video bg-panel-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fileUrl(a.path)} alt={a.title || a.kind} className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute left-2 top-2 flex gap-1">
          {isMain && <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-medium text-white">Main</span>}
          <span className="rounded bg-white/90 px-1.5 py-0.5 text-[11px] capitalize shadow-sm">{a.kind}</span>
          <span className="rounded bg-white/90 px-1.5 py-0.5 text-[11px] shadow-sm">{a.source === "uploaded" ? "Uploaded" : "AI"}</span>
        </span>
      </a>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{a.title || new Date(a.createdAt).toLocaleString()}</div>
          <div className="truncate text-xs text-muted">
            {owner ? (
              <Link href={owner.href} className="text-accent hover:underline">
                {owner.label}
              </Link>
            ) : null}
            {owner && " · "}
            {a.model || (a.source === "uploaded" ? "uploaded" : "")}
          </div>
        </div>
        {a.prompt && (
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted hover:text-foreground">Prompt</summary>
            <p className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-600">{a.prompt}</p>
          </details>
        )}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {itemId && !isMain && (
            <button type="button" className={`${BTN} px-2! py-1! text-xs!`} onClick={() => start(() => setItemImage(itemId, a.path))}>
              Set as main
            </button>
          )}
          {a.prompt && onReuse && (
            <button type="button" className={`${BTN} px-2! py-1! text-xs!`} onClick={() => onReuse(a.prompt)}>
              Reuse prompt
            </button>
          )}
          {a.prompt && <CopyButton text={a.prompt} label="Copy prompt" />}
          <button
            type="button"
            className={`${BTN} px-2! py-1! text-xs! text-rose-600!`}
            onClick={() => confirm("Delete this image?") && start(() => deleteAsset(a._id))}
          >
            Delete
          </button>
        </div>
      </div>
    </Card>
  );
}
