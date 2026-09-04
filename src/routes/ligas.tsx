import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LandingShell } from "@/components/site";
import {
  SEASON,
  activeLigas,
  matchesOf,
  playedOf,
  teamsOf,
  upcomingLigas,
  type ActiveLiga,
} from "@/data/league";

export const Route = createFileRoute("/ligas")({
  head: () => ({
    meta: [
      { title: "All Ligas — Hockey Liga 2026" },
      {
        name: "description",
        content:
          "Pick a liga to see its weekend schedule and league table: Women's, Premier and Youth U21 Girls and Boys, played across Singapore from August to November 2026.",
      },
      { property: "og:title", content: "All Ligas — Hockey Liga 2026" },
      {
        property: "og:description",
        content: "Weekend schedules and standings across every 2026 Hockey Liga.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AllLigasPage,
});

function LigaCard({ liga, index }: { liga: ActiveLiga; index: number }) {
  const games = matchesOf(liga.divisionId).length;
  const played = playedOf(liga.divisionId).length;
  const teams = teamsOf(liga.divisionId).length;

  return (
    <Link
      to="/liga/$slug"
      params={{ slug: liga.slug }}
      style={{ animationDelay: `${index * 55}ms` }}
      className="animate-rise surface group relative flex flex-col justify-between gap-6 p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/45 hover:shadow-[0_1px_0_0_var(--color-hairline)] sm:p-6"
    >
      <div>
        <p className="label-eyebrow">{liga.group}</p>
        <h2 className="mt-2 text-xl sm:text-2xl">{liga.short}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{liga.name}</p>
      </div>

      <div className="flex items-end justify-between gap-4 border-t border-hairline pt-4">
        <dl className="meta-mono flex gap-5">
          <div>
            <dt className="opacity-70">Teams</dt>
            <dd className="mt-0.5 text-sm text-foreground tabular-nums">{teams}</dd>
          </div>
          <div>
            <dt className="opacity-70">Games</dt>
            <dd className="mt-0.5 text-sm text-foreground tabular-nums">
              {played}/{games}
            </dd>
          </div>
        </dl>
        <ArrowRight
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

function AllLigasPage() {
  return (
    <LandingShell>
      <main className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="label-eyebrow">{SEASON.name} · 2 Aug – 29 Nov</p>
        <h1 className="mt-3 max-w-xl text-3xl leading-tight sm:text-5xl">
          Which liga are you following?
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
          Pick a liga for its weekend schedule, scores and league table.
        </p>

        <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2">
          {activeLigas.map((liga, i) => (
            <LigaCard key={liga.slug} liga={liga} index={i} />
          ))}
        </div>

        <section className="mt-14">
          <p className="label-eyebrow">Not running this season</p>
          <div className="mt-4 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
            {upcomingLigas.map((liga) => (
              <Link
                key={liga.slug}
                to="/liga/$slug"
                params={{ slug: liga.slug }}
                className="group flex items-center justify-between gap-3 bg-card px-4 py-3 transition-colors hover:bg-secondary"
              >
                <span className="truncate text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                  {liga.name}
                </span>
                <ArrowRight
                  className="size-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>

          <Link
            to="/archive"
            className="meta-mono mt-5 inline-block transition-colors hover:text-foreground"
          >
            See past years&rsquo; results →
          </Link>
        </section>
      </main>
    </LandingShell>
  );
}
