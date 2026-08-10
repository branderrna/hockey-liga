import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site";
import {
  matches,
  weeks,
  currentWeek,
  teamById,
  isPlayed,
  SEASON,
  standings,
} from "@/data/league";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Northern Ice Cup — Weekly Hockey Schedule 2026" },
      {
        name: "description",
        content:
          "Fixtures for every week of the six-month Northern Ice Cup hockey tournament: dates, face-off times, venues and matchups.",
      },
      { property: "og:title", content: "Northern Ice Cup — Weekly Hockey Schedule" },
      {
        property: "og:description",
        content: "Browse all 24 weeks of Northern Ice Cup fixtures, venues and face-off times.",
      },
    ],
  }),
  component: SchedulePage,
});

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function SchedulePage() {
  const [week, setWeek] = useState(currentWeek);
  const games = matches.filter((m) => m.week === week);
  const table = standings();
  const leader = table[0];

  return (
    <PageShell
      eyebrow="Week by week"
      title="Hockey Schedule"
      intro={`${SEASON.subtitle}. Pick a week to see face-off times, venues and matchups.`}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Current week" value={`Week ${currentWeek} of ${weeks.length}`} />
        <Stat label="Games played" value={`${matches.filter(isPlayed).length}`} />
        <Stat label="League leader" value={leader ? leader.team.name : "—"} />
      </div>

      <div className="surface mt-8 overflow-x-auto p-3">
        <div className="flex gap-2">
          {weeks.map((w) => (
            <button
              key={w}
              onClick={() => setWeek(w)}
              className={`shrink-0 rounded-md px-3 py-2 font-display text-lg tracking-wide transition-colors ${
                w === week
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              W{w}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {games.map((m) => {
          const home = teamById(m.homeId);
          const away = teamById(m.awayId);
          const played = isPlayed(m);
          return (
            <article key={m.id} className="surface flex flex-wrap items-center gap-4 p-4">
              <div className="w-32 shrink-0">
                <p className="font-display text-lg">{fmtDate(m.date)}</p>
                <p className="text-xs text-muted-foreground">{m.time} · face-off</p>
              </div>
              <div className="flex flex-1 items-center gap-3 text-sm">
                <span className="flex-1 text-right font-semibold">{home.name}</span>
                {played ? (
                  <span className="score-num rounded-md bg-secondary px-3 py-1">
                    {m.homeGoals}–{m.awayGoals}
                  </span>
                ) : (
                  <span className="rounded-md border border-border px-3 py-2 font-display text-base text-muted-foreground">
                    VS
                  </span>
                )}
                <span className="flex-1 font-semibold">{away.name}</span>
              </div>
              <div className="w-44 shrink-0 text-right text-xs text-muted-foreground">
                {m.venue}
                {m.overtime ? <span className="ml-2 text-ot">OT</span> : null}
              </div>
            </article>
          );
        })}
      </div>
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
