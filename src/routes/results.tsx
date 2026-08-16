import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site";
import { DivisionTabs } from "@/components/division-tabs";
import { divisionById, playedOf, teamsOf, type DivisionId, type Match } from "@/data/league";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Results — Hockey Liga 2026 Scores" },
      {
        name: "description",
        content:
          "Completed games and final scores across the Women's, Premier and Youth U21 Hockey Ligas 2026, grouped by match day.",
      },
      { property: "og:title", content: "Results — Hockey Liga 2026" },
      {
        property: "og:description",
        content: "Final scores from every played game in the three concurrent 2026 hockey ligas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultsPage,
});

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ResultsPage() {
  const [div, setDiv] = useState<DivisionId>("premier");
  const [teamFilter, setTeamFilter] = useState("all");
  const list = [...playedOf(div)].reverse();
  const filtered =
    teamFilter === "all"
      ? list
      : list.filter((m) => m.homeId === teamFilter || m.awayId === teamFilter);

  const byDate = new Map<string, Match[]>();
  for (const m of filtered) {
    byDate.set(m.date, [...(byDate.get(m.date) ?? []), m]);
  }

  return (
    <PageShell
      eyebrow="Final scores"
      title="Results"
      intro="Most recent games first. Postponed games appear on the schedule until they are replayed."
    >
      <DivisionTabs value={div} onChange={(d) => { setDiv(d); setTeamFilter("all"); }} />

      <div className="surface mt-8 flex flex-wrap items-center gap-3 p-4">
        <label htmlFor="team" className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {divisionById(div).short} · filter by team
        </label>
        <select
          id="team"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
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

      <div className="mt-8 space-y-8">
        {[...byDate.entries()].map(([date, games]) => (
          <section key={date}>
            <h2 className="text-2xl">{fmtDate(date)}</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {games.map((m) => {
                const homeWon = (m.homeGoals ?? 0) > (m.awayGoals ?? 0);
                const draw = m.homeGoals === m.awayGoals;
                return (
                  <article key={m.id} className="surface p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{m.time} · {m.venue}</span>
                      <span>{divisionById(m.divisionId).short}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <ScoreRow name={m.homeName} goals={m.homeGoals ?? 0} winner={!draw && homeWon} />
                      <ScoreRow name={m.awayName} goals={m.awayGoals ?? 0} winner={!draw && !homeWon} />
                    </div>
                    {m.note ? <p className="mt-3 text-xs text-muted-foreground">{m.note}</p> : null}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed games yet for this selection.</p>
        ) : null}
      </div>
    </PageShell>
  );
}

function ScoreRow({ name, goals, winner }: { name: string; goals: number; winner: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={winner ? "font-semibold" : "text-muted-foreground"}>{name}</span>
      <span className={`score-num ${winner ? "text-primary" : "text-muted-foreground"}`}>
        {goals}
      </span>
    </div>
  );
}
