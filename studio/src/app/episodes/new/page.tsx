import { NewEpisodeForm } from "./form";
import { PageTitle } from "@/components/ui";

export const metadata = { title: "New episode" };

export default function NewEpisodePage() {
  return (
    <div className="max-w-2xl">
      <PageTitle
        title="New episode"
        subtitle="Creates the next video_N/ folder and opens step 1. The studio then walks you through all 16 files, from idea to license log."
      />
      <NewEpisodeForm />
    </div>
  );
}
