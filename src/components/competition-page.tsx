import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/site";
import {
  hasKnockoutOf,
  isLeagueRound,
  isPlayed,
  isReplayed,
  latestWeekendKey,
  matchesOf,
  pooledStandingsFor,
  tableRoundsOf,
  teamsOf,
  weekendsOf,
  type CompetitionDataset,
  type PoolStandings,
} from "@/data/competition";
import { formatFixtureRound } from "@/data/round";
import type { DivisionId, Liga, Match, Standing, Weekend } from "@/data/types";
import { KnockoutBracket } from "@/components/knockout-bracket";

export type CompetitionView = "schedule" | "table" | "my-team";

export type CompetitionDescriptor = Pick<Liga, "name" | "short" | "group"> & {
  divisionId: DivisionId;
};

const OPTIONAL_VIEWS: CompetitionView[] = ["table", "my-team"];
const VIEW_LABEL: Record<CompetitionView, string> = {
  schedule: "Schedule",
  table: "League table",
  "my-team": "My team",
};

export function CompetitionPage({
  seasonLabel,
  liga,
  dataset,
  teamId = null,
  view = "schedule",
  onViewChange,
  teamPicker,
  sourceIssues,
}: {
  seasonLabel: string;
  liga: CompetitionDescriptor;
  dataset: CompetitionDataset;
  teamId?: string | null;
  view?: CompetitionView;
  onViewChange?: (view: CompetitionView) => void;
  teamPicker?: ReactNode;
  /** Rows the source could not be read from, when the season is read live. */
  sourceIssues?: string[];
}) {
  const [localView, setLocalView] = useState<CompetitionView>(view);
  const divisionId = liga.divisionId;
  const divisionTeams = teamsOf(dataset, divisionId);
  const selectedTeamId = teamId && divisionTeams.some((team) => team.id === teamId) ? teamId : null;
  const views: CompetitionView[] = selectedTeamId
    ? ["schedule", "table", "my-team"]
    : ["schedule", "table"];
  const activeView = views.includes(view ?? localView) ? (view ?? localView) : "schedule";

  useEffect(() => {
    setLocalView(view);
  }, [view]);

  const changeView = (next: CompetitionView) => {
    setLocalView(next);
    onViewChange?.(next);
  };

  return (
    <AppShell>
      <div className="border-b border-hairline pb-7">
        <div className="mx-auto max-w-5xl px-5 pt-8 sm:px-8 lg:pt-12">
          <p className="label-eyebrow">
            {liga.group} · {seasonLabel}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl">{liga.name}</h1>
          <p className="meta-mono mt-2">
            {divisionTeams.length} teams · {matchesOf(dataset, divisionId).filter(isPlayed).length}{" "}
            of {matchesOf(dataset, divisionId).length} games played
          </p>

          {teamPicker ? <div className="mt-5 max-w-xs">{teamPicker}</div> : null}

          <div className="mt-7 inline-flex rounded-md border border-border p-0.5">
            {views.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeView(item)}
                aria-pressed={activeView === item}
                className={`rounded-[3px] px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-150 sm:px-4 ${
                  activeView === item
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {VIEW_LABEL[item]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-10">
        <SourceIssues issues={sourceIssues ?? []} />
        {activeView === "table" ? (
          <TableView dataset={dataset} divisionId={divisionId} teamId={selectedTeamId} />
        ) : activeView === "my-team" && selectedTeamId ? (
          <MyTeamView
            key={divisionId}
            dataset={dataset}
            divisionId={divisionId}
            teamId={selectedTeamId}
          />
        ) : (
          <ScheduleView
            key={divisionId}
            dataset={dataset}
            divisionId={divisionId}
            teamId={selectedTeamId}
          />
        )}
      </main>
    </AppShell>
  );
}

/**
 * What the season is missing, when it is read straight from the Sheet and a
 * row could not be read. A visitor needs the count, so a gap in the fixtures
 * is not mistaken for a game that never happened; whoever keeps the sheet
 * needs the rows, so it names them behind a summary rather than in the page.
 */
function SourceIssues({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null;
  return (
    <details className="mb-8 rounded-md border border-ot/40 bg-ot/5 px-4 py-3">
      <summary className="cursor-pointer text-sm">
        {issues.length === 1 ? "1 row" : `${issues.length} rows`} in the source could not be read,
        and {issues.length === 1 ? "is" : "are"} not shown here.
      </summary>
      <ul className="meta-mono mt-3 space-y-1 leading-relaxed">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </details>
  );
}

function fmtDayHeading(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function fmtShortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/* --------------------------------- schedule --------------------------------- */

function ScheduleView({
  dataset,
  divisionId,
  teamId,
}: {
  dataset: CompetitionDataset;
  divisionId: DivisionId;
  teamId: string | null;
}) {
  const weekends = weekendsOf(dataset, divisionId);
  const latestKey = latestWeekendKey(dataset, divisionId);
  const [activeKey, setActiveKey] = useState(latestKey ?? weekends[0]?.key ?? "");
  const stripRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const centre = () => {
      const el = strip.querySelector<HTMLElement>(`[data-key="${activeKey}"]`);
      if (!el) return;
      const offset = el.getBoundingClientRect().left - strip.getBoundingClientRect().left;
      const left = strip.scrollLeft + offset - (strip.clientWidth - el.offsetWidth) / 2;
      strip.scrollTo({ left, behavior: "instant" });
    };
    const observer = new ResizeObserver(centre);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [activeKey]);

  useEffect(() => {
    if (activeKey && weekends.some((weekend) => weekend.key === activeKey)) return;
    setActiveKey(latestKey ?? weekends[0]?.key ?? "");
  }, [activeKey, latestKey, weekends]);

  if (weekends.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No fixtures published for this liga yet.</p>
    );
  }

  const active = weekends.find((weekend) => weekend.key === activeKey) ?? weekends[0];
  if (!active) return null;
  const index = weekends.indexOf(active);
  const step = (direction: -1 | 1) => {
    const next = weekends[index + direction];
    if (next) setActiveKey(next.key);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <ArrowButton
          label="Previous weekend"
          disabled={index === 0}
          onClick={() => step(-1)}
          icon={<ChevronLeft className="size-4" />}
        />
        <div
          ref={stripRef}
          className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {weekends.map((weekend) => (
            <button
              key={weekend.key}
              type="button"
              data-key={weekend.key}
              onClick={() => setActiveKey(weekend.key)}
              aria-pressed={weekend.key === active.key}
              className={`shrink-0 rounded-md border px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-150 ${
                weekend.key === active.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {weekend.label}
            </button>
          ))}
        </div>
        <ArrowButton
          label="Next weekend"
          disabled={index === weekends.length - 1}
          onClick={() => step(1)}
          icon={<ChevronRight className="size-4" />}
        />
        {latestKey ? (
          <button
            type="button"
            onClick={() => setActiveKey(latestKey)}
            disabled={active.key === latestKey}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            Latest
          </button>
        ) : null}
      </div>

      <WeekendGames weekend={active} teamId={teamId} />
    </div>
  );
}

function ArrowButton({
  label,
  onClick,
  disabled,
  icon,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="hidden shrink-0 rounded-md border border-border p-2 text-muted-foreground transition-colors duration-150 hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-30 sm:block"
    >
      {icon}
    </button>
  );
}

function WeekendGames({ weekend, teamId }: { weekend: Weekend; teamId: string | null }) {
  const rounds = [
    ...new Set(
      weekend.matches
        .map((match) => match.round)
        .filter((round): round is string => !!round && isLeagueRound(round)),
    ),
  ];

  return (
    <div className="animate-rise mt-7">
      {rounds.length > 0 ? (
        <p className="label-eyebrow mb-7">
          {rounds.map((round) => formatFixtureRound(round)).join(" · ")}
        </p>
      ) : null}
      {weekend.dates.map((date) => {
        const games = weekend.matches.filter((match) => match.date === date);
        if (games.length === 0) return null;
        return (
          <section key={date} className="mt-9 first:mt-0">
            <h2 className="label-eyebrow border-b border-border pb-2">{fmtDayHeading(date)}</h2>
            <ul>
              {games.map((match) => (
                <MatchRow key={match.id} match={match} teamId={teamId} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** The visitor's own team reads as inverted text on a solid chip. */
function TeamName({ name, mine }: { name: string; mine: boolean }) {
  return mine ? (
    <span className="box-decoration-clone rounded-sm bg-primary px-1.5 py-0.5 font-semibold text-primary-foreground">
      {name}
    </span>
  ) : (
    <span className="font-medium">{name}</span>
  );
}

function MatchRow({
  match: m,
  teamId,
  showDate = false,
}: {
  match: Match;
  teamId: string | null;
  showDate?: boolean;
}) {
  const specificRound = m.round && !isLeagueRound(m.round) ? formatFixtureRound(m.round) : null;

  return (
    <li
      className={`border-b border-hairline transition-colors duration-150 hover:bg-secondary/70 ${
        isReplayed(m) ? "bg-ice/35" : ""
      } ${m.postponed ? "row-faded" : ""}`}
    >
      {specificRound ? (
        <p className="label-eyebrow px-1 pt-4 pb-1 text-center">{specificRound}</p>
      ) : null}
      <div
        className={`grid grid-cols-[2.25rem_1fr] items-center gap-x-3 gap-y-1.5 px-1 py-3 sm:gap-x-4 ${
          showDate
            ? "sm:grid-cols-[2.25rem_9.5rem_1fr_5.5rem_1fr_7rem]"
            : "sm:grid-cols-[2.25rem_3.25rem_1fr_5.5rem_1fr_7rem]"
        }`}
      >
        <span className="meta-mono tabular-nums">{String(m.no).padStart(2, "0")}</span>

        <span className="meta-mono">
          {showDate ? `${fmtShortDate(m.date)} · ` : ""}
          {m.time}
          <span className="sm:hidden"> · {m.venue}</span>
        </span>

        <span className="col-span-2 grid grid-cols-[1fr_5.5rem_1fr] items-center gap-2 sm:contents">
          <span className="text-right text-sm leading-tight">
            <TeamName name={m.homeName} mine={!!teamId && m.homeId === teamId} />
          </span>
          <Score match={m} />
          <span className="text-sm leading-tight">
            <TeamName name={m.awayName} mine={!!teamId && m.awayId === teamId} />
          </span>
        </span>

        <span className="meta-mono hidden truncate text-right sm:block">{m.venue}</span>

        {m.note ? (
          <p
            className={`col-span-2 text-center text-xs leading-snug sm:col-start-3 sm:col-end-6 ${
              m.postponed ? "text-ot" : "text-muted-foreground"
            }`}
          >
            {m.note}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function Score({ match: m }: { match: Match }) {
  if (isPlayed(m)) {
    const shootout =
      m.shootoutHomeGoals != null && m.shootoutAwayGoals != null
        ? `(${m.shootoutHomeGoals}–${m.shootoutAwayGoals})`
        : null;
    return (
      <span className="flex flex-col items-center text-center">
        <span className="score-num">
          {m.homeGoals}
          <span className="px-1.5 text-muted-foreground">–</span>
          {m.awayGoals}
        </span>
        {shootout ? <span className="meta-mono mt-0.5 text-ot">{shootout}</span> : null}
      </span>
    );
  }
  if (m.postponed) {
    return (
      <span
        className="text-center font-mono text-[0.6875rem] font-medium tracking-[0.04em] text-ot"
        title="Postponed"
      >
        PP
      </span>
    );
  }
  return <span className="meta-mono text-center opacity-60">v</span>;
}

/* ----------------------------------- table ---------------------------------- */

const formFill = {
  W: "bg-win/15 text-win-ink",
  D: "bg-ot/15 text-ot-ink",
  L: "bg-loss/15 text-loss-ink",
} as const;
const formLabel = { W: "Win", D: "Draw", L: "Loss" } as const;

const columns = [
  { key: "gp", label: "GP", onMobile: true, muted: true },
  { key: "w", label: "W", onMobile: false, muted: false },
  { key: "d", label: "D", onMobile: false, muted: false },
  { key: "l", label: "L", onMobile: false, muted: false },
  { key: "gf", label: "GF", onMobile: false, muted: true },
  { key: "ga", label: "GA", onMobile: false, muted: true },
  { key: "gd", label: "GD", onMobile: false, muted: false },
] as const;

const FORM_SLOTS = 5;
const MOBILE_FORM_SLOTS = 3;

function FormRun({ form }: { form: Standing["form"] }) {
  const mobileFrom = Math.max(0, form.length - MOBILE_FORM_SLOTS);

  return (
    <span className="flex gap-1">
      {Array.from({ length: FORM_SLOTS }, (_, index) => {
        const result = form[index];
        const onMobile = index >= mobileFrom && index < mobileFrom + MOBILE_FORM_SLOTS;
        return (
          <span
            key={index}
            title={result ? formLabel[result] : "Not played"}
            className={`size-5 place-items-center rounded-sm text-[10px] font-medium ${
              result ? formFill[result] : "border border-border"
            } ${onMobile ? "grid" : "hidden sm:grid"}`}
          >
            {result ?? ""}
          </span>
        );
      })}
    </span>
  );
}

type StandingEntry = { rank: number; row: Standing };

function StandingsTable({
  entries,
  teamId,
  compact = false,
}: {
  entries: StandingEntry[];
  teamId: string | null;
  compact?: boolean;
}) {
  return (
    <table className={`w-full text-sm ${compact ? "" : "sm:min-w-[640px]"}`}>
      <thead>
        <tr className="border-b border-border">
          <th className="label-eyebrow py-2 pr-3 text-left font-normal">#</th>
          <th className="label-eyebrow py-2 pr-3 text-left font-normal">Team</th>
          {columns.map((column) => (
            <th
              key={column.key}
              className={`label-eyebrow w-11 py-2 text-center font-normal ${
                column.onMobile ? "" : "hidden sm:table-cell"
              }`}
            >
              {column.label}
            </th>
          ))}
          <th className="label-eyebrow w-12 py-2 text-center font-normal">Pts</th>
          <th className="label-eyebrow w-20 py-2 pl-2 text-left font-normal sm:w-32 sm:pl-4">
            Form
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map(({ rank, row }) => (
          <tr
            key={row.team.id}
            className="border-b border-hairline transition-colors duration-150 last:border-b-0 hover:bg-secondary/70"
          >
            <td className="meta-mono py-3 pr-3 tabular-nums">{String(rank).padStart(2, "0")}</td>
            <td className="py-3 pr-3 leading-tight">
              <TeamName name={row.team.name} mine={!!teamId && row.team.id === teamId} />
            </td>
            {columns.map((column) => (
              <td
                key={column.key}
                className={`py-3 text-center tabular-nums ${column.muted ? "text-muted-foreground" : ""} ${
                  column.onMobile ? "" : "hidden sm:table-cell"
                }`}
              >
                {column.key === "gd" && row.gd > 0 ? `+${row.gd}` : row[column.key]}
              </td>
            ))}
            <td className="py-3 text-center font-medium tabular-nums">{row.pts}</td>
            <td className="py-3 pl-2 sm:pl-4">
              <FormRun form={row.form} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StandingsKey() {
  return (
    <div className="meta-mono mt-5 space-y-1.5 leading-relaxed">
      <p>W/D/L = 3/1/0 pts · Sorted Pts &gt; GD &gt; GF</p>
      <p>
        Form runs left to right, oldest to most recent —{" "}
        <span className="sm:hidden">last 3 games</span>
        <span className="hidden sm:inline">last 5 games</span>
        {" · empty = not played"}
      </p>
      <p className="sm:hidden">Rotate your phone for the full table</p>
    </div>
  );
}

/**
 * The knockout is the phase after the numbered rounds, so it is selected the
 * same way they are rather than living underneath the last one, where it read
 * as part of that round's table.
 */
const KNOCKOUT_PHASE = "knockout";

function RoundSwitcher({
  rounds,
  activeRound,
  onChange,
}: {
  rounds: string[];
  activeRound: string;
  onChange: (round: string) => void;
}) {
  if (rounds.length < 2) return null;
  const hasKnockout = rounds.includes(KNOCKOUT_PHASE);
  return (
    <div className="mb-5 flex items-center gap-3 overflow-x-auto">
      <span className="label-eyebrow shrink-0">{hasKnockout ? "Phase" : "Table round"}</span>
      <div className="inline-flex rounded-md border border-border p-0.5">
        {rounds.map((round) => (
          <button
            key={round}
            type="button"
            onClick={() => onChange(round)}
            aria-pressed={round === activeRound}
            className={`rounded-[3px] px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-150 ${
              round === activeRound
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {round === KNOCKOUT_PHASE ? "Knockout" : formatFixtureRound(round)}
          </button>
        ))}
      </div>
    </div>
  );
}

function useSelectedRound(rounds: string[]): [string, (round: string) => void] {
  const defaultRound = rounds[rounds.length - 1] ?? "";
  const [selectedRound, setSelectedRound] = useState(defaultRound);
  useEffect(() => {
    if (rounds.includes(selectedRound)) return;
    setSelectedRound(defaultRound);
  }, [defaultRound, rounds, selectedRound]);
  return [selectedRound, setSelectedRound];
}

const rankEntries = (group: PoolStandings): StandingEntry[] =>
  group.rows.map((row, index) => ({ rank: index + 1, row }));

/** A round played in separate pools gets one table per pool, each ranked 1..n. */
function PoolHeading({ group }: { group: PoolStandings }) {
  if (!group.pool) return null;
  return (
    <div className="mt-8 flex items-baseline justify-between gap-4 first:mt-0">
      <h3 className="label-eyebrow text-foreground">{group.pool.label}</h3>
      {group.pool.detail ? <p className="meta-mono">{group.pool.detail}</p> : null}
    </div>
  );
}

function TableView({
  dataset,
  divisionId,
  teamId,
}: {
  dataset: CompetitionDataset;
  divisionId: DivisionId;
  teamId: string | null;
}) {
  const rounds = tableRoundsOf(dataset, divisionId);
  // Selecting the knockout must not change which round the tables are for, so
  // the phase is tracked separately from the round it falls back to.
  const [selectedRound, setSelectedRound] = useSelectedRound(rounds);
  const [phase, setPhase] = useState<string | null>(null);
  const phases = hasKnockoutOf(dataset, divisionId) ? [...rounds, KNOCKOUT_PHASE] : rounds;
  const activePhase = phase && phases.includes(phase) ? phase : selectedRound;
  const groups = pooledStandingsFor(
    dataset,
    divisionId,
    rounds.length > 0 ? selectedRound : undefined,
  );

  const select = (next: string) => {
    setPhase(next);
    if (next !== KNOCKOUT_PHASE) setSelectedRound(next);
  };

  return (
    <div className="animate-rise">
      <RoundSwitcher rounds={phases} activeRound={activePhase} onChange={select} />
      {activePhase === KNOCKOUT_PHASE ? (
        <KnockoutBracket dataset={dataset} divisionId={divisionId} teamId={teamId} />
      ) : (
        <>
          {groups.map((group) => (
            <div key={group.pool?.key ?? "all"}>
              <PoolHeading group={group} />
              <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                <StandingsTable entries={rankEntries(group)} teamId={teamId} />
              </div>
            </div>
          ))}
          <StandingsKey />
        </>
      )}
    </div>
  );
}

/* ---------------------------------- my team --------------------------------- */

function MyTeamView({
  dataset,
  divisionId,
  teamId,
}: {
  dataset: CompetitionDataset;
  divisionId: DivisionId;
  teamId: string;
}) {
  const rounds = tableRoundsOf(dataset, divisionId);
  const [selectedRound, setSelectedRound] = useSelectedRound(rounds);
  const tableRound = rounds.length > 0 ? selectedRound : undefined;
  const groups = pooledStandingsFor(dataset, divisionId, tableRound);
  // In a pooled round the neighbours worth showing are the team's own pool.
  const group =
    groups.find((entry) => entry.rows.some((row) => row.team.id === teamId)) ?? groups[0];
  if (!group) return null;
  const table = rankEntries(group);
  const index = table.findIndex((entry) => entry.row.team.id === teamId);
  if (index === -1) return null;

  const from = Math.max(0, index - 1);
  const to = Math.min(table.length, index + 2);
  const excerpt = table.slice(from, to);
  const fixtures = matchesOf(dataset, divisionId).filter(
    (match) => match.homeId === teamId || match.awayId === teamId,
  );
  const played = fixtures.filter(isPlayed).length;
  const postponed = fixtures.filter((match) => match.postponed).length;

  return (
    <div className="animate-rise">
      <section>
        <h2 className="label-eyebrow border-b border-border pb-2">
          Standings{group.pool ? ` · ${group.pool.label}` : ""}
        </h2>
        <RoundSwitcher rounds={rounds} activeRound={selectedRound} onChange={setSelectedRound} />
        <div className="relative mt-1">
          <StandingsTable entries={excerpt} teamId={teamId} compact />
          {from > 0 ? (
            <div className="pointer-events-none absolute inset-x-0 top-8 h-10 bg-gradient-to-b from-background to-transparent" />
          ) : null}
          {to < table.length ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
          ) : null}
        </div>
      </section>

      {hasKnockoutOf(dataset, divisionId) ? (
        <KnockoutBracket dataset={dataset} divisionId={divisionId} teamId={teamId} compact />
      ) : null}

      <section className="mt-12">
        <h2 className="label-eyebrow border-b border-border pb-2">
          Fixtures · {played} played
          {postponed > 0 ? ` · ${postponed} postponed` : ""} · {fixtures.length} total
        </h2>
        <ul>
          {fixtures.map((match) => (
            <MatchRow key={match.id} match={match} teamId={teamId} showDate />
          ))}
        </ul>
        {fixtures.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No fixtures published for this team yet.
          </p>
        ) : null}
      </section>
    </div>
  );
}
