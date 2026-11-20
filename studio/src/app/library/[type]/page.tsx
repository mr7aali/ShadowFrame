import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { IconImage } from "@/components/icons";
import { Card, fileUrl, PageTitle, Skeleton } from "@/components/ui";
import { libraryType } from "@/lib/library";
import { getLibrary } from "@/lib/library-server";
import { NewItemForm } from "./forms";

export const metadata = { title: "Library" };

export default function LibraryPage({ params }: PageProps<"/library/[type]">) {
  return (
    <Suspense fallback={<Skeleton rows={4} />}>
      <List params={params} />
    </Suspense>
  );
}

async function List({ params }: { params: PageProps<"/library/[type]">["params"] }) {
  const { type } = await params;
  const info = libraryType(type);
  if (!info || info.slug !== type) notFound();
  const items = await getLibrary(info.type);

  return (
    <>
      <PageTitle title={info.plural} subtitle={info.description} />
      <Card className="mb-6 p-4">
        <NewItemForm type={info.type} />
      </Card>

      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((it) => (
            <Link key={it._id} href={`/library/${info.slug}/${it._id}`} className="group">
              <Card className="h-full overflow-hidden transition group-hover:border-accent/50 group-hover:shadow-md">
                <div className={`bg-panel-2 ${info.type === "character" ? "aspect-4/3" : "aspect-video"}`}>
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileUrl(it.image, it.updatedAt)} alt={it.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-300">
                      <IconImage width={32} height={32} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="font-semibold group-hover:text-accent">{it.name}</div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted">
                    {info.summaryFields.map((k) => it.fields?.[k]).filter(Boolean).join(" · ") ||
                      (info.type === "story" ? it.fields?.logline : "") ||
                      "No details yet"}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <p className="font-medium">No {info.plural.toLowerCase()} yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Create one above. You can fill in the details with AI, make or upload images, then pick it when you start an
            episode.
          </p>
        </Card>
      )}
    </>
  );
}
