import Link from "next/link";
import { BTN, Card } from "@/components/ui";
import { getAiPublic } from "@/lib/ai/settings";
import { findFile, stepUrl } from "@/lib/pipeline";
import { getShots, type EpisodeView } from "@/lib/queries";
import { ShotBoard } from "../shots/board";

/** Shot images (Shots module) or animated clips (Motion module). */
export async function ShotsPanel({ ep, motion = false }: { ep: EpisodeView; motion?: boolean }) {
  const [shots, ai] = await Promise.all([getShots(ep.code), getAiPublic()]);
  const list = motion ? shots.filter((s) => s.animated) : shots;
  if (!list.length)
    return (
      <Card className="p-10 text-center">
        <p className="font-medium">{motion ? "No 🎬 shots yet" : "No shots yet"}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          {motion
            ? "Shots marked 🎬 in the shot list appear here, ready for their image-to-video clip."
            : "Shots appear here once the shot list and image prompts above are complete."}
        </p>
        <Link href={stepUrl(ep.code, findFile("04-shots", "shot-list")!.file)} className={`${BTN} mt-4`}>
          Open the shot list
        </Link>
      </Card>
    );
  return (
    <>
      {motion && (
        <p className="mb-4 max-w-3xl text-sm text-muted">
          For each 🎬 shot: upload its approved still as the first frame in Runway, Kling, Veo or Luma, paste the video
          prompt, make a 5-second clip, then upload it here. The render uses the clip instead of the still.
        </p>
      )}
      <ShotBoard shots={list} canGenerate={!!ai.routing.image.provider} motion={motion} />
    </>
  );
}
