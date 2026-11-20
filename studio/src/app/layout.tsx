import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { IconBook, IconHome, IconPlug, IconPlus, IconTerminal } from "@/components/icons";
import { NavLink } from "@/components/nav";
import { getAiPublic } from "@/lib/ai/settings";
import { getEpisodeCodes } from "@/lib/queries";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Case Studio", template: "%s · Case Studio" },
  description: "AI video production studio for the crime-thriller channel",
};

const NAV = [
  { href: "/", label: "Dashboard", icon: <IconHome />, exact: true },
  { href: "/prompts", label: "Prompt library", icon: <IconTerminal /> },
  { href: "/docs/README.md", label: "Guides", icon: <IconBook />, match: "/docs" },
  { href: "/settings/ai", label: "AI connections", icon: <IconPlug /> },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm font-bold text-white">CS</span>
      <span>
        Case Studio
        <span className="block text-[11px] font-normal text-muted">AI video production</span>
      </span>
    </Link>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-sidebar lg:flex">
            <div className="border-b border-line px-5 py-4">
              <Logo />
            </div>
            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
              <div className="space-y-0.5">
                {NAV.map((n) => (
                  <NavLink key={n.href} href={n.href} icon={n.icon} exact={n.exact} match={n.match}>
                    {n.label}
                  </NavLink>
                ))}
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between px-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Episodes
                  </span>
                  <Link href="/episodes/new" className="text-slate-400 hover:text-accent" title="New episode">
                    <IconPlus width={16} height={16} />
                  </Link>
                </div>
                <Suspense fallback={<div className="mx-3 h-8 animate-pulse rounded-lg bg-panel-2" />}>
                  <SidebarEpisodes />
                </Suspense>
              </div>
            </nav>
            <div className="border-t border-line p-3">
              <Suspense fallback={null}>
                <AiStatus />
              </Suspense>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Mobile top bar */}
            <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur lg:hidden">
              <div className="flex h-14 items-center gap-4 px-4">
                <Logo />
              </div>
              <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
                {NAV.map((n) => (
                  <NavLink key={n.href} href={n.href} exact={n.exact} match={n.match}>
                    {n.label}
                  </NavLink>
                ))}
              </nav>
            </header>
            <main className="mx-auto w-full max-w-350 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

async function SidebarEpisodes() {
  let episodes: { code: string; title: string }[] = [];
  try {
    episodes = await getEpisodeCodes();
  } catch {
    return <p className="px-3 text-xs text-rose-600">Database offline</p>;
  }
  if (!episodes.length) return <p className="px-3 text-xs text-muted">No episodes yet</p>;
  return (
    <div className="space-y-0.5">
      {episodes.map((e) => (
        <NavLink key={e.code} href={`/episodes/${e.code}`}>
          <span className="mr-1.5 font-mono text-xs text-slate-400">{e.code}</span>
          {e.title}
        </NavLink>
      ))}
    </div>
  );
}

async function AiStatus() {
  let connected: string[] = [];
  try {
    const ai = await getAiPublic();
    connected = ai.providers.filter((p) => p.connected).map((p) => p.id);
  } catch {
    return null;
  }
  return (
    <Link
      href="/settings/ai"
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted hover:bg-panel-2"
    >
      <span className={`h-2 w-2 rounded-full ${connected.length ? "bg-emerald-500" : "bg-amber-400"}`} />
      {connected.length
        ? `${connected.length} AI provider${connected.length === 1 ? "" : "s"} connected`
        : "No AI connected — copy & paste mode"}
    </Link>
  );
}
