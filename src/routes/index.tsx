import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site";
import { DivisionTabs } from "@/components/division-tabs";
import {
  SEASON,
  divisionById,
  isPlayed,
  matchDates,
  matchesOf,
  nextDate,
  playedOf,
  standings,
  teamsOf,
  type DivisionId,
} from "@/data/league";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hockey Liga 2026 — Schedule for Women's, Premier & U21" },
      {
        name: "description",
        content:
          "Match schedule for the three concurrent 2026 Hockey Ligas: Women's, Premier and Youth U21 (Girls & Boys) — dates, times, venues and fixtures.",
      },
      { property: "og:title", content: "Hockey Liga 2026 — Match Schedule" },
      {
        property: "og:description",
        content: "Fixtures, venues and push-back times across the Women's, Premier and Youth U21 ligas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulePage,
});

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function SchedulePage() {
  const [div, setDiv] = useState<DivisionId>("women");
  const [date, setDate] = useState<string | null>(null);
  const dates = matchDates(div);
  const active = date && dates.includes(date) ? date : nextDate(div);
  const games = matchesOf(div).filter((m) => m.date === active);
  const leader = standings(div)[0];

  return (
    <PageShell
      eyebrow="Fixtures"
      title="Match Schedule"
      intro={`${SEASON.subtitle}. Choose a liga, then a match day.`}
    >
      <DivisionTabs value={div} onChange={(d) => { setDiv(d); setDate(null); }} />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Liga" value={divisionById(div).short} />
        <Stat label="Teams / games" value={`${teamsOf(div).length} · ${matchesOf(div).length}`} />
        <Stat label="Leader" value={leader && leader.gp > 0 ? leader.team.name : "—"} />
      </div>

      <div className="surface mt-8 overflow-x-auto p-3">
        <div className="flex gap-2">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setDate(d)}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                d === active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {fmtDate(d)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {games.map((m) => (
          <article key={m.id} className="surface flex flex-wrap items-center gap-4 p-4">
            <div className="w-32 shrink-0">
              <p className="font-display text-lg">{fmtDate(m.date)}</p>
              <p className="text-xs text-muted-foreground">{m.time} · {m.venue}</p>
            </div>
            <div className="flex flex-1 items-center gap-3 text-sm">
              <span className="flex-1 text-right font-semibold">{m.homeName}</span>
              {isPlayed(m) ? (
                <span className="score-num rounded-md bg-secondary px-3 py-1">
                  {m.homeGoals}–{m.awayGoals}
                </span>
              ) : (
                <span className="rounded-md border border-border px-3 py-2 font-display text-base text-muted-foreground">
                  {m.postponed ? "PP" : "VS"}
                </span>
              )}
              <span className="flex-1 font-semibold">{m.awayName}</span>
            </div>
            <div className="w-56 shrink-0 text-right text-xs text-muted-foreground">
              {m.note ?? (m.postponed ? "Postponed" : "")}
            </div>
          </article>
        ))}
        {games.length === 0 ? (
          <p className="text-sm text-muted-foreground">No games scheduled on this date.</p>
        ) : null}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {playedOf(div).length} of {matchesOf(div).length} games completed in this liga.
      </p>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}
