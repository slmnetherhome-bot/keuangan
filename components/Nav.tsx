"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Wallet } from "lucide-react";
import NotificationToggle from "@/components/NotificationToggle";

const links = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", Icon: ArrowLeftRight },
  { href: "/accounts", label: "Akun", Icon: Wallet },
];

function getTitle(pathname: string): string {
  if (pathname.startsWith("/transactions")) return "Transaksi";
  if (pathname.startsWith("/accounts")) return "Akun";
  return "Dashboard";
}

export default function Nav() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Top bar mobile */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-2.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 sm:hidden">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Keuangan
          </Link>
          <span className="text-sm text-zinc-400">/</span>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {title}
          </span>
        </div>
        <NotificationToggle />
      </div>

      {/* Top nav desktop */}
      <nav className="hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Keuangan
            </Link>
            <NotificationToggle />
          </div>
          <div className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                isActive(link.href)
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 dark:text-zinc-500"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center">
                <link.Icon className="h-6 w-6" strokeWidth={1.8} />
              </span>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}