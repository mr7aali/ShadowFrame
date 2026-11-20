"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { BTN, BTN_PRIMARY, fileUrl } from "@/components/ui";
import { removeMusicBed } from "@/lib/studio-actions";

export function MusicUpload({ code, current, version }: { code: string; current: string; version: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const body = new FormData();
    body.set("kind", "music");
    body.set("code", code);
    body.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error ?? "Upload failed");
    setBusy(false);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-3">
      {current && <audio controls src={fileUrl(current, version)} className="h-9 w-full" />}
      <input ref={input} type="file" hidden accept=".mp3,.wav,.m4a,audio/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className={current ? BTN : BTN_PRIMARY}>
          {busy ? "Uploading…" : current ? "Replace track" : "Upload music track"}
        </button>
        {current && (
          <button
            type="button"
            disabled={pending}
            className={`${BTN} text-rose-600!`}
            onClick={() => confirm("Remove the music bed?") && start(() => removeMusicBed(code))}
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {!current && <p className="text-xs text-muted">No music yet. The render works without it (voice only).</p>}
    </div>
  );
}
