"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { IconSparkles } from "@/components/icons";
import { BTN, BTN_PRIMARY, Card, INPUT } from "@/components/ui";
import { libraryType, type LibraryItemView, type LibraryType } from "@/lib/library";
import { aiFillLibraryItem, createLibraryItem, deleteLibraryItem, updateLibraryItem } from "@/lib/library-actions";

export function NewItemForm({ type }: { type: LibraryType }) {
  const info = libraryType(type)!;
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        start(async () => {
          try {
            router.push(await createLibraryItem(type, name));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create");
          }
        });
      }}
    >
      <label className="min-w-64 flex-1 text-xs font-medium text-muted">
        New {info.singular.toLowerCase()}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={info.namePlaceholder} className={`${INPUT} mt-1`} />
      </label>
      <button disabled={pending || !name.trim()} className={BTN_PRIMARY}>
        {pending ? "Creating…" : `+ Create ${info.singular.toLowerCase()}`}
      </button>
      {error && <p className="w-full text-xs text-rose-600">{error}</p>}
    </form>
  );
}

export function ItemForm({ item, aiConnected }: { item: LibraryItemView; aiConnected: string | null }) {
  const info = libraryType(item.type)!;
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [fields, setFields] = useState<Record<string, string>>(item.fields ?? {});
  const [brief, setBrief] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [filling, setFilling] = useState(false);

  const dirty = name !== item.name || JSON.stringify(fields) !== JSON.stringify(item.fields ?? {});

  function flash(ok: boolean, text: string) {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function fill() {
    setFilling(true);
    setMsg(null);
    const r = await aiFillLibraryItem(item.type, name, brief, fields);
    setFilling(false);
    if (r.error) return flash(false, r.error);
    setFields({ ...fields, ...r.fields });
    if (r.name && !name.trim()) setName(r.name);
    flash(true, "Filled in — review, edit, then Save.");
  }

  return (
    <Card className="overflow-hidden">
      <div className="space-y-3 border-b border-line bg-panel-2/40 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <IconSparkles width={16} height={16} className="text-accent" /> Fill with AI
        </div>
        <textarea
          rows={2}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder={
            item.type === "character"
              ? "e.g. Retired coroner, 60s, kind but hiding something; always wears a bow tie"
              : item.type === "story"
                ? "e.g. A lighthouse keeper vanishes; 1970s Maine; the twist involves the tide tables"
                : "e.g. Abandoned roadside motel, neon sign half broken, 1980s desert"
          }
          className={`${INPUT} resize-y`}
        />
        {aiConnected ? (
          <button type="button" disabled={filling} onClick={fill} className={`${BTN} w-full`}>
            {filling ? "Writing…" : `Fill fields with ${aiConnected}`}
          </button>
        ) : (
          <p className="text-xs text-muted">Connect a text AI on the AI connections page to fill these from a short brief.</p>
        )}
      </div>

      <div className="space-y-3 p-4">
        <label className="block text-xs font-medium text-muted">
          {info.nameLabel}
          <input value={name} onChange={(e) => setName(e.target.value)} className={`${INPUT} mt-1 text-base! font-medium text-foreground`} />
        </label>
        {info.fields.map((f) => (
          <label key={f.key} className="block text-xs font-medium text-muted">
            {f.label}
            {f.options ? (
              <select
                value={fields[f.key] ?? ""}
                onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                className={`${INPUT} mt-1`}
              >
                <option value="">—</option>
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : f.long ? (
              <textarea
                rows={3}
                value={fields[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                className={`${INPUT} mt-1 resize-y font-normal text-foreground`}
              />
            ) : (
              <input
                value={fields[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                className={`${INPUT} mt-1 font-normal text-foreground`}
              />
            )}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
        <button
          type="button"
          className={`${BTN} text-rose-600!`}
          onClick={() =>
            confirm(`Delete ${item.name} and all its images?`) &&
            start(async () => {
              router.push(await deleteLibraryItem(item._id));
            })
          }
        >
          Delete
        </button>
        <div className="flex items-center gap-3">
          {msg ? (
            <span className={`text-xs ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</span>
          ) : dirty ? (
            <span className="text-xs text-amber-600">● Unsaved</span>
          ) : null}
          <button
            type="button"
            disabled={pending || !dirty}
            className={BTN_PRIMARY}
            onClick={() =>
              start(async () => {
                try {
                  await updateLibraryItem(item._id, name, fields);
                  flash(true, "Saved");
                } catch (e) {
                  flash(false, e instanceof Error ? e.message : "Save failed");
                }
              })
            }
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Card>
  );
}
