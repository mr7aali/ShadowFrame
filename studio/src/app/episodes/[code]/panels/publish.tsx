import Link from "next/link";
import { AssetWorkspace } from "@/components/image-studio";
import { BTN_PRIMARY, Card, fileUrl } from "@/components/ui";
import { getAiNames, getAssets } from "@/lib/library-server";
import { extractCodeBlocks } from "@/lib/markdown";
import { moduleUrl } from "@/lib/pipeline";
import { getFinalVideo } from "@/lib/production";
import type { EpisodeView } from "@/lib/queries";
import { readEpisodeFile } from "@/lib/workspace";

const CHECKLIST = [
  "Watch the whole video once, start to finish",
  "Upload as Unlisted first",
  "Turn on “Altered or synthetic content” disclosure",
  "Paste title, description and tags from the packaging file",
  "Upload the thumbnail and the captions (.srt)",
  "Add the end screen and the series playlist",
  "Schedule for a U.S. evening",
  "Post the Shorts around the release",
];

/** The finished video, the thumbnail, and the upload checklist. */
export async function PublishPanel({ ep }: { ep: EpisodeView }) {
  const [final, packaging, thumbs, ai] = await Promise.all([
    getFinalVideo(ep.code),
    readEpisodeFile(ep.folder, "08-packaging/title-description-thumbnail.md"),
    getAssets({ episode: ep.code }),
    getAiNames(),
  ]);

  // The thumbnail prompt the AI wrote in the packaging file (first text block under "## Thumbnail")
  const thumbSection = packaging.split(/^##\s+/m).find((s) => /^thumbnail/i.test(s)) ?? "";
  const thumbPrompt = extractCodeBlocks(thumbSection)[0]?.text ?? "";

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          {final ? (
            <>
              <video controls className="aspect-video w-full bg-black" src={fileUrl(final.output, final.updatedAt)} />
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="text-sm font-medium">{final.output.split("/").pop()}</div>
                <a href={`${fileUrl(final.output)}?download`} className={BTN_PRIMARY}>
                  Download MP4
                </a>
              </div>
            </>
          ) : (
            <div className="grid aspect-video place-items-center bg-panel-2 text-center">
              <div>
                <p className="font-medium">No final video yet</p>
                <Link href={moduleUrl(ep.code, "render")} className={`${BTN_PRIMARY} mt-3`}>
                  Go to Edit & render
                </Link>
              </div>
            </div>
          )}
        </Card>
        <Card className="h-fit p-4">
          <h3 className="mb-3 font-semibold">Before you publish</h3>
          <ul className="space-y-2 text-sm">
            {CHECKLIST.map((c) => (
              <li key={c} className="flex gap-2">
                <input type="checkbox" className="mt-1" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section>
        <h3 className="mb-1 font-semibold">Thumbnail</h3>
        <p className="mb-3 text-sm text-muted">
          {thumbPrompt
            ? "Starts from the thumbnail prompt in your packaging file. Add the 3–4 word text in Canva afterwards, not in the AI image."
            : "Complete the packaging file above and its thumbnail prompt appears here."}
        </p>
        <AssetWorkspace
          ctx={{ episode: ep.code }}
          assets={thumbs.filter((a) => a.kind === "thumbnail")}
          initialPrompt={thumbPrompt}
          kinds={["thumbnail"]}
          defaultKind="thumbnail"
          ai={ai}
          emptyText="No thumbnails yet."
        />
      </section>
    </div>
  );
}
