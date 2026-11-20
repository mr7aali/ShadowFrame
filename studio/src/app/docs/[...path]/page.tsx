import fs from "node:fs/promises";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Markdown } from "@/components/markdown";
import { docUrl, Skeleton } from "@/components/ui";
import { safeRepoPath } from "@/lib/paths";

export const metadata = { title: "Docs" };

export default function DocPage({ params }: PageProps<"/docs/[...path]">) {
  return (
    <Suspense fallback={<Skeleton rows={6} />}>
      <Doc params={params} />
    </Suspense>
  );
}

async function Doc({ params }: { params: PageProps<"/docs/[...path]">["params"] }) {
  const { path: parts } = await params;
  const rel = parts.map(decodeURIComponent).join("/");
  const abs = rel.endsWith(".md") ? safeRepoPath(rel) : null;
  if (!abs || rel.startsWith("studio/")) notFound();

  let source: string;
  try {
    source = await fs.readFile(abs, "utf8");
  } catch {
    notFound();
  }

  const crumbs = rel.split("/");
  const promptSlug = rel.startsWith("prompts/") ? rel.slice(8, -3) : null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <nav className="flex flex-wrap items-center gap-1">
          <Link href={docUrl("README.md")} className="hover:text-foreground">
            repo
          </Link>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              <span>/</span>
              {i < crumbs.length - 1 ? (
                <Link
                  href={docUrl(`${crumbs.slice(0, i + 1).join("/")}/README.md`)}
                  className="hover:text-foreground"
                >
                  {c}
                </Link>
              ) : (
                <span className="text-foreground">{c}</span>
              )}
            </span>
          ))}
        </nav>
        {promptSlug && (
          <Link
            href={`/prompts/${promptSlug}`}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
          >
            Fill this prompt →
          </Link>
        )}
      </div>
      <Markdown source={source} filePath={rel} />
    </div>
  );
}
