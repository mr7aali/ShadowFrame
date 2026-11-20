import { Suspense } from "react";
import { PageTitle, Skeleton } from "@/components/ui";
import { getLibrary } from "@/lib/library-server";
import { NewEpisodeForm } from "./form";

export const metadata = { title: "New episode" };

export default function NewEpisodePage() {
  return (
    <div className="max-w-4xl">
      <PageTitle
        title="New episode"
        subtitle="Pick a story, cast and locations from your library (all optional). The studio creates the next video_N/ folder and opens step 1."
      />
      <Suspense fallback={<Skeleton rows={3} />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  const items = await getLibrary();
  return (
    <NewEpisodeForm
      stories={items.filter((i) => i.type === "story")}
      characters={items.filter((i) => i.type === "character")}
      locations={items.filter((i) => i.type === "location")}
    />
  );
}
