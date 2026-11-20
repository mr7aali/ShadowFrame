import Link from "next/link";
import path from "node:path";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "./client";
import { docUrl } from "./ui";

type HastNode = { type: string; value?: string; children?: HastNode[] };

function hastText(node: HastNode | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastText).join("");
}

/**
 * Renders a repo markdown file. Relative links to other .md files become
 * in-app /docs links; code blocks get a Copy button.
 */
export function Markdown({ source, filePath }: { source: string; filePath: string }) {
  const dir = path.posix.dirname(filePath);

  const components: Components = {
    a({ href = "", children }) {
      if (/^(https?:|mailto:)/.test(href))
        return (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        );
      if (href.startsWith("#")) return <a href={href}>{children}</a>;
      const [target, hash] = href.split("#");
      const resolved = path.posix.normalize(path.posix.join(dir, decodeURIComponent(target)));
      if (resolved.startsWith("..")) return <span>{children}</span>;
      const url = resolved.endsWith(".md")
        ? docUrl(resolved)
        : docUrl(path.posix.join(resolved, "README.md"));
      return <Link href={url + (hash ? `#${hash}` : "")}>{children}</Link>;
    },
    pre({ node, children }) {
      const text = hastText(node as unknown as HastNode).replace(/\n$/, "");
      return (
        <div className="group relative">
          <div className="absolute right-2 top-2 z-10 opacity-70 transition group-hover:opacity-100">
            <CopyButton text={text} className="bg-white" />
          </div>
          <pre>{children}</pre>
        </div>
      );
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto">
          <table>{children}</table>
        </div>
      );
    },
  };

  return (
    <article className="prose max-w-none prose-headings:tracking-tight prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-pre:border prose-pre:border-line prose-pre:bg-panel-2 prose-pre:text-slate-800 prose-code:before:content-none prose-code:after:content-none prose-th:text-left">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </article>
  );
}
