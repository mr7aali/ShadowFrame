import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AssetWorkspace } from "@/components/image-studio";
import { Card, Skeleton } from "@/components/ui";
import { libraryType } from "@/lib/library";
import { getAiNames, getAssets, getEpisodesUsing, getLibraryItem } from "@/lib/library-server";
import { ItemForm } from "../forms";

export const metadata = { title: "Library" };

export default function ItemPage({ params }: PageProps<"/library/[type]/[id]">) {
  return (
    <Suspense fallback={<Skeleton rows={6} />}>
      <Item params={params} />
    </Suspense>
  );
}

async function Item({ params }: { params: PageProps<"/library/[type]/[id]">["params"] }) {
  const { type, id } = await params;
  const info = libraryType(type);
  const item = await getLibraryItem(id);
  if (!info || !item || item.type !== info.type) notFound();
  const [assets, ai, usedIn] = await Promise.all([getAssets({ item: id }), getAiNames(), getEpisodesUsing(id)]);

  // A character's main image is a natural reference for new variants of the same face.
  const refOptions = item.image ? [{ path: item.image, label: `${item.name} (main)` }] : [];

  return (
    <>
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-muted">
        <span>Library</span>
        <span>/</span>
        <Link href={`/library/${info.slug}`} className="hover:text-foreground">
          {info.plural}
        </Link>
      </nav>
      <div className="mb-6 flex flex-wrap items-baseline gap-3">
        <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">{info.singular}</span>
        <h1 className="text-2xl font-semibold tracking-tight">{item.name}</h1>
        {info.type === "character" && (
          <span className="font-mono text-xs text-muted" title="Shot prompts reference this face as">
            ref: {item.slug}_front
          </span>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <div className="space-y-4">
          <ItemForm item={item} aiConnected={ai.text} />
          <Card className="p-4 text-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Used in episodes</div>
            {usedIn.length ? (
              <ul className="space-y-1">
                {usedIn.map((e) => (
                  <li key={e.code}>
                    <Link href={`/episodes/${e.code}`} className="text-accent hover:underline">
                      <span className="font-mono text-xs">{e.code}</span> {e.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">Not used yet. Pick it when you create an episode, or from an episode&apos;s Pipeline page.</p>
            )}
          </Card>
        </div>

        <AssetWorkspace
          key={item.name + JSON.stringify(item.fields)}
          ctx={{ item: item._id }}
          assets={assets}
          initialPrompt={info.imagePrompt(item.name, item.fields ?? {})}
          kinds={info.type === "character" ? ["character", "expression", "full-body", "other"] : undefined}
          defaultKind={info.type}
          refOptions={refOptions}
          ai={ai}
          mainImage={item.image}
          emptyText={`No images yet. ${info.type === "character" ? "Make a portrait first — it becomes the locked face for every episode." : "Generate one or upload your own."}`}
        />
      </div>
    </>
  );
}
