import { Suspense } from "react";
import { AssetGrid, AssetWorkspace } from "@/components/image-studio";
import { PageTitle, Skeleton } from "@/components/ui";
import { libraryType } from "@/lib/library";
import { getAiNames, getAssets, getLibrary } from "@/lib/library-server";
import { getEpisodeCodes } from "@/lib/queries";

export const metadata = { title: "Asset gallery" };

export default function GalleryPage() {
  return (
    <>
      <PageTitle
        title="Asset gallery"
        subtitle="Every image across the library and your episodes. Make loose images here too (mood boards, channel art, thumbnails)."
      />
      <Suspense fallback={<Skeleton rows={4} />}>
        <Gallery />
      </Suspense>
    </>
  );
}

async function Gallery() {
  const [all, loose, items, episodes, ai] = await Promise.all([
    getAssets({}, 500),
    getAssets({ episode: "", item: "" }),
    getLibrary(),
    getEpisodeCodes(),
    getAiNames(),
  ]);
  const itemMap = new Map(items.map((i) => [i._id, i]));
  const epMap = new Map(episodes.map((e) => [e.code, e]));
  const owners: Record<string, { label: string; href: string }> = {};
  for (const a of all) {
    const it = a.item ? itemMap.get(a.item) : undefined;
    if (it) owners[a._id] = { label: it.name, href: `/library/${libraryType(it.type)!.slug}/${it._id}` };
    else if (a.episode && epMap.has(a.episode))
      owners[a._id] = { label: `${a.episode} ${epMap.get(a.episode)!.title}`, href: `/episodes/${a.episode}/assets` };
  }
  const attached = all.filter((a) => a.item || a.episode);

  return (
    <div className="space-y-10">
      <AssetWorkspace
        ctx={{}}
        assets={loose}
        kinds={["other", "thumbnail", "mood", "channel-art"]}
        defaultKind="other"
        ai={ai}
        emptyText="No loose images yet."
      />
      <section>
        <h2 className="mb-3 font-semibold">From the library and episodes</h2>
        <AssetGrid assets={attached} owners={owners} emptyText="Images you make for characters, locations, stories and episodes show up here." />
      </section>
    </div>
  );
}
