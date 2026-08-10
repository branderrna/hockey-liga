import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site";
import { playedMatches, teamById } from "@/data/league";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Results — Northern Ice Cup Scores by Week" },
      {
        name: "description",
        content:
          "Every completed Northern Ice Cup game: final scores, overtime results and venues, grouped week by week.",
      },
      { property: "og:title", content: "Results — Northern Ice Cup Scores" },
      {
        property: "og:description",
        content: "Final scores from all played games of the Northern Ice Cup hockey tournament.",
      },
    ],
  }),
  component: ResultsPage,
});

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function ResultsPage() {
  const [teamFilter, setTeamFilter] = useState("all");
  const list = [...playedMatches].reverse();
  const filtered =
    teamFilter === "all"
      ? list
      : list.filter((m) => m.homeId === teamFilter || m.awayId === teamFilter);

  const byWeek = new Map<number, typeof filtered>();
  for (const m of filtered) {
    byWeek.set(m.week, [...(byWeek.get(m.week) ?? []), m]);
  }

  const teamOptions = [...new Set(playedMatches.flatMap((m) => [m.homeId, m.awayId]))].map(
    teamById,
  );

  return (
    <PageShell
      eyebrow="Final scores"
      title="Results"
      intro="Most recent games first. Games decided in overtime are marked OT."
    >
      <div className="surface flex flex-wrap items-center gap-3 p-4">
        <label htmlFor="team" className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Filter by team
        </label>
        <select
          id="team"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="rounded-md border border-border bg-secondary px-3 py-2 text-sm"
        >
          <option value="all">All teams</option>
          {teamOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 space-y-8">
        {[...byWeek.entries()].map(([week, games]) => (
          <section key={week}>
            <h2 className="text-2xl">Week {week}</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {games.map((m) => {
                const home = teamById(m.homeId);
                const away = teamById(m.awayId);
                const homeWon = (m.homeGoals ?? 0) > (m.awayGoals ?? 0);
                return (
                  <article key={m.id} className="surface p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{fmtDate(m.date)} · {m.time}</span>
                      <span>{m.overtime ? <span className="text-ot">Overtime</span> : "Regulation"}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <ScoreRow name={home.name} goals={m.homeGoals ?? 0} winner={homeWon} />
                      <ScoreRow name={away.name} goals={m.awayGoals ?? 0} winner={!homeWon} />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{m.venue}</p>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
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
