import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BTN, Card, Skeleton } from "@/components/ui";
import { getAiPublic } from "@/lib/ai/settings";
import { findFile, stepUrl } from "@/lib/pipeline";
import { getEpisode, getShots } from "@/lib/queries";
import { EpisodeHeader } from "../header";
import { ShotBoard } from "./board";

export const metadata = { title: "Shot board" };

export default function ShotsPage({ params }: PageProps<"/episodes/[code]/shots">) {
  return (
    <Suspense fallback={<Skeleton rows={6} />}>
      <Shots params={params} />
    </Suspense>
  );
}

async function Shots({ params }: { params: PageProps<"/episodes/[code]/shots">["params"] }) {
  const { code } = await params;
  const [ep, shots, ai] = await Promise.all([getEpisode(code), getShots(code), getAiPublic()]);
  if (!ep) notFound();
  return (
    <>
      <EpisodeHeader episode={ep} active="shots" />
      {shots.length ? (
        <ShotBoard shots={shots} canGenerate={!!ai.routing.image.provider} />
      ) : (
        <Card className="p-10 text-center">
          <p className="font-medium">No shots yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Shots appear here once the shot list and image prompts (stage 4) are complete in the pipeline.
          </p>
          <Link href={stepUrl(ep.code, findFile("04-shots", "shot-list")!.file)} className={`${BTN} mt-4`}>
            Open the shot list
          </Link>
        </Card>
      )}
    </>
  );
}
