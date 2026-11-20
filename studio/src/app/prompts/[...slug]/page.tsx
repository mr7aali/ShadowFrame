import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Markdown } from "@/components/markdown";
import { docUrl, Skeleton } from "@/components/ui";
import { loadTemplate } from "@/lib/prompts";
import { getEpisodeCodes, getPromptRuns } from "@/lib/queries";
import { PromptFiller, SavedRuns } from "./filler";

export const metadata = { title: "Prompt" };

export default function PromptPage({ params }: PageProps<"/prompts/[...slug]">) {
  return (
    <Suspense fallback={<Skeleton rows={6} />}>
      <Prompt params={params} />
    </Suspense>
  );
}

/** Instructions shown above the blocks: everything before the first code fence. */
function intro(markdown: string): string {
  const body = markdown.replace(/^#\s+.+$/m, "");
  const cut = body.indexOf("```");
  return (cut === -1 ? body : body.slice(0, cut)).trim();
}

async function Prompt({ params }: { params: PageProps<"/prompts/[...slug]">["params"] }) {
  const { slug } = await params;
  const template = await loadTemplate(`prompts/${slug.map(decodeURIComponent).join("/")}.md`);
  if (!template) notFound();
  const [episodes, runs] = await Promise.all([getEpisodeCodes(), getPromptRuns(template.path)]);
  const instructions = intro(template.markdown);

  return (
    <>
      <div className="mb-6">
        <Link href="/prompts" className="text-xs text-muted hover:text-foreground">
          ← Prompts
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{template.title}</h1>
          <Link href={docUrl(template.path)} className="text-xs text-muted hover:text-accent">
            View full file ({template.path}) →
          </Link>
        </div>
        {instructions && (
          <div className="mt-3 max-w-3xl text-sm">
            <Markdown source={instructions} filePath={template.path} />
          </div>
        )}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {template.blocks.map((b) => (
            <PromptFiller key={b.index} template={template.path} block={b} episodes={episodes} />
          ))}
          {!template.blocks.length && (
            <p className="text-sm text-muted">This file has no ```text prompt blocks.</p>
          )}
        </div>
        <aside>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            Saved · {runs.length}
          </h2>
          <SavedRuns runs={runs} />
        </aside>
      </div>
    </>
  );
}
