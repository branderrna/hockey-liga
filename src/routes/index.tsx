import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LandingShell } from "@/components/site";
import { InlineSelect } from "@/components/my-team-picker";
import { SEASON, activeLigas, teamsOf, type DivisionId } from "@/data/league";
import { useMyTeam } from "@/lib/my-team";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hockey Liga 2026 — Schedules & League Tables" },
      {
        name: "description",
        content:
          "Pick your liga and team to see your schedule, scores and league table for the 2026 Hockey Liga season, played across Singapore from August to November.",
      },
      { property: "og:title", content: "Hockey Liga 2026 — Schedules & League Tables" },
      {
        property: "og:description",
        content: "Weekend schedules and standings across every 2026 Hockey Liga.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { divisionId, teamId, setMyTeam } = useMyTeam();
  const navigate = useNavigate();

  const ligaOptions = activeLigas.map((liga) => ({
    value: liga.divisionId,
    label: liga.name,
  }));
  const teamOptions = divisionId
    ? teamsOf(divisionId).map((team) => ({ value: team.id, label: team.name }))
    : [];

  const ready = !!divisionId && !!teamId;

  return (
    <LandingShell>
      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <p className="label-eyebrow">{SEASON.name}</p>

        <h1 className="mt-6 flex flex-col items-start gap-3 text-2xl leading-tight font-normal tracking-tight sm:gap-4 sm:text-4xl">
          <span>I play in</span>
          <InlineSelect
            placeholder="which liga"
            value={divisionId}
            options={ligaOptions}
            uppercase
            className="text-3xl sm:text-5xl"
            onChange={(next) => setMyTeam({ divisionId: next as DivisionId, teamId: null })}
          />
          <span>for</span>
          <InlineSelect
            placeholder="which team"
            value={teamId}
            options={teamOptions}
            disabled={!divisionId}
            className="text-3xl sm:text-5xl"
            onChange={(next) => setMyTeam({ divisionId, teamId: next })}
          />
        </h1>

        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            if (divisionId) navigate({ to: "/liga/$slug", params: { slug: divisionId } });
          }}
          className={`group mt-12 inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-base font-semibold transition-colors sm:text-lg ${
            ready
              ? "bg-primary text-primary-foreground"
              : "pointer-events-none bg-secondary text-muted-foreground/60"
          }`}
        >
          Proceed
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </button>

        <p className="mt-16 text-sm text-muted-foreground">
          Not listed?{" "}
          <Link
            to="/ligas"
            className="underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground hover:text-foreground"
          >
            Browse every liga
          </Link>
          .
        </p>
      </main>
    </LandingShell>
  );
}
