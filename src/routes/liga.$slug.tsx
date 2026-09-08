import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/site";
import { CompetitionPage, type CompetitionView } from "@/components/competition-page";
import { InlineSelect } from "@/components/my-team-picker";
import { getArchivedDataset } from "@/data/archive-loader";
import { ARCHIVE_SEASON, archivedLigaBySlug } from "@/data/archive";
import { teamsOf as datasetTeamsOf, type CompetitionDataset } from "@/data/competition";
import { useMyTeam } from "@/lib/my-team";
import { ligaBySlug, matches, teams, teamsOf } from "@/data/league";

const OPTIONAL_VIEWS: CompetitionView[] = ["table", "my-team"];

export const Route = createFileRoute("/liga/$slug")({
  // Schedule is the default view, so it stays out of the URL entirely.
  validateSearch: (search: {
    view?: unknown;
    team?: unknown;
  }): {
    view?: CompetitionView;
    team?: string;
  } => {
    const view = OPTIONAL_VIEWS.find((item) => item === search.view);
    const team = typeof search.team === "string" && search.team ? search.team : undefined;
    return { ...(view ? { view } : {}), ...(team ? { team } : {}) };
  },
  beforeLoad: ({ params }) => {
    if (!ligaBySlug(params.slug) && !archivedLigaBySlug(params.slug)) throw notFound();
  },
  loader: ({ params }) => (archivedLigaBySlug(params.slug) ? getArchivedDataset() : null),
  head: ({ params }) => {
    const liga = ligaBySlug(params.slug) ?? archivedLigaBySlug(params.slug);
    const seasonLabel = archivedLigaBySlug(params.slug) ? ARCHIVE_SEASON.label : "2026";
    const title = liga ? `${liga.name} — Hockey Liga ${seasonLabel}` : `Hockey Liga ${seasonLabel}`;
    const description = liga
      ? `Schedule, scores and league table for the ${liga.name} in the ${seasonLabel} Hockey Liga season.`
      : `Schedules and league tables for the ${seasonLabel} Hockey Liga season.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: LigaPage,
});

function LigaPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const archiveParse = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const { teamId: currentTeamId } = useMyTeam();
  const archiveLiga = archivedLigaBySlug(slug);
  const currentLiga = ligaBySlug(slug);

  if (archiveLiga) {
    if (!archiveParse) return <ArchiveLoadError />;
    return (
      <ArchivedLigaPage
        dataset={archiveParse.dataset}
        issues={archiveParse.issues}
        teamId={search.team ?? null}
        {...(search.view ? { view: search.view } : {})}
        liga={archiveLiga}
        onTeamChange={(teamId) =>
          navigate({
            search: {
              ...(search.view ? { view: search.view } : {}),
              ...(teamId ? { team: teamId } : {}),
            },
            replace: true,
          })
        }
        onViewChange={(next) =>
          navigate({
            search: {
              ...(next === "schedule" ? {} : { view: next }),
              ...(search.team ? { team: search.team } : {}),
            },
            replace: true,
          })
        }
      />
    );
  }

  if (!currentLiga) return null;
  const myTeam =
    currentTeamId && teamsOf(currentLiga.divisionId).some((team) => team.id === currentTeamId)
      ? currentTeamId
      : null;

  return (
    <CompetitionPage
      seasonLabel="Season 2026"
      liga={currentLiga}
      dataset={{ teams, matches }}
      teamId={myTeam}
      {...(search.view ? { view: search.view } : {})}
      onViewChange={(next) =>
        navigate({ search: next === "schedule" ? {} : { view: next }, replace: true })
      }
    />
  );
}

function ArchivedLigaPage({
  dataset,
  issues,
  teamId,
  view,
  liga,
  onTeamChange,
  onViewChange,
}: {
  dataset: CompetitionDataset;
  issues: string[];
  teamId: string | null;
  view?: CompetitionView;
  liga: NonNullable<ReturnType<typeof archivedLigaBySlug>>;
  onTeamChange: (teamId: string) => void;
  onViewChange: (view: CompetitionView) => void;
}) {
  const archiveTeams = datasetTeamsOf(dataset, liga.divisionId);
  const selectedTeamId = archiveTeams.some((team) => team.id === teamId) ? teamId : null;

  return (
    <CompetitionPage
      seasonLabel={ARCHIVE_SEASON.label}
      liga={liga}
      dataset={dataset}
      sourceIssues={issues}
      teamId={selectedTeamId}
      {...(view ? { view } : {})}
      onViewChange={onViewChange}
      teamPicker={
        <div className="meta-mono leading-snug">
          View as{" "}
          <InlineSelect
            variant="quiet"
            placeholder="select team"
            value={selectedTeamId}
            options={archiveTeams.map((team) => ({ value: team.id, label: team.name }))}
            onChange={onTeamChange}
          />
        </div>
      }
    />
  );
}

function ArchiveLoadError() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-14 sm:px-8 lg:py-20">
        <p className="label-eyebrow">Completed liga</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Results unavailable</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          The completed-season source could not be loaded. Try refreshing the page.
        </p>
      </main>
    </AppShell>
  );
}
