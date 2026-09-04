import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight, CornerUpLeft, Info, Menu, X } from "lucide-react";
import { SEASON, activeLigas, upcomingLigas } from "@/data/league";
import { ViewingAs } from "@/components/my-team-picker";
import { useMyTeam } from "@/lib/my-team";
import logo from "@/assets/liga-logo.jpg";

const SEASON_RANGE = "2 Aug – 29 Nov 2026";

const navLinkClass =
  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground data-[status=active]:font-medium";

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="label-eyebrow px-3 pb-2 pt-6">{children}</p>;
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col overflow-y-auto px-3 pb-8">
      <SectionLabel>Navigation</SectionLabel>
      <Link to="/" activeOptions={{ exact: true }} className={navLinkClass} onClick={onNavigate}>
        <CornerUpLeft className="size-4 shrink-0" aria-hidden="true" />
        Back to start
      </Link>
      <Link to="/about" className={navLinkClass} onClick={onNavigate}>
        <Info className="size-4 shrink-0" aria-hidden="true" />
        About
      </Link>

      <SectionLabel>Ligas</SectionLabel>
      {activeLigas.map((liga) => (
        <Link
          key={liga.slug}
          to="/liga/$slug"
          params={{ slug: liga.slug }}
          className={navLinkClass}
          onClick={onNavigate}
        >
          <span className="flex-1 truncate">{liga.short}</span>
        </Link>
      ))}

      <SectionLabel>Coming soon</SectionLabel>
      {upcomingLigas.map((liga) => (
        <Link
          key={liga.slug}
          to="/liga/$slug"
          params={{ slug: liga.slug }}
          className={navLinkClass}
          onClick={onNavigate}
        >
          <span className="flex-1 truncate">{liga.short}</span>
          <span className="meta-mono shrink-0 opacity-70">Soon</span>
        </Link>
      ))}

      <Link
        to="/archive"
        className="meta-mono mt-6 px-3 py-2 transition-colors hover:text-foreground"
        onClick={onNavigate}
      >
        See past years&rsquo; results →
      </Link>

      <div className="mt-auto border-t border-hairline px-3 pt-4">
        <p className="meta-mono">{SEASON.name}</p>
        <p className="meta-mono mt-1 opacity-70">{SEASON_RANGE}</p>
      </div>
    </nav>
  );
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-3 py-4" onClick={onClick}>
      <img src={logo} alt="" aria-hidden="true" className="size-7 rounded-sm object-contain" />
      <span className="text-sm font-medium tracking-tight">Hockey Liga</span>
    </Link>
  );
}

/** Page shell for liga and content pages: fixed rail on desktop, drawer on mobile. */
export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { divisionId, teamId } = useMyTeam();
  const viewingAs = !!divisionId && !!teamId;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-hairline lg:flex lg:flex-col">
        <Brand />
        <SidebarNav />
      </aside>

      <header className="sticky top-0 z-40 border-b border-hairline bg-background/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-2">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            className="mr-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Menu className="size-5" />
          </button>
        </div>
        {viewingAs ? (
          <div className="border-t border-hairline px-3 py-2">
            <ViewingAs />
          </div>
        ) : null}
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
          />
          <div className="animate-rise absolute inset-0 flex w-full flex-col bg-background">
            <div className="flex items-center justify-between">
              <Brand onClick={() => setOpen(false)} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="mr-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="min-w-0">
        {viewingAs ? (
          <div className="sticky top-0 z-30 hidden border-b border-hairline bg-background/90 px-8 py-2.5 backdrop-blur lg:flex lg:justify-end">
            <ViewingAs />
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

/** Standard content page inside the shell. */
export function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
        <p className="label-eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">{title}</h1>
        {intro ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{intro}</p>
        ) : null}
        <div className="mt-10">{children}</div>
      </main>
    </AppShell>
  );
}

/** Chrome-free shell for the landing page: no rail, no drawer. */
export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4 sm:px-8">
          <span className="flex items-center gap-2.5">
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              className="size-7 rounded-sm object-contain"
            />
            <span className="text-sm font-medium tracking-tight">Hockey Liga</span>
          </span>
          <Link
            to="/about"
            className="meta-mono ml-auto flex items-center gap-1 transition-colors hover:text-foreground"
          >
            About
            <ChevronRight className="size-3" aria-hidden="true" />
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
