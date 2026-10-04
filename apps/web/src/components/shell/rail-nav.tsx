"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import type { Role } from "@katapatha/core/domain/roles";
import { isDateOnly } from "@/lib/dates";
import { NAV, isCurrent } from "./nav";
import { NavIcon } from "./nav-icon";

const DAY_KEY = "katapatha:day";

/**
 * The day the rail's links open on.
 *
 * Every desk screen takes `?date=`, and without it opens on today's operating
 * day. A plain href therefore dropped the day the operator was working on: pick
 * 9 April on the dashboard, click Planning, and land on an empty day. So the
 * links carry the URL's `?date=`, and where the URL has none (the plan board is
 * /dispatcher/plans/{id}) the last day picked in this tab. Storage is a
 * convenience — if it is unavailable the links fall back to the URL alone.
 */
function useCarriedDay(): string | null {
  const fromUrl = useSearchParams()?.get("date") ?? null;
  const explicit = isDateOnly(fromUrl) ? fromUrl : null;
  const remembered = useSyncExternalStore(noSubscription, readDay, () => null);

  useEffect(() => {
    if (!explicit) return;
    try {
      sessionStorage.setItem(DAY_KEY, explicit);
    } catch {
      // Private window or blocked storage: the URL is enough.
    }
  }, [explicit]);

  return explicit ?? remembered;
}

function noSubscription() {
  return () => {};
}

function readDay(): string | null {
  try {
    const stored = sessionStorage.getItem(DAY_KEY);
    return isDateOnly(stored) ? stored : null;
  } catch {
    return null;
  }
}

function withDay(href: string, day: string | null): string {
  return day ? `${href}?date=${day}` : href;
}

/**
 * The nav links, the shell's only client component.
 *
 * A layout does not receive the pathname, and the alternatives are worse: a
 * middleware-set `x-pathname` header couples the rail to middleware for
 * nothing, and making the whole shell a client component would drag the logo,
 * the chip and the avatar across the boundary with it.
 *
 * `NavItem` carries a RegExp, which does not survive the server/client
 * serialisation boundary — so these take a `role` and look the items up in
 * `NAV` themselves. Passing `nav.items` from the server shell crashes the page
 * at render time, and `next build` does not catch it.
 */

export function RailNav({ role, label }: { role: Role; label: string }) {
  const pathname = usePathname() ?? "";
  const day = useCarriedDay();
  const items = NAV[role].items;

  return (
    <nav aria-label={label} className="flex flex-col gap-1 text-sm">
      {items.map((item) => {
        const active = isCurrent(item, pathname);
        return (
          <Link
            key={item.href}
            href={withDay(item.href, day)}
            aria-current={active ? "page" : undefined}
            prefetch={false}
            className={`relative flex min-h-10 items-center gap-3 rounded-[6px] px-4 text-[14.5px] ${
              active ? "bg-night-raised font-semibold text-white" : "text-white hover:bg-white/5"
            }`}
          >
            {active ? (
              <span aria-hidden className="absolute left-0 top-1.5 h-7 w-0.75 rounded-[2px] bg-action" />
            ) : null}
            <span className={active ? "text-action" : undefined}>
              <NavIcon kind={item.icon} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Below the rail's breakpoint the sections become a horizontally scrolling
 * strip. The strip scrolls; the page does not — DESIGN.md requires no
 * page-wide horizontal scroll at 390px.
 */
export function MobileNav({ role, label }: { role: Role; label: string }) {
  const pathname = usePathname() ?? "";
  const day = useCarriedDay();
  const items = NAV[role].items;
  if (!items.length) return null;

  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto px-3 pb-2">
      {items.map((item) => {
        const active = isCurrent(item, pathname);
        return (
          <Link
            key={item.href}
            href={withDay(item.href, day)}
            aria-current={active ? "page" : undefined}
            prefetch={false}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-control px-3 text-sm ${
              active ? "bg-white font-semibold text-ink" : "font-medium text-white/80"
            }`}
          >
            <NavIcon kind={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
