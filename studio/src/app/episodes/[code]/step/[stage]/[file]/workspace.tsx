"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "@/components/client";
import { IconArrowRight, IconCheck, IconSparkles } from "@/components/icons";
import { BTN, BTN_PRIMARY, Card, INPUT, StatusPill } from "@/components/ui";
import { completeStepFile, reopenStepFile, saveStepFile } from "@/lib/studio-actions";

const ERROR_MARK = "\u0000ERROR:";

type Props = {
  code: string;
  stageKey: string;
  slug: string;
  title: string;
  summary: string;
  task: string;
  status: "todo" | "in_progress" | "done";
  initialContent: string;
  prompt: { before: string; after: string };
  context: { path: string; chars: number; missing: boolean }[];
  templates: string[];
  ai: { provider: string; model: string } | null;
  media: { kind: string; label: string; href: string } | null;
  prevUrl: string | null;
  nextUrl: string | null;
};

export function StepWorkspace(p: Props) {
  const router = useRouter();
  const [content, setContent] = useState(p.initialContent);
  const [saved, setSaved] = useState(p.initialContent);
  const [tab, setTab] = useState<"write" | "preview">(p.initialContent.trim() ? "preview" : "write");
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const dirty = content !== saved;
  const done = p.status === "done";

  // Server content changed (e.g. another tab saved): follow it when we have no local edits.
  const [lastInitial, setLastInitial] = useState(p.initialContent);
  if (p.initialContent !== lastInitial) {
    setLastInitial(p.initialContent);
    if (!dirty) {
      setContent(p.initialContent);
      setSaved(p.initialContent);
    }
  }

  function flash(tone: "ok" | "error", text: string) {
    setMessage({ tone, text });
    setTimeout(() => setMessage(null), 3500);
  }

  function save() {
    start(async () => {
      try {
        await saveStepFile(p.code, p.stageKey, p.slug, content);
        setSaved(content);
        flash("ok", "Saved");
      } catch (e) {
        flash("error", e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function complete() {
    start(async () => {
      const res = await completeStepFile(p.code, p.stageKey, p.slug, content);
      if (res.error) return flash("error", res.error);
      setSaved(content);
      if (res.next) router.push(res.next);
    });
  }

  // Ctrl/Cmd+S saves
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      {/* ---------- Editor ---------- */}
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{p.title}</h2>
              <StatusPill status={p.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted">{p.summary}</p>
          </div>
          <div className="flex gap-2">
            {p.prevUrl && (
              <Link href={p.prevUrl} className={BTN}>
                ← Previous
              </Link>
            )}
            {done && p.nextUrl && (
              <Link href={p.nextUrl} className={BTN}>
                Next →
              </Link>
            )}
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel-2/50 px-3 py-2">
            <div className="flex gap-1 rounded-lg bg-panel-2 p-0.5">
              {(["write", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition ${
                    tab === t ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="tabular-nums">{wordCount(content).toLocaleString()} words</span>
              {dirty ? <span className="text-amber-600">● Unsaved</span> : content.trim() ? <span>Saved</span> : null}
              {content.trim() && <CopyButton text={content} label="Copy file" />}
            </div>
          </div>

          {tab === "write" ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck
              placeholder={`This file is empty.\n\nUse "Create with AI" to generate it, or write it yourself.\n\nWhat goes here: ${p.task}`}
              className="block min-h-[65vh] w-full resize-y border-0 bg-white p-4 font-mono text-[13px] leading-relaxed outline-none placeholder:font-sans placeholder:text-slate-400"
            />
          ) : (
            <div className="max-h-[75vh] min-h-[65vh] overflow-y-auto p-6">
              {content.trim() ? (
                <article className="prose prose-sm max-w-none prose-headings:tracking-tight prose-pre:border prose-pre:border-line prose-pre:bg-panel-2 prose-pre:text-slate-800 prose-code:before:content-none prose-code:after:content-none prose-th:text-left">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </article>
              ) : (
                <EmptyState onWrite={() => setTab("write")} hasAi={!!p.ai} />
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2.5">
            <span className={`text-xs ${message?.tone === "error" ? "text-rose-600" : "text-emerald-600"}`}>
              {message?.text ?? (done ? "Complete — editing it again is fine; save to keep changes." : "")}
            </span>
            <div className="flex flex-wrap gap-2">
              {done && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(() => reopenStepFile(p.code, p.stageKey, p.slug))}
                  className={BTN}
                  title="Mark as in progress again (locks the files after it)"
                >
                  Reopen
                </button>
              )}
              <button type="button" disabled={pending || !dirty} onClick={save} className={BTN}>
                {pending ? "Saving…" : "Save"}
              </button>
              {!done && (
                <button type="button" disabled={pending || !content.trim()} onClick={complete} className={BTN_PRIMARY}>
                  <IconCheck width={16} height={16} /> Mark complete & continue
                </button>
              )}
            </div>
          </div>
        </Card>

        {p.media && (
          <Card className="flex flex-wrap items-center justify-between gap-3 border-sky-200 bg-sky-50/60 p-4">
            <div className="text-sm">
              <div className="font-medium text-sky-900">After this file: {p.media.label.toLowerCase()}</div>
              <div className="text-sky-800/80">
                Once complete, the prompts appear on the {p.media.href === "cast" ? "Cast & locations" : p.media.href === "voice" ? "Voice" : "Shot board"} tab,
                with a Generate button when an AI is connected.
              </div>
            </div>
            <Link href={`/episodes/${p.code}/${p.media.href}`} className={BTN}>
              Open {p.media.href === "cast" ? "Cast & locations" : p.media.href === "voice" ? "Voice" : "Shot board"}{" "}
              <IconArrowRight width={16} height={16} />
            </Link>
          </Card>
        )}
      </div>

      {/* ---------- AI panel ---------- */}
      <AiPanel
        {...p}
        hasContent={!!content.trim()}
        onUse={(text, mode) => {
          setContent((c) => (mode === "append" && c.trim() ? `${c.trimEnd()}\n\n${text}` : text));
          setTab("preview");
          flash("ok", "Inserted — review it, then Save or Mark complete.");
        }}
      />
    </div>
  );
}

function EmptyState({ onWrite, hasAi }: { onWrite: () => void; hasAi: boolean }) {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
          <IconSparkles width={22} height={22} />
        </span>
        <p className="mt-3 font-medium">This file is empty</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          {hasAi
            ? "Click Generate in the AI panel, or copy the prompt into any AI chat."
            : "Copy the ready-made prompt from the AI panel into Claude or ChatGPT, then paste the answer here."}
        </p>
        <button type="button" onClick={onWrite} className={`${BTN} mt-4`}>
          Write it myself
        </button>
      </div>
    </div>
  );
}

function AiPanel({
  code,
  stageKey,
  slug,
  prompt,
  context,
  templates,
  ai,
  hasContent,
  onUse,
}: Props & { hasContent: boolean; onUse: (text: string, mode: "replace" | "append") => void }) {
  const [extra, setExtra] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const outRef = useRef<HTMLPreElement>(null);

  const fullPrompt = extra.trim()
    ? `${prompt.before}\n\n# Extra instructions from the creator\n${extra.trim()}${prompt.after}`
    : `${prompt.before}${prompt.after}`;
  const missing = context.filter((c) => c.missing);

  async function generate() {
    setOutput("");
    setError("");
    setRunning(true);
    const ctrl = new AbortController();
    abort.current = ctrl;
    let text = "";
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, stage: stageKey, slug, extra }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        text += value;
        const at = text.indexOf(ERROR_MARK);
        if (at >= 0) {
          setOutput(text.slice(0, at));
          throw new Error(text.slice(at + ERROR_MARK.length));
        }
        setOutput(text);
        const el = outRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }
      text = stripFence(text);
      setOutput(text);
      if (!hasContent && text.trim()) onUse(text, "replace");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setRunning(false);
      abort.current = null;
    }
  }

  return (
    <Card className="h-fit overflow-hidden xl:sticky xl:top-6">
      <div className="flex items-center gap-2 border-b border-line bg-linear-to-r from-accent-soft to-white px-4 py-3">
        <IconSparkles className="text-accent" />
        <h3 className="font-semibold">Create with AI</h3>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">Uses</div>
          <div className="flex flex-wrap gap-1.5">
            {templates.map((t) => (
              <span key={t} className="rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[11px] text-violet-700 ring-1 ring-violet-200" title="Prompt template">
                {t.replace(/^prompts\//, "")}
              </span>
            ))}
            {context.map((c) => (
              <span
                key={c.path}
                title={c.missing ? "Empty — the AI won't have it" : `${c.chars.toLocaleString()} characters`}
                className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ring-1 ${
                  c.missing ? "bg-amber-50 text-amber-700 ring-amber-200 line-through" : "bg-panel-2 text-slate-600 ring-line"
                }`}
              >
                {c.path.split("/").slice(-1)[0]}
              </span>
            ))}
            {!templates.length && !context.length && <span className="text-xs text-muted">Episode details only</span>}
          </div>
          {missing.length > 0 && (
            <p className="mt-1.5 text-xs text-amber-700">
              {missing.length} context file{missing.length > 1 ? "s are" : " is"} empty — results will be weaker.
            </p>
          )}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
            Extra instructions <span className="normal-case tracking-normal">(optional)</span>
          </span>
          <textarea
            rows={3}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="e.g. Set it in 1980s Louisiana. Make the twist about the sister."
            className={`${INPUT} resize-y`}
          />
        </label>

        <div className="space-y-2">
          {ai ? (
            running ? (
              <button type="button" onClick={() => abort.current?.abort()} className={`${BTN} w-full`}>
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> Generating… Stop
              </button>
            ) : (
              <button type="button" onClick={generate} className={`${BTN_PRIMARY} w-full py-2!`}>
                <IconSparkles width={16} height={16} /> {output ? "Regenerate" : "Generate"} with {ai.provider}
              </button>
            )
          ) : (
            <Link href="/settings/ai" className={`${BTN} w-full`}>
              Connect an AI to generate here
            </Link>
          )}
          {ai && <p className="text-center font-mono text-[11px] text-muted">{ai.model}</p>}
          <CopyButton text={fullPrompt} label="Copy prompt for any AI chat" className="w-full! py-2! text-sm!" />
        </div>

        <details className="group rounded-lg border border-line">
          <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-muted hover:text-foreground">
            <span className="inline-block transition group-open:rotate-90">▸</span> View the full prompt (
            {fullPrompt.length.toLocaleString()} chars)
          </summary>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap border-t border-line bg-panel-2/50 p-3 font-mono text-[11px] leading-relaxed text-slate-700">
            {fullPrompt}
          </pre>
        </details>

        {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}

        {(output || running) && (
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wider text-muted">
              Result {running && <span className="normal-case tracking-normal text-accent">· streaming</span>}
            </div>
            <pre
              ref={outRef}
              className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-panel-2/50 p-3 font-mono text-[11px] leading-relaxed text-slate-700"
            >
              {output || "…"}
            </pre>
            {!running && output && (
              <div className="flex gap-2">
                <button type="button" onClick={() => onUse(output, "replace")} className={`${BTN_PRIMARY} flex-1`}>
                  Use this
                </button>
                {hasContent && (
                  <button type="button" onClick={() => onUse(output, "append")} className={`${BTN} flex-1`}>
                    Append
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {!ai && (
          <ol className="list-decimal space-y-1 border-t border-line pt-3 pl-4 text-xs text-muted">
            <li>Copy the prompt and paste it into Claude, ChatGPT or Gemini.</li>
            <li>Paste the answer into the editor and Save.</li>
            <li>Review it, then Mark complete to unlock the next file.</li>
          </ol>
        )}
      </div>
    </Card>
  );
}

function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

/** Models sometimes wrap the whole file in ```markdown … ``` — unwrap it. */
function stripFence(s: string) {
  const m = s.trim().match(/^```(?:markdown|md)?\s*\n([\s\S]*)\n```$/);
  return m ? m[1] : s.trim();
}
