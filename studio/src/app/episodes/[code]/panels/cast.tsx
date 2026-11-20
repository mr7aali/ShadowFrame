import { AssetNotes, AssetStatusControl, CopyButton, GenerateImageButton, UploadButton, UseLibraryFaceButton } from "@/components/client";
import { Card, fileUrl } from "@/components/ui";
import { getAiPublic } from "@/lib/ai/settings";
import { getLibrary } from "@/lib/library-server";
import { getCharacters, getLocations, type AssetStatus, type EpisodeView } from "@/lib/queries";

/** Characters and locations: generate, upload or reuse the locked reference images. */
export async function CastPanel({ ep }: { ep: EpisodeView }) {
  const code = ep.code;
  const [characters, locations, ai, library] = await Promise.all([
    getCharacters(code),
    getLocations(code),
    getAiPublic(),
    getLibrary("character"),
  ]);
  const libraryFaces = new Set(library.filter((c) => c.image).map((c) => c.slug));
  const canGenerate = !!ai.routing.image.provider;

  return (
    <>
      <p className="mb-6 max-w-3xl text-sm text-muted">
        Lock every face and location <strong className="text-foreground">before</strong> making
        shots. Uploads are saved to <code>{ep.folder}/assets/references/</code> with the names the
        shot prompts expect (<code>mara_front.png</code>, <code>L1.png</code>…).
      </p>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
        Characters · {characters.length}
      </h2>
      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        {characters.map((c) => (
          <RefCard
            key={c._id}
            kind="character"
            id={c._id}
            title={c.name}
            subtitle={c.notes || `${c.slug}_front.png`}
            image={c.image}
            status={c.status}
            notes={c.notes}
            prompts={c.prompts}
            version={c.updatedAt}
            canGenerate={canGenerate}
            libraryFace={libraryFaces.has(c.slug)}
          />
        ))}
        {!characters.length && <Empty file={`${ep.folder}/02-characters/character-image-prompts.md`} />}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
        Locations · {locations.length}
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {locations.map((l) => (
          <RefCard
            key={l._id}
            kind="location"
            id={l._id}
            title={`${l.code} — ${l.name}`}
            subtitle={l.usedIn ? `Shots ${l.usedIn}` : ""}
            image={l.image}
            status={l.status}
            notes={l.notes}
            prompts={l.prompt ? [{ label: "Location prompt", text: l.prompt }] : []}
            version={l.updatedAt}
            canGenerate={canGenerate}
          />
        ))}
        {!locations.length && <Empty file={`${ep.folder}/03-locations/location-prompts.md`} />}
      </div>
    </>
  );
}

function Empty({ file }: { file: string }) {
  return (
    <p className="text-sm text-muted">
      Nothing yet — complete <code>{file}</code> above and it appears here.
    </p>
  );
}

function RefCard(props: {
  kind: "character" | "location";
  id: string;
  title: string;
  subtitle: string;
  image: string;
  status: AssetStatus;
  notes: string;
  prompts: { label: string; text: string }[];
  version?: string;
  canGenerate: boolean;
  libraryFace?: boolean;
}) {
  return (
    <Card className="flex flex-col overflow-hidden sm:flex-row">
      <div className="aspect-video shrink-0 bg-panel-2 sm:aspect-auto sm:w-44">
        {props.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(props.image, props.version)} alt={props.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full min-h-32 place-items-center text-xs text-slate-400">no reference yet</div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold">{props.title}</h3>
          {props.subtitle && <p className="text-xs text-muted">{props.subtitle}</p>}
        </div>
        {props.prompts.map((p) => (
          <details key={p.label} className="group rounded border border-line bg-panel-2/50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-1.5 text-xs text-muted">
              <span className="truncate">
                <span className="inline-block transition group-open:rotate-90">▸</span> {p.label}
              </span>
              <CopyButton text={p.text} />
            </summary>
            <p className="whitespace-pre-wrap px-2.5 pb-2.5 font-mono text-xs leading-relaxed text-slate-700">{p.text}</p>
          </details>
        ))}
        <div className="mt-auto space-y-2 border-t border-line pt-3">
          <AssetStatusControl kind={props.kind} id={props.id} status={props.status} />
          <div className="flex flex-wrap gap-2">
            {props.libraryFace && <UseLibraryFaceButton id={props.id} />}
            {props.canGenerate && props.prompts.length > 0 && (
              <GenerateImageButton kind={props.kind} id={props.id} again={!!props.image} />
            )}
            <UploadButton kind={props.kind} id={props.id} label={props.image ? "Replace reference" : "Upload locked reference"} />
          </div>
          <AssetNotes kind={props.kind} id={props.id} notes={props.notes} />
        </div>
      </div>
    </Card>
  );
}
