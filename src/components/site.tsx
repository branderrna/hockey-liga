import { Link } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronRight, CornerUpLeft, Info, Menu, Smartphone, X } from "lucide-react";
import { SEASON, activeLigas, fixturesUpdatedAt, upcomingLigas } from "@/data/league";
import { CURRENT_VERSION, releases } from "@/data/versions";
import { ViewingAs } from "@/components/my-team-picker";
import logo from "@/assets/liga-logo.jpg";

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
      <Link to="/add-to-home-screen" className={navLinkClass} onClick={onNavigate}>
        <Smartphone className="size-4 shrink-0" aria-hidden="true" />
        Add to home screen
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

/*
 * Both stamps are formatted with an explicit time zone, for the same reason
 * `leagueToday` in src/data/league.ts anchors to one: a fixed zone renders
 * identically on the server and in the browser, so hydration matches. Anything
 * relative ("2 hours ago") would not, and would go stale on a page left open.
 */
const fmtUpdated = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Singapore",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const fmtReleaseDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** The version in the footer, and the release history behind it. */
function VersionHistory() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Returns focus to the trigger, so closing does not strand the keyboard at
  // the top of the document.
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  // `aria-modal` promises focus stays inside the panel, and the backdrop makes
  // everything behind it unclickable, so Tab must not walk out there either.
  const onPanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const stops = panelRef.current?.querySelectorAll<HTMLElement>("button");
    const first = stops?.[0];
    const last = stops?.[stops.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="meta-mono underline decoration-transparent underline-offset-4 transition-colors hover:text-foreground hover:decoration-border"
      >
        v{CURRENT_VERSION}
      </button>

      {open ? (
        // Bottom-anchored on a phone, where the sheet rises from the footer it
        // was opened from; centred once there is room for it.
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close version history"
            onClick={close}
            className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="version-history-title"
            tabIndex={-1}
            data-no-pull-to-refresh
            onKeyDown={onPanelKeyDown}
            className="surface animate-rise relative flex max-h-[70vh] w-full max-w-md flex-col outline-none"
          >
            <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
              <div>
                <p className="label-eyebrow" id="version-history-title">
                  What&rsquo;s changed
                </p>
                <p className="meta-mono mt-1.5">
                  {SEASON.name} · v{CURRENT_VERSION}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close version history"
                className="-mt-1 -mr-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <ol className="flex flex-col gap-6 overflow-y-auto px-5 py-5">
              {releases.map((release) => (
                <li key={release.version}>
                  <p className="label-eyebrow">
                    v{release.version} · {fmtReleaseDate(release.date)}
                  </p>
                  <ul className="mt-2.5 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
                    {release.notes.map((note) => (
                      <li key={note} className="flex gap-2.5">
                        <span aria-hidden="true" className="text-faded">
                          &mdash;
                        </span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * Closes out every page: when the results last changed, then the version.
 * `mt-auto` is what pins it to the bottom on a short page — both shells put it
 * at the end of a flex column for that reason.
 */
function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-hairline px-5 py-5 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-x-4 gap-y-1">
        <p className="meta-mono">Results updated {fmtUpdated(fixturesUpdatedAt)}</p>
        <VersionHistory />
      </div>
    </footer>
  );
}

/** Page shell for liga and content pages: fixed rail on desktop, drawer on mobile. */
export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    // Flex column below `lg`, where the grid does not apply: it is what lets the
    // content column stretch so the footer lands at the bottom of a short page.
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[15rem_1fr]">
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
        <div className="border-t border-hairline px-3 py-2">
          <ViewingAs />
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
          />
          <div
            data-no-pull-to-refresh
            className="animate-rise absolute inset-0 flex w-full flex-col bg-background"
          >
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

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 hidden border-b border-hairline bg-background/90 px-8 py-2.5 backdrop-blur lg:flex lg:justify-end">
          <ViewingAs />
        </div>
        {/*
         * Pages centre their own <main> with `mx-auto`, and a flex item with
         * auto cross-axis margins does not stretch — it would size to
         * max-content and sit at its `max-w-*` regardless of the viewport.
         * This wrapper takes the stretch instead, so the page inside is laid
         * out as an ordinary block against the real width.
         */}
        <div className="flex-1">{children}</div>
        <SiteFooter />
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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4 sm:px-8">
          <span className="flex shrink-0 items-center gap-2.5">
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              className="size-7 rounded-sm object-contain"
            />
            <span className="text-sm font-medium tracking-tight">Hockey Liga</span>
          </span>
          <div className="ml-auto flex items-center gap-4">
            <Link
              to="/about"
              className="meta-mono flex shrink-0 items-center gap-1 whitespace-nowrap transition-colors hover:text-foreground"
            >
              About
              <ChevronRight className="size-3" aria-hidden="true" />
            </Link>
            <Link
              to="/add-to-home-screen"
              className="meta-mono flex shrink-0 items-center gap-1 whitespace-nowrap transition-colors hover:text-foreground"
            >
              Add to home screen
              <ChevronRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
