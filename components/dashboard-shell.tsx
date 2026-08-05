"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck, LayoutDashboard, ClipboardList, Users, UserCog, Search, LogOut, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/lib/use-current-user";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard, adminOnly: false },
  { href: "/capture", label: "Capture agents", icon: ClipboardList, adminOnly: false },
  { href: "/agents", label: "Find an agent", icon: Search, adminOnly: false },
  { href: "/admin", label: "All agents", icon: Users, adminOnly: true },
  { href: "/admin/users", label: "Users", icon: UserCog, adminOnly: true },
];

/**
 * MD3 navigation drawer — permanent on desktop, modal on mobile.
 * Wraps the clerk (capture) and admin dashboards.
 */
export function DashboardShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useCurrentUser();

  const logout = () => { api.clearToken(); router.push("/login"); };
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  const nav = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <Link href="/" className="mb-4 flex items-center gap-3 px-3 py-2" onClick={() => setOpen(false)}>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-md-primary text-md-on-primary">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <p className="md-label-medium text-md-primary">APC TARABA</p>
          <p className="md-title-medium">Agent Portal</p>
        </div>
      </Link>

      {items.map(({ href, label, icon: Icon }) => {
        // /admin must not stay highlighted while on /admin/users.
        const active = href === "/" ? pathname === "/"
          : href === "/admin" ? pathname === "/admin"
          : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`md-label-large flex h-14 items-center gap-3 rounded-full px-4 transition-colors ${
              active
                ? "bg-md-primary-container text-md-on-primary-container"
                : "text-md-on-surface-variant hover:bg-md-surface-variant"
            }`}
          >
            <Icon className="size-5 shrink-0" />
            {label}
          </Link>
        );
      })}

      {user && (
        <div className="mt-auto rounded-xl bg-md-surface-variant/45 px-4 py-3">
          <p className="md-label-large truncate">{user.username}</p>
          <span className="md-label-medium mt-1 inline-block rounded bg-md-primary-container px-2 py-0.5 text-md-on-primary-container">
            {isAdmin ? "Administrator" : "Collector"}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={logout}
        className={`md-label-large flex h-14 items-center gap-3 rounded-full px-4 text-md-on-surface-variant transition-colors hover:bg-md-surface-variant ${user ? "" : "mt-auto"}`}
      >
        <LogOut className="size-5 shrink-0" />
        Logout
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-md-surface text-md-on-surface">
      {/* permanent drawer — desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-md-surface-variant bg-md-surface lg:block">
        {nav}
      </aside>

      {/* modal drawer — mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-72 rounded-r-2xl bg-md-surface shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full text-md-on-surface-variant hover:bg-md-surface-variant"
            >
              <X className="size-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-md-surface-variant bg-md-surface/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
            <Button
              variant="text"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
            <h1 className="md-title-large">{title}</h1>
            {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
