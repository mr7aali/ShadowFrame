"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setAssetNotes,
  setAssetStatus,
  setStepNote,
  setStepStatus,
  type AssetKind,
} from "@/lib/actions";
import { generateAssetImage } from "@/lib/studio-actions";
import { BTN, STATUS_LABELS, STATUS_STYLES } from "./ui";

/* ---------- Copy ---------- */

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={`inline-flex items-center justify-center rounded-md border border-line bg-white px-2 py-1 text-xs font-medium shadow-sm transition hover:bg-panel-2 ${copied ? "text-emerald-600" : "text-slate-600 hover:text-foreground"} ${className}`}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

/* ---------- Status controls ---------- */

function Segmented<T extends string>({
  value,
  options,
  onChange,
  pending,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  pending: boolean;
}) {
  return (
    <div className={`inline-flex flex-wrap gap-1 ${pending ? "opacity-60" : ""}`}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          disabled={pending}
          onClick={() => o !== value && onChange(o)}
          className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset transition ${
            o === value
              ? STATUS_STYLES[o]
              : "text-muted ring-line hover:text-foreground hover:ring-slate-400"
          }`}
        >
          {STATUS_LABELS[o]}
        </button>
      ))}
    </div>
  );
}

const STEP_OPTIONS = ["todo", "in_progress", "done"] as const;
const ASSET_OPTIONS = ["todo", "generated", "approved", "rejected"] as const;

export function StepStatusControl({
  code,
  stepId,
  status,
}: {
  code: string;
  stepId: string;
  status: (typeof STEP_OPTIONS)[number];
}) {
  const [optimistic, setOptimistic] = useState(status);
  const [pending, start] = useTransition();
  return (
    <Segmented
      value={pending ? optimistic : status}
      options={STEP_OPTIONS}
      pending={pending}
      onChange={(v) => {
        setOptimistic(v);
        start(() => setStepStatus(code, stepId, v));
      }}
    />
  );
}

export function AssetStatusControl({
  kind,
  id,
  status,
}: {
  kind: AssetKind;
  id: string;
  status: (typeof ASSET_OPTIONS)[number];
}) {
  const [optimistic, setOptimistic] = useState(status);
  const [pending, start] = useTransition();
  return (
    <Segmented
      value={pending ? optimistic : status}
      options={ASSET_OPTIONS}
      pending={pending}
      onChange={(v) => {
        setOptimistic(v);
        start(() => setAssetStatus(kind, id, v));
      }}
    />
  );
}

/* ---------- Notes ---------- */

export function InlineNote({
  value,
  placeholder,
  onSave,
  multiline,
}: {
  value: string;
  placeholder: string;
  onSave: (v: string) => Promise<void>;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [pending, start] = useTransition();
  const save = () => {
    if (draft !== value) start(() => onSave(draft));
  };
  const cls = `w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm text-muted placeholder:text-slate-400 hover:border-line focus:border-line focus:bg-panel-2 focus:text-foreground focus:outline-none ${pending ? "opacity-60" : ""}`;
  return multiline ? (
    <textarea
      rows={2}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      className={`${cls} resize-y`}
    />
  ) : (
    <input
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={cls}
    />
  );
}

export function StepNote({ code, stepId, note }: { code: string; stepId: string; note: string }) {
  return (
    <InlineNote
      value={note}
      placeholder="Add a note / next action…"
      onSave={(v) => setStepNote(code, stepId, v)}
    />
  );
}

export function AssetNotes({ kind, id, notes }: { kind: AssetKind; id: string; notes: string }) {
  return (
    <InlineNote
      multiline
      value={notes}
      placeholder="Notes (what to fix, which take you kept…)"
      onSave={(v) => setAssetNotes(kind, id, v)}
    />
  );
}

/* ---------- Upload ---------- */

export function UploadButton({
  kind,
  id,
  field = "image",
  label,
}: {
  kind: AssetKind;
  id: string;
  field?: "image" | "video";
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const body = new FormData();
    body.set("kind", kind);
    body.set("id", id);
    body.set("field", field);
    body.set("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <input
        ref={input}
        type="file"
        hidden
        accept={field === "video" ? "video/mp4,video/webm,video/quicktime" : "image/png,image/jpeg,image/webp"}
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className={`${BTN} px-2.5! py-1! text-xs!`}
      >
        {busy ? "Uploading…" : (label ?? (field === "video" ? "Upload clip" : "Upload image"))}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}

/* ---------- Generic server-action button ---------- */

export function ActionButton({
  action,
  children,
  pendingText = "Working…",
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  pendingText?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError("");
            try {
              await action();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed");
            }
          })
        }
        className={BTN}
      >
        {pending ? pendingText : children}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}

/* ---------- Generate an image with the connected image AI ---------- */

export function GenerateImageButton({
  kind,
  id,
  again,
}: {
  kind: AssetKind;
  id: string;
  again?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError("");
            const r = await generateAssetImage(kind, id);
            if (r.error) setError(r.error);
          })
        }
        className={`${BTN} border-accent/30! px-2.5! py-1! text-xs! text-accent!`}
      >
        {pending ? "Generating…" : again ? "✦ Regenerate" : "✦ Generate image"}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}
