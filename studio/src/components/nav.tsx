"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  exact?: boolean;
  /** Extra path prefix that should also mark this link active. */
  match?: string;
};

/**
 * Sidebar link that highlights itself on the current page. The pathname is
 * request data, so it streams in under Suspense (plain link until then).
 */
export function NavLink(props: Props) {
  return (
    <Suspense fallback={<NavLinkView {...props} active={false} />}>
      <ActiveNavLink {...props} />
    </Suspense>
  );
}

function ActiveNavLink(props: Props) {
  const pathname = usePathname();
  const base = props.href.split("?")[0];
  const active = props.exact
    ? pathname === base
    : pathname === base || pathname.startsWith(`${base}/`) || (!!props.match && pathname.startsWith(props.match));
  return <NavLinkView {...props} active={active} />;
}

function NavLinkView({ href, children, icon, active }: Props & { active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "bg-accent-soft text-accent" : "text-slate-600 hover:bg-panel-2 hover:text-foreground"
      }`}
    >
      {icon && <span className={active ? "text-accent" : "text-slate-400"}>{icon}</span>}
      <span className="truncate">{children}</span>
    </Link>
  );
}
