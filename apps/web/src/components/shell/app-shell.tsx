import Link from "next/link";
import Image from "next/image";
import { Suspense, type ReactNode } from "react";
import type { Role } from "@katapatha/core/domain/roles";
import { NAV, initialsOf } from "./nav";
import { NavIcon } from "./nav-icon";
import { MobileNav, RailNav } from "./rail-nav";

/**
 * The workspace shell, for every role that has one.
 *
 * There were three. The dispatcher used a shell hardcoded to DISPATCHER — it
 * redirected every other role away and rendered a single nav item — while the
 * loader and store each got their own sidebar in the Figma visual pass, byte
 * for byte identical to each other apart from the nav items and the labels.
 * This is those three, folded into one, keeping the visual treatment they
 * arrived with: the chip, the icons, the white active state and the avatar
 * footer.
 *
 * Session and role checking are deliberately NOT here. They live in
 * `requireRole()` so a server action can run the same check; a layout cannot
 * guard an action. The layout calls it and passes the result in, so the shell
 * makes no network call of its own — the sidebars it replaces each fetched
 * /auth/me themselves and swallowed the failure, which is why a signed-out
 * user still saw the store and loader consoles.
 *
 * Width is 212px, per DESIGN.md's "persistent 212px rail". The sidebars this
 * replaces had drifted to w-64.
 *
 * The rail is the Figma file's unified sidebar (L-02…L-06): a night rail, the
 * role block in flame, a dark active row with a flame bar. It started as the
 * loader's opt-in variant and is now the one sidebar every workspace uses.
 */
export function AppShell({
  role,
  name,
  scope,
  children,
}: {
  role: Role;
  /** The signed-in person. */
  name: string;
  /** Depot, dock or outlet — the records this session can touch. */
  scope: string;
  children: ReactNode;
}) {
  const nav = NAV[role];
  const navLabel = `${nav.title} workspace`;
  const initials = initialsOf(name, nav.fallbackInitials);

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <a
        href="#workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-3"
      >
        Skip to workspace
      </a>

      <DockRail role={role} name={name} scope={scope} initials={initials} title={nav.title} home={nav.home} label={navLabel} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-rail text-white lg:hidden">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4">
            <Link href={nav.home} className="flex items-center">
              <Image
                src="/logo/katapatha-lockup-dark.png"
                alt="Katapatha"
                width={1600}
                height={409}
                className="h-auto w-28"
              />
            </Link>
            <div className="flex items-center gap-3">
              <span className="truncate text-xs text-white/70">{scope}</span>
              <SignOutLink />
            </div>
          </div>
          <span className="sr-only">Signed in as {name}</span>
          {/* The nav reads ?date= (useSearchParams), which needs a boundary. */}
          <Suspense fallback={null}>
            <MobileNav role={role} label={navLabel} />
          </Suspense>
        </header>

        <div id="workspace" tabIndex={-1} className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * A link, not a form.
 *
 * /sign-out is a GET route handler that invalidates the session server-side and
 * clears the cookie, so the control works without JavaScript and without a
 * <form> in the middle of the rail's flex layout.
 */
function SignOutLink() {
  return (
    <Link
      href="/sign-out"
      aria-label="Sign out"
      prefetch={false}
      className="inline-flex size-11 items-center justify-center rounded-control text-white/70 hover:bg-white/10 hover:text-white"
    >
      <NavIcon kind="sign-out" />
    </Link>
  );
}

/** The Figma sidebar (node 37:482): night rail, flame role block, dark active
 *  row with a flame indicator, and a plain avatar footer. */
function DockRail({
  role,
  name,
  scope,
  initials,
  title,
  home,
  label,
}: {
  role: Role;
  name: string;
  scope: string;
  initials: string;
  title: string;
  home: string;
  label: string;
}) {
  return (
    <aside className="hidden h-screen w-53 shrink-0 flex-col justify-between bg-night px-2 pb-4 pt-5 text-white lg:sticky lg:top-0 lg:flex">
      <div className="flex flex-col gap-3">
        <Link href={home} className="flex items-center px-2">
          <Image src="/logo/katapatha-lockup-dark.png" alt="Katapatha" width={1600} height={409} className="h-auto w-36" priority />
        </Link>

        <div className="mt-2 flex min-h-12.5 items-center gap-3 rounded-control bg-action px-3 text-[#111]">
          <NavIcon kind={NAV[role].items[0]?.icon ?? "dock"} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-tight">{title}</p>
            <p className="truncate text-[11.5px] font-medium opacity-70">{scope}</p>
          </div>
        </div>

        <Suspense fallback={null}>
          <RailNav role={role} label={label} />
        </Suspense>
      </div>

      <div className="border-t border-night-line pt-4">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex size-9.5 shrink-0 items-center justify-center rounded-full bg-night-line text-[13px] font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{name}</p>
              <p className="truncate text-xs text-white/60">{title}</p>
            </div>
          </div>
          <SignOutLink />
        </div>
      </div>
    </aside>
  );
}
