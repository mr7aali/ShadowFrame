"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createEpisode } from "@/lib/actions";
import { BTN, BTN_PRIMARY, INPUT, fileUrl } from "@/components/ui";
import { STORY_SHAPES, type LibraryItemView } from "@/lib/library";

const field = `${INPUT} mt-1`;

export function NewEpisodeForm({
  stories,
  characters,
  locations,
}: {
  stories: LibraryItemView[];
  characters: LibraryItemView[];
  locations: LibraryItemView[];
}) {
  const [state, action, pending] = useActionState(createEpisode, undefined);
  const [storyId, setStoryId] = useState("");
  const [title, setTitle] = useState("");
  const [logline, setLogline] = useState("");
  const [shape, setShape] = useState("");

  function pickStory(id: string) {
    setStoryId(id);
    const s = stories.find((x) => x._id === id);
    if (!s) return;
    setTitle(s.name);
    setLogline(s.fields?.logline ?? "");
    setShape(s.fields?.storyShape ?? "");
  }

  return (
    <form action={action} className="space-y-6">
      <section className="space-y-4 rounded-xl border border-line bg-panel p-6 shadow-sm">
        <h2 className="font-semibold">Story</h2>
        {stories.length > 0 ? (
          <label className="block text-sm font-medium">
            Start from a library story <span className="font-normal text-muted">(optional)</span>
            <select name="story" value={storyId} onChange={(e) => pickStory(e.target.value)} className={field}>
              <option value="">— New idea (the Idea step will generate premises) —</option>
              {stories.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                  {s.fields?.storyShape ? ` · ${s.fields.storyShape}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm text-muted">
            Tip: save premises under{" "}
            <Link href="/library/stories" className="text-accent hover:underline">
              Library → Stories
            </Link>{" "}
            to pick one here.
          </p>
        )}
        <label className="block text-sm font-medium">
          Working title
          <input name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="The Last Train Out of Halvorsen" />
        </label>
        <label className="block text-sm font-medium">
          Logline <span className="font-normal text-muted">(optional)</span>
          <textarea name="logline" rows={2} value={logline} onChange={(e) => setLogline(e.target.value)} className={field} placeholder="One sentence: the crime, the hook, the twist pressure." />
        </label>
        <label className="block text-sm font-medium">
          Story shape
          <select name="storyShape" className={field} value={shape} onChange={(e) => setShape(e.target.value)}>
            <option value="">Choose later</option>
            {STORY_SHAPES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </section>

      <Picker
        name="cast"
        title="Cast"
        hint="Recurring characters from the library. Their descriptions go into every AI prompt, and their main image is used as the face reference."
        items={characters}
        emptyHref="/library/characters"
        emptyText="No library characters yet."
      />
      <Picker
        name="locations"
        title="Locations"
        hint="Recurring places from the library."
        items={locations}
        emptyHref="/library/locations"
        emptyText="No library locations yet."
      />

      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className={`${BTN_PRIMARY} px-4! py-2!`}>
          {pending ? "Creating…" : "Create episode & start step 1"}
        </button>
        <Link href="/" className={`${BTN} px-4! py-2!`}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function Picker({
  name,
  title,
  hint,
  items,
  emptyHref,
  emptyText,
  defaultSelected = [],
}: {
  name: string;
  title: string;
  hint: string;
  items: LibraryItemView[];
  emptyHref: string;
  emptyText: string;
  defaultSelected?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  return (
    <section className="rounded-xl border border-line bg-panel p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {items.length > 0 && <span className="text-xs text-muted">{selected.length} selected</span>}
      </div>
      <p className="mb-4 text-sm text-muted">{hint}</p>
      {items.length ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const on = selected.includes(it._id);
            return (
              <label
                key={it._id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition ${
                  on ? "border-accent bg-accent-soft" : "border-line hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  name={name}
                  value={it._id}
                  checked={on}
                  onChange={() => setSelected(on ? selected.filter((x) => x !== it._id) : [...selected, it._id])}
                  className="sr-only"
                />
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl(it.image)} alt="" className="h-11 w-11 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-panel-2 text-sm font-semibold text-slate-400">
                    {it.name[0]}
                  </span>
                )}
                <span className="min-w-0">
                  <span className={`block truncate text-sm font-medium ${on ? "text-accent" : ""}`}>{it.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {it.fields?.role || it.fields?.description || it.fields?.era || ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">
          {emptyText}{" "}
          <Link href={emptyHref} className="text-accent hover:underline">
            Create some →
          </Link>
        </p>
      )}
    </section>
  );
}
