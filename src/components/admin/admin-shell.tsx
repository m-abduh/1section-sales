"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/niches",
    label: "Niches",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        <path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    href: "/admin/chats",
    label: "Chats",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const current = [...navItems]
    .reverse()
    .find((item) => isActive(item.href));

  const initial = (user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-surface-muted text-fg">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
          <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Logo className="h-4 w-[65px] text-fg" />
              <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                Admin
              </span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
              Workspace
            </p>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-surface-muted font-semibold text-fg"
                          : "font-medium text-fg-muted hover:bg-surface-muted/70 hover:text-fg"
                      }`}
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset transition ${
                          active
                            ? "bg-card text-fg ring-border"
                            : "bg-transparent text-fg-muted ring-transparent group-hover:text-fg"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {active ? (
                        <span className="size-1.5 rounded-full bg-fg" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fg text-xs font-bold text-surface">
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-fg">
                  {user?.email ?? "—"}
                </p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-fg-muted">
                  {user?.role ?? "admin"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-fg-muted transition hover:bg-surface-muted hover:text-fg"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <Link href="/admin" className="flex items-center gap-2 lg:hidden">
                <Logo className="h-4 w-[65px] text-fg" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                  Admin
                </span>
              </Link>

              <div className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
                <span className="text-fg-muted">Admin</span>
                <span className="text-fg-muted/60">/</span>
                <span className="truncate font-medium text-fg">
                  {current?.label ?? "Dashboard"}
                </span>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <div className="hidden items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 sm:flex">
                  <span className="grid size-6 place-items-center rounded-full bg-fg text-[10px] font-bold text-surface">
                    {initial}
                  </span>
                  <span className="max-w-[170px] truncate text-xs font-medium text-fg">
                    {user?.email ?? "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile nav */}
            <nav className="-mx-0 flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-fg text-surface"
                        : "text-fg-muted hover:bg-surface-muted hover:text-fg"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
