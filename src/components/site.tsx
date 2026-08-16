import { Link } from "@tanstack/react-router";
import { SEASON } from "@/data/league";
import logo from "@/assets/liga-logo.jpg.asset.json";

const nav = [
  { to: "/", label: "Fixtures & Results" },
  { to: "/table", label: "League Table" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo.url}
            alt="Hockey Liga logo"
            className="h-9 w-9 rounded-md bg-white object-contain p-0.5"
          />
          <span className="leading-tight">
            <span className="block font-display text-xl tracking-wide">{SEASON.name}</span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {"\n"}
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-primary"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border py-8">
      <div className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground">
        {SEASON.name} · {SEASON.subtitle} · Aug 2 – Nov 29, 2026
      </div>
    </footer>
  );
}

export function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="label-eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{title}</h1>
        {intro ? <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{intro}</p> : null}
        <div className="mt-8">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
