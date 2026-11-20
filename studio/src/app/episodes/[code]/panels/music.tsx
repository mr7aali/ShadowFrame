import fs from "node:fs/promises";
import path from "node:path";
import { CopyButton } from "@/components/client";
import { Card } from "@/components/ui";
import { tableRows } from "@/lib/markdown";
import { REPO_ROOT } from "@/lib/paths";
import type { EpisodeView } from "@/lib/queries";
import { musicBed } from "@/lib/render";
import { readEpisodeFile } from "@/lib/workspace";
import { MusicUpload } from "./music-upload";

/** Music cues suggested by the cue sheet, plus the bed that the render mixes under the voice. */
export async function MusicPanel({ ep }: { ep: EpisodeView }) {
  const [cueSheet, bed] = await Promise.all([readEpisodeFile(ep.folder, "06-music-sfx/cue-sheet.md"), musicBed(ep.folder)]);
  const rel = bed ? path.relative(REPO_ROOT, bed).split(path.sep).join("/") : "";
  const version = bed ? String((await fs.stat(bed)).mtimeMs) : "";

  // Rows of the "## Music" table: | Cue | Section | Mood | Search terms / AI music prompt | Volume |
  const musicPart = cueSheet.split(/^##\s+/m).find((s) => /^music\b/i.test(s)) ?? "";
  const rows = tableRows(musicPart).filter((r) => r.length >= 3 && !/^cue$/i.test(r[0]));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <Card className="overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <h3 className="font-semibold">Suggested music</h3>
          <p className="text-xs text-muted">From your cue sheet. Search a licensed library, or paste the prompt into an AI music tool that allows commercial use.</p>
        </div>
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((r, i) => {
              const prompt = r[3] ?? r[2] ?? "";
              return (
                <li key={i} className="flex flex-wrap items-start gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {r[0]} <span className="font-normal text-muted">· {r[1]}</span>
                    </div>
                    <div className="text-xs text-muted">{r[2]}</div>
                    {prompt && <div className="mt-1 font-mono text-xs text-slate-600">{prompt}</div>}
                  </div>
                  {prompt && <CopyButton text={prompt} label="Copy prompt" />}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="p-4 text-sm text-muted">Complete the cue sheet above and its music cues appear here.</p>
        )}
      </Card>

      <Card className="h-fit p-4">
        <h3 className="font-semibold">Music bed for the render</h3>
        <p className="mt-0.5 text-xs text-muted">
          One track, looped under the whole episode and automatically ducked when the narrator speaks. Saved as{" "}
          <code>{ep.folder}/assets/music/bed.mp3</code>.
        </p>
        <MusicUpload code={ep.code} current={rel} version={version} />
      </Card>
    </div>
  );
}
