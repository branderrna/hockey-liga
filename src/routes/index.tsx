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
        <p className="label-eyebrow">{SEASON.name} · 2 Aug – 29 Nov</p>

        <h1 className="mt-6 text-2xl leading-[1.6] font-normal tracking-tight sm:text-4xl sm:leading-[1.6]">
          I play in{" "}
          <InlineSelect
            placeholder="which liga"
            value={divisionId}
            options={ligaOptions}
            onChange={(next) => setMyTeam({ divisionId: next as DivisionId, teamId: null })}
          />{" "}
          for{" "}
          <InlineSelect
            placeholder="which team"
            value={teamId}
            options={teamOptions}
            disabled={!divisionId}
            onChange={(next) => setMyTeam({ divisionId, teamId: next })}
          />
          !
        </h1>

        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            if (divisionId) navigate({ to: "/liga/$slug", params: { slug: divisionId } });
          }}
          className={`group mt-12 inline-flex items-center gap-2 border-b-2 pb-1 text-lg transition-colors sm:text-xl ${
            ready
              ? "border-foreground text-foreground"
              : "pointer-events-none border-transparent text-muted-foreground/50"
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
