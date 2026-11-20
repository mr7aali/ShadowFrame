import Link from "next/link";
import { Suspense } from "react";
import { Card, PageTitle, Skeleton } from "@/components/ui";
import { listTemplates } from "@/lib/prompts";
import { getRecentPromptRuns } from "@/lib/queries";

export const metadata = { title: "Prompts" };

export default function PromptsPage() {
  return (
    <>
      <PageTitle
        title="Prompts"
        subtitle="Pick a prompt, fill the [BRACKETS], copy it into Claude or your image/video/voice tool, then save what you used. Templates are read live from the repo's prompts/ folder."
      />
      <Suspense fallback={<Skeleton rows={4} />}>
        <Templates />
      </Suspense>
    </>
  );
}

async function Templates() {
  const templates = await listTemplates();
  const groups = Map.groupBy(templates, (t) => t.group);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {[...groups].map(([group, items]) => (
            <section key={group}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{group}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((t, i) => {
                  const fields = new Set(t.blocks.flatMap((b) => b.placeholders.map((p) => p.key))).size;
                  return (
                    <Link key={t.path} href={`/prompts/${t.slug}`} className="group">
                      <Card className="h-full p-4 transition group-hover:border-accent/60">
                        <div className="flex items-baseline gap-2">
                          {group === "Script pipeline" && (
                            <span className="font-mono text-xs text-accent">{i + 1}</span>
                          )}
                          <h3 className="font-medium">{t.title}</h3>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{t.summary}</p>
                        <p className="mt-3 text-xs text-muted">
                          {t.blocks.length} block{t.blocks.length === 1 ? "" : "s"} · {fields} field
                          {fields === 1 ? "" : "s"}
                        </p>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <aside>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Recently saved</h2>
          <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-panel" />}>
            <RecentRuns titles={Object.fromEntries(templates.map((t) => [t.path, t]))} />
          </Suspense>
        </aside>
      </div>
    </>
  );
}

async function RecentRuns({ titles }: { titles: Record<string, { title: string; slug: string }> }) {
  const runs = await getRecentPromptRuns();
  if (!runs.length)
    return <p className="text-sm text-muted">Nothing saved yet. Saved fills show up here.</p>;
  return (
    <Card className="divide-y divide-line">
      {runs.map((r) => {
        const t = titles[r.template];
        return (
          <Link key={r._id} href={t ? `/prompts/${t.slug}` : "/prompts"} className="block p-3 hover:bg-panel-2">
            <div className="truncate text-sm">{r.title || t?.title || r.template}</div>
            <div className="mt-0.5 flex gap-2 text-xs text-muted">
              {r.episode && <span className="font-mono text-accent">{r.episode}</span>}
              <span>{t?.title}</span>
              <span className="ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        );
      })}
    </Card>
  );
}
