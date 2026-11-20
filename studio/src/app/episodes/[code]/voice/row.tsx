"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { CopyButton } from "@/components/client";
import { IconMic } from "@/components/icons";
import { BTN, BTN_PRIMARY, Card, fileUrl } from "@/components/ui";
import { generateVoiceSection } from "@/lib/studio-actions";
import type { VoiceSection } from "@/lib/voice-sections";

export function VoiceRow({
  code,
  section,
  file,
  canGenerate,
}: {
  code: string;
  section: VoiceSection;
  file: { rel: string; version: string } | null;
  canGenerate: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(f: File) {
    setUploading(true);
    setError("");
    const body = new FormData();
    body.set("kind", "voice");
    body.set("code", code);
    body.set("name", section.name);
    body.set("file", f);
    const res = await fetch("/api/upload", { method: "POST", body });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error ?? "Upload failed");
    setUploading(false);
    router.refresh();
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start gap-4">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            file ? "bg-emerald-50 text-emerald-600" : "bg-panel-2 text-slate-400"
          }`}
        >
          <IconMic />
        </span>
        <div className="min-w-0 flex-1 basis-80">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{section.heading}</span>
            <span className="font-mono text-xs text-muted">{section.name}.mp3</span>
            <span className="text-xs text-muted">
              · {section.words} words · ~{Math.max(1, Math.round((section.words / 150) * 60))}s
            </span>
          </div>
          <details className="mt-1">
            <summary className="cursor-pointer text-xs text-muted hover:text-foreground">Narration text</summary>
            <p className="mt-2 whitespace-pre-line rounded-lg bg-panel-2/60 p-3 text-sm leading-relaxed text-slate-700">
              {section.text}
            </p>
          </details>
          {file && (
            <audio controls src={fileUrl(file.rel, file.version)} className="mt-3 h-9 w-full max-w-xl" />
          )}
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={section.text} label="Copy text" className="py-1.5! text-sm!" />
          <input
            ref={input}
            type="file"
            hidden
            accept="audio/mpeg,.mp3"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <button type="button" className={BTN} disabled={uploading} onClick={() => input.current?.click()}>
            {uploading ? "Uploading…" : "Upload mp3"}
          </button>
          {canGenerate && (
            <button
              type="button"
              disabled={pending}
              className={file ? BTN : BTN_PRIMARY}
              onClick={() =>
                start(async () => {
                  setError("");
                  const r = await generateVoiceSection(code, section.index);
                  if (r.error) setError(r.error);
                })
              }
            >
              {pending ? "Generating…" : file ? "Regenerate" : "Generate"}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
