"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { CopyButton, InlineNote } from "@/components/client";
import { Card } from "@/components/ui";
import { deletePromptRun, savePromptRun, updatePromptRunOutput } from "@/lib/actions";
import { fillPlaceholders } from "@/lib/markdown";
import type { PromptBlock } from "@/lib/prompts";
import type { PromptRunView } from "@/lib/queries";

const input =
  "w-full rounded-md border border-line bg-panel-2 px-3 py-2 text-sm focus:border-accent focus:outline-none";

export function PromptFiller({
  template,
  block,
  episodes,
}: {
  template: string;
  block: PromptBlock;
  episodes: { code: string; title: string }[];
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [episode, setEpisode] = useState("");
  const [title, setTitle] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const filled = useMemo(() => fillPlaceholders(block.text, values), [block.text, values]);
  const remaining = block.placeholders.filter((p) => !values[p.key]?.trim()).length;

  // Preview with unfilled placeholders highlighted.
  const preview = useMemo(() => {
    const keys = new Set(block.placeholders.filter((p) => !values[p.key]?.trim()).map((p) => `[${p.key}]`));
    if (!keys.size) return [filled];
    const escaped = [...keys].map((k) => k.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"));
    return filled.split(new RegExp(`(${escaped.join("|")})`, "g"));
  }, [filled, block.placeholders, values]);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="font-medium">{block.label || `Prompt ${block.index + 1}`}</h2>
        <span className={`text-xs ${remaining ? "text-amber-600" : "text-emerald-600"}`}>
          {block.placeholders.length
            ? remaining
              ? `${remaining} field${remaining === 1 ? "" : "s"} left`
              : "All fields filled ✓"
            : "No fields — copy as is"}
        </span>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        {block.placeholders.length > 0 && (
          <div className="space-y-4 border-b border-line p-4 lg:border-b-0 lg:border-r">
            {block.placeholders.map((p) => {
              const id = `${block.index}-${p.key}`;
              return (
                <label key={p.key} className="block text-xs">
                  <span className="font-mono text-muted">[{p.key}]</span>
                  {p.multiline ? (
                    <textarea
                      rows={5}
                      className={`${input} mt-1 resize-y font-mono text-xs`}
                      value={values[p.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [p.key]: e.target.value })}
                    />
                  ) : (
                    <>
                      <input
                        list={p.options.length ? id : undefined}
                        className={`${input} mt-1`}
                        value={values[p.key] ?? ""}
                        onChange={(e) => setValues({ ...values, [p.key]: e.target.value })}
                      />
                      {p.options.length > 0 && (
                        <datalist id={id}>
                          {p.options.map((o) => (
                            <option key={o} value={o} />
                          ))}
                        </datalist>
                      )}
                    </>
                  )}
                </label>
              );
            })}
            <button
              type="button"
              onClick={() => setValues({})}
              className="text-xs text-muted hover:text-foreground"
            >
              Clear fields
            </button>
          </div>
        )}

        <div className={`flex flex-col p-4 ${block.placeholders.length ? "" : "lg:col-span-2"}`}>
          <pre className="max-h-128 flex-1 overflow-auto whitespace-pre-wrap rounded border border-line bg-background p-3 font-mono text-xs leading-relaxed text-slate-700">
            {preview.map((part, i) =>
              i % 2 === 1 ? (
                <mark key={i} className="rounded bg-amber-100 px-0.5 text-amber-800">
                  {part}
                </mark>
              ) : (
                <Fragment key={i}>{part}</Fragment>
              ),
            )}
          </pre>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CopyButton text={filled} label="Copy prompt" className="px-3! py-1.5! text-sm!" />
            <select value={episode} onChange={(e) => setEpisode(e.target.value)} className={`${input} w-auto! py-1.5!`}>
              <option value="">No episode</option>
              {episodes.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.code}
                </option>
              ))}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name (optional)"
              className={`${input} w-40! py-1.5!`}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await savePromptRun({ template, blockIndex: block.index, episode, title, values, filled });
                  setSaved(true);
                  setTimeout(() => setSaved(false), 1500);
                })
              }
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
            >
              {pending ? "Saving…" : saved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SavedRuns({ runs }: { runs: PromptRunView[] }) {
  if (!runs.length)
    return (
      <p className="text-sm text-muted">
        Save a filled prompt to keep it here, then paste the AI&apos;s answer under it so the
        episode has a record of what was generated.
      </p>
    );
  return (
    <div className="space-y-3">
      {runs.map((r) => (
        <SavedRun key={r._id} run={r} />
      ))}
    </div>
  );
}

function SavedRun({ run }: { run: PromptRunView }) {
  const [pending, start] = useTransition();
  return (
    <Card className={`p-3 ${pending ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{run.title || `Block ${run.blockIndex + 1}`}</div>
          <div className="text-xs text-muted">
            {run.episode && <span className="mr-2 font-mono text-accent">{run.episode}</span>}
            {new Date(run.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <CopyButton text={run.filled} />
          <button
            type="button"
            onClick={() => confirm("Delete this saved prompt?") && start(() => deletePromptRun(run._id))}
            className="rounded border border-line px-2 py-1 text-xs text-muted hover:text-rose-600"
          >
            Delete
          </button>
        </div>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-muted">Prompt</summary>
        <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap font-mono text-xs text-slate-700">{run.filled}</pre>
      </details>
      <div className="mt-2">
        <InlineNote
          multiline
          value={run.output}
          placeholder="Paste the AI's answer here…"
          onSave={(v) => updatePromptRunOutput(run._id, v)}
        />
      </div>
    </Card>
  );
}
