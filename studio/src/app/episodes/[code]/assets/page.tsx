import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AssetWorkspace, type RefOption } from "@/components/image-studio";
import { Skeleton } from "@/components/ui";
import { getAiNames, getAssets, getLibraryItems } from "@/lib/library-server";
import { REPO_ROOT } from "@/lib/paths";
import { getCharacters, getEpisode, getLocations } from "@/lib/queries";
import { EpisodeHeader } from "../header";

export const metadata = { title: "Assets" };

export default function AssetsPage({ params }: PageProps<"/episodes/[code]/assets">) {
  return (
    <Suspense fallback={<Skeleton rows={6} />}>
      <Assets params={params} />
    </Suspense>
  );
}

async function exists(rel: string) {
  try {
    await fs.access(path.join(REPO_ROOT, rel));
    return true;
  } catch {
    return false;
  }
}

async function Assets({ params }: { params: PageProps<"/episodes/[code]/assets">["params"] }) {
  const { code } = await params;
  const ep = await getEpisode(code);
  if (!ep) notFound();
  const [assets, ai, characters, locations, library] = await Promise.all([
    getAssets({ episode: code }),
    getAiNames(),
    getCharacters(code),
    getLocations(code),
    getLibraryItems([...(ep.libraryCast ?? []), ...(ep.libraryLocations ?? [])]),
  ]);

  // Reference images: this episode's locked faces and locations, then library main images.
  const refs: RefOption[] = [];
  for (const c of characters) if (c.image) refs.push({ path: c.image, label: c.name.split(" ")[0] });
  for (const l of locations) if (l.image) refs.push({ path: l.image, label: `${l.code} ${l.name}` });
  for (const it of library)
    if (it.image && !refs.some((r) => r.label.toLowerCase().startsWith(it.slug)))
      refs.push({ path: it.image, label: `${it.name} (library)` });
  const usable = (await Promise.all(refs.map(async (r) => ((await exists(r.path)) ? r : null)))).filter(
    (r): r is RefOption => r !== null,
  );

  return (
    <>
      <EpisodeHeader episode={ep} active="assets" />
      <p className="mb-6 max-w-3xl text-sm text-muted">
        Extra images for this episode (thumbnails, inserts, alternates, B-roll), saved to{" "}
        <code>{ep.folder}/assets/gallery/</code>. Pick reference images to keep faces and places consistent.
      </p>
      <AssetWorkspace
        ctx={{ episode: code }}
        assets={assets}
        kinds={["shot", "thumbnail", "insert", "character", "location", "other"]}
        defaultKind="shot"
        refOptions={usable}
        ai={ai}
        emptyText="No episode images yet."
      />
    </>
  );
}
