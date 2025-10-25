"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Flame, Home, Settings, Trophy } from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: Home },
  { label: "Configuration", href: "/configuration", icon: Settings },
  { label: "Rank", href: "/rank", icon: Trophy },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col gap-8 bg-night px-6 py-10 text-neonBlue">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-neonPink/20 p-2">
          <Flame className="h-6 w-6 text-neonPink" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-widest text-neonPink/70">FIAP Next Challenge</p>
          <h1 className="text-lg font-semibold text-neonBlue">Code Evaluator</h1>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "border-neonPink bg-neonPink/20 text-neonPink"
                  : "border-neonBlue/10 text-neonBlue hover:border-neonPink/60 hover:text-neonPink",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-xl border border-neonBlue/20 bg-night/80 p-4 text-xs text-neonPink/70">
        <p className="font-semibold text-neonBlue">Live insights</p>
        <p className="mt-1">
          Configure challenge rules, onboard repositories, and monitor evaluations in real time—all from this panel.
        </p>
      </div>
    </aside>
  );
}
