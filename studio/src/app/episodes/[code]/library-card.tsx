"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { BTN, BTN_PRIMARY, Card, INPUT, fileUrl } from "@/components/ui";
import { libraryType, type LibraryItemView } from "@/lib/library";
import { setEpisodeLibrary } from "@/lib/library-actions";

/** The story, cast and locations this episode uses from the series library. */
export function LibraryCard({
  code,
  library,
  story,
  cast,
  locations,
}: {
  code: string;
  library: LibraryItemView[];
  story: string;
  cast: string[];
  locations: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [s, setS] = useState(story);
  const [c, setC] = useState(cast);
  const [l, setL] = useState(locations);
  const [pending, start] = useTransition();

  const byId = new Map(library.map((i) => [i._id, i]));
  const chosen = [story, ...cast, ...locations].map((id) => byId.get(id)).filter((x): x is LibraryItemView => !!x);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <Card className="p-4 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">From the library</span>
        {!editing && (
          <button type="button" className="text-xs text-accent hover:underline" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        chosen.length ? (
          <ul className="space-y-2">
            {chosen.map((it) => (
              <li key={it._id}>
                <Link href={`/library/${libraryType(it.type)!.slug}/${it._id}`} className="flex items-center gap-2 hover:text-accent">
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileUrl(it.image)} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded bg-panel-2 text-xs text-slate-400">{it.name[0]}</span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{it.name}</span>
                    <span className="block text-[11px] text-muted">{libraryType(it.type)!.singular}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">
            No library story, cast or locations picked. Picks go into every AI prompt for this episode.
          </p>
        )
      ) : (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted">
            Story
            <select value={s} onChange={(e) => setS(e.target.value)} className={`${INPUT} mt-1`}>
              <option value="">—</option>
              {library
                .filter((i) => i.type === "story")
                .map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name}
                  </option>
                ))}
            </select>
          </label>
          {(["character", "location"] as const).map((t) => {
            const items = library.filter((i) => i.type === t);
            const [list, set] = t === "character" ? [c, setC] : [l, setL];
            return (
              <div key={t}>
                <div className="mb-1 text-xs font-medium text-muted">{t === "character" ? "Cast" : "Locations"}</div>
                {items.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((i) => (
                      <button
                        key={i._id}
                        type="button"
                        onClick={() => toggle(list, set, i._id)}
                        className={`rounded-full px-2.5 py-1 text-xs ring-1 ${
                          list.includes(i._id) ? "bg-accent-soft text-accent ring-accent/40" : "text-slate-600 ring-line"
                        }`}
                      >
                        {i.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Link href={`/library/${t === "character" ? "characters" : "locations"}`} className="text-xs text-accent hover:underline">
                    Create some →
                  </Link>
                )}
              </div>
            );
          })}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={pending}
              className={BTN_PRIMARY}
              onClick={() =>
                start(async () => {
                  await setEpisodeLibrary(code, s, c, l);
                  setEditing(false);
                })
              }
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" className={BTN} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
