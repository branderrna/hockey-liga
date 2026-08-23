import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      { title: "Hockey Liga 2026 — Fixtures & Results" },
      {
        name: "description",
        content:
          "Fixtures and results for the three concurrent 2026 Hockey Ligas: Women's, Premier and Youth U21 — dates, times, venues and final scores.",
      },
      { property: "og:title", content: "Hockey Liga 2026 — Fixtures & Results" },
      {
        property: "og:description",
        content:
          "Fixtures, venues, push-back times and scores across the Women's, Premier and Youth U21 ligas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FixturesPage,
});

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function FixturesPage() {
  const [div, setDiv] = useState<DivisionId>("women");
  const [date, setDate] = useState<string | null>(null);
  const [team, setTeam] = useState("all");
  const dateScrollerRef = useRef<HTMLDivElement>(null);
  const scrollDates = (dir: -1 | 1) => {
    dateScrollerRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  };
  const dates = matchDates(div);
  const active = date === "all" ? "all" : date && dates.includes(date) ? date : nextDate(div);
  const games = matchesOf(div)
    .filter((m) => active === "all" || m.date === active)
    .filter((m) => team === "all" || m.homeId === team || m.awayId === team);
  const leader = standings(div)[0];

  return (
    <PageShell eyebrow="Fixtures & Results" title="Fixtures & Results">
      <DivisionTabs
        value={div}
        onChange={(d) => {
          setDiv(d);
          setDate(null);
          setTeam("all");
        }}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Liga" value={divisionById(div).short} />
        <Stat label="Teams / games" value={`${teamsOf(div).length} · ${matchesOf(div).length}`} />
        <Stat label="Leader" value={leader && leader.gp > 0 ? leader.team.name : "—"} />
      </div>

      <div className="surface mt-8 flex flex-wrap items-center gap-3 p-4">
        <label htmlFor="team" className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Filter by team
        </label>
        <select
          id="team"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="rounded-md border border-border bg-secondary px-3 py-2 text-sm"
        >
          <option value="all">All teams</option>
          {teamsOf(div).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => scrollDates(-1)}
          aria-label="Scroll to earlier dates"
          className="surface hidden shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground sm:block"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div ref={dateScrollerRef} className="surface min-w-0 flex-1 overflow-x-auto p-3">
          <div className="flex gap-2">
            <button
              onClick={() => setDate("all")}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                active === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              All dates
            </button>
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
        <button
          onClick={() => scrollDates(1)}
          aria-label="Scroll to later dates"
          className="surface hidden shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground sm:block"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-6 grid gap-3">
        {games.map((m) => (
          <article
            key={m.id}
            className={`surface grid grid-cols-1 gap-3 p-4 sm:grid-cols-[7rem_1fr_auto_1fr_12rem] sm:items-center sm:gap-4 ${m.postponed ? "border-l-2 border-ot/60" : ""}`}
          >
            <div>
              <p className="font-display text-lg">{fmtDate(m.date)}</p>
              <p className="text-xs text-muted-foreground">
                {m.time} · {m.venue}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 sm:contents">
              <span className="flex-1 text-center text-sm font-semibold sm:flex-none">
                {m.homeName}
              </span>
              {isPlayed(m) ? (
                <span className="score-num shrink-0 rounded-md bg-secondary px-3 py-1 sm:justify-self-center">
                  {m.homeGoals}–{m.awayGoals}
                </span>
              ) : m.postponed ? (
                <span className="shrink-0 rounded-full bg-ot/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-ot sm:justify-self-center">
                  PP
                </span>
              ) : (
                <span className="shrink-0 rounded-md border border-border px-3 py-2 font-display text-base text-muted-foreground sm:justify-self-center">
                  VS
                </span>
              )}
              <span className="flex-1 text-center text-sm font-semibold sm:flex-none">
                {m.awayName}
              </span>
            </div>
            <div className="text-center text-xs sm:text-right">
              {m.postponed && m.note ? (
                <span className="text-ot">↻ {m.note}</span>
              ) : (
                <span className="text-muted-foreground">{m.note ?? ""}</span>
              )}
            </div>
          </article>
        ))}
        {games.length === 0 ? (
          <p className="text-sm text-muted-foreground">No games match this selection.</p>
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
