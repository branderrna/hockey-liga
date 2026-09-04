import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/site";
import { useMyTeam } from "@/lib/my-team";
import {
  isPlayed,
  isReplayed,
  latestWeekendKey,
  ligaBySlug,
  matchesOf,
  playedOf,
  standings,
  teamsOf,
  weekendsOf,
  type DivisionId,
  type Liga,
  type Match,
  type Standing,
  type Weekend,
} from "@/data/league";

type View = "schedule" | "table" | "my-team";

const OPTIONAL_VIEWS: View[] = ["table", "my-team"];

export const Route = createFileRoute("/liga/$slug")({
  // Schedule is the default view, so it stays out of the URL entirely.
  validateSearch: (search: { view?: unknown }): { view?: View } => {
    const view = OPTIONAL_VIEWS.find((v) => v === search.view);
    return view ? { view } : {};
  },
  beforeLoad: ({ params }) => {
    if (!ligaBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const liga = ligaBySlug(params.slug);
    const title = liga ? `${liga.name} — Hockey Liga 2026` : "Hockey Liga 2026";
    const description = liga
      ? `Schedule, scores and league table for the ${liga.name} in the 2026 Hockey Liga season.`
      : "Schedules and league tables for the 2026 Hockey Liga season.";
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

function fmtDayHeading(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const VIEW_LABEL: Record<View, string> = {
  schedule: "Schedule",
  table: "League table",
  "my-team": "My team",
};

function LigaPage() {
  const { slug } = Route.useParams();
  const { view = "schedule" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { teamId } = useMyTeam();
  const liga = ligaBySlug(slug)!;

  if (liga.status === "upcoming") return <ComingSoon liga={liga} />;

  const divisionId = liga.divisionId;

  // "My team" only means something in the liga the visitor's team plays in.
  const myTeam = teamId && teamsOf(divisionId).some((t) => t.id === teamId) ? teamId : null;
  const views: View[] = myTeam ? ["schedule", "table", "my-team"] : ["schedule", "table"];
  const active = views.includes(view) ? view : "schedule";

  return (
    <AppShell>
      <div className="border-b border-hairline pb-7">
        <div className="mx-auto max-w-5xl px-5 pt-8 sm:px-8 lg:pt-12">
          <p className="label-eyebrow">{liga.group} · Season 2026</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">{liga.name}</h1>
          <p className="meta-mono mt-2">
            {teamsOf(divisionId).length} teams · {playedOf(divisionId).length} of{" "}
            {matchesOf(divisionId).length} games played
          </p>

          <div className="mt-7 inline-flex rounded-md border border-border p-0.5">
            {views.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() =>
                  navigate({ search: v === "schedule" ? {} : { view: v }, replace: true })
                }
                aria-pressed={active === v}
                className={`rounded-[3px] px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-150 sm:px-4 ${
                  active === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {VIEW_LABEL[v]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-10">
        {active === "table" ? (
          <TableView divisionId={divisionId} />
        ) : active === "my-team" && myTeam ? (
          <MyTeamView key={slug} divisionId={divisionId} teamId={myTeam} />
        ) : (
          <ScheduleView key={slug} divisionId={divisionId} />
        )}
      </main>
    </AppShell>
  );
}

function ComingSoon({ liga }: { liga: Liga }) {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-14 sm:px-8 lg:py-20">
        <p className="label-eyebrow">{liga.group} · Coming soon</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">{liga.name}</h1>
        <div className="surface mt-8 max-w-xl p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            This liga has no fixtures on the site yet. Its schedule and table will appear here once
            the results are added, or when the next season starts.
          </p>
        </div>
      </main>
    </AppShell>
  );
}

/* --------------------------------- schedule --------------------------------- */

function ScheduleView({ divisionId }: { divisionId: DivisionId }) {
  const weekends = weekendsOf(divisionId);
  const latestKey = latestWeekendKey(divisionId);
  const [activeKey, setActiveKey] = useState(latestKey ?? weekends[0]?.key ?? "");
  const stripRef = useRef<HTMLDivElement>(null);

  // Keep the selected weekend centred in the strip, including on first paint.
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
    // The strip's width settles after stylesheets and webfonts land, and again
    // on resize, so re-centre whenever its box changes rather than only once.
    const observer = new ResizeObserver(centre);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [activeKey]);

  if (weekends.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No fixtures published for this liga yet.</p>
    );
  }

  const active = weekends.find((w) => w.key === activeKey) ?? weekends[0];
  if (!active) return null;
  const index = weekends.indexOf(active);
  const step = (dir: -1 | 1) => {
    const next = weekends[index + dir];
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
          {weekends.map((w) => (
            <button
              key={w.key}
              type="button"
              data-key={w.key}
              onClick={() => setActiveKey(w.key)}
              aria-pressed={w.key === active.key}
              className={`shrink-0 rounded-md border px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-150 ${
                w.key === active.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {w.label}
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

      <WeekendGames key={active.key} weekend={active} />
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

function WeekendGames({ weekend }: { weekend: Weekend }) {
  return (
    <div className="animate-rise mt-7">
      {weekend.dates.map((date) => {
        const games = weekend.matches.filter((m) => m.date === date);
        if (games.length === 0) return null;
        return (
          <section key={date} className="mt-9 first:mt-0">
            <h2 className="label-eyebrow border-b border-border pb-2">{fmtDayHeading(date)}</h2>
            <ul>
              {games.map((m) => (
                <MatchRow key={m.id} match={m} />
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

function fmtShortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function MatchRow({ match: m, showDate = false }: { match: Match; showDate?: boolean }) {
  const { teamId } = useMyTeam();

  return (
    <li
      className={`border-b border-hairline transition-colors duration-150 hover:bg-secondary/70 ${
        isReplayed(m) ? "bg-ice/35" : ""
      } ${m.postponed ? "row-faded" : ""}`}
    >
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
          {/* Names wrap rather than truncate — a clipped club name is worse than a taller row. */}
          <span className="text-right text-sm leading-tight">
            <TeamName name={m.homeName} mine={!!teamId && m.homeId === teamId} />
          </span>
          <Score match={m} />
          <span className="text-sm leading-tight">
            <TeamName name={m.awayName} mine={!!teamId && m.awayId === teamId} />
          </span>
        </span>

        <span className="meta-mono hidden truncate text-right sm:block">{m.venue}</span>

        {/* Spans the home/score/away columns so it centres on the score. */}
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
    return (
      <span className="score-num text-center">
        {m.homeGoals}
        <span className="px-1.5 text-muted-foreground">–</span>
        {m.awayGoals}
      </span>
    );
  }
  if (m.postponed) {
    return (
      // Same type as `meta-mono`, spelled out so the faded row does not
      // outrank the marker's own colour.
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

const formColor = {
  W: "border-win/40 text-win",
  D: "border-ot/40 text-ot",
  L: "border-loss/40 text-loss",
} as const;
const formLabel = { W: "Win", D: "Draw", L: "Loss" } as const;

/**
 * Standings columns. Narrow screens keep only the columns that carry the
 * story — played, points and form — so the table fits one screen width.
 */
const columns = [
  { key: "gp", label: "GP", onMobile: true, muted: true },
  { key: "w", label: "W", onMobile: false, muted: false },
  { key: "d", label: "D", onMobile: false, muted: false },
  { key: "l", label: "L", onMobile: false, muted: false },
  { key: "gf", label: "GF", onMobile: false, muted: true },
  { key: "ga", label: "GA", onMobile: false, muted: true },
  { key: "gd", label: "GD", onMobile: false, muted: false },
] as const;

const MOBILE_FORM_GAMES = 3;

type StandingEntry = { rank: number; row: Standing };

/** Shared by the full table and the excerpt on the My Team view. */
function StandingsTable({
  entries,
  teamId,
  compact = false,
}: {
  entries: StandingEntry[];
  teamId: string | null;
  /** Drop the wide-screen minimum so an excerpt fits without scrolling. */
  compact?: boolean;
}) {
  return (
    <table className={`w-full text-sm ${compact ? "" : "sm:min-w-[640px]"}`}>
      <thead>
        <tr className="border-b border-border">
          <th className="label-eyebrow py-2 pr-3 text-left font-normal">#</th>
          <th className="label-eyebrow py-2 pr-3 text-left font-normal">Team</th>
          {columns.map((c) => (
            <th
              key={c.key}
              className={`label-eyebrow w-11 py-2 text-center font-normal ${
                c.onMobile ? "" : "hidden sm:table-cell"
              }`}
            >
              {c.label}
            </th>
          ))}
          <th className="label-eyebrow w-12 py-2 text-center font-normal">Pts</th>
          <th className="label-eyebrow w-20 py-2 pl-2 text-left font-normal sm:w-28 sm:pl-4">
            Form
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map(({ rank, row: r }) => (
          <tr
            key={r.team.id}
            className="border-b border-hairline transition-colors duration-150 last:border-b-0 hover:bg-secondary/70"
          >
            <td className="meta-mono py-3 pr-3 tabular-nums">{String(rank).padStart(2, "0")}</td>
            <td className="py-3 pr-3 leading-tight">
              <TeamName name={r.team.name} mine={!!teamId && r.team.id === teamId} />
            </td>
            {columns.map((c) => (
              <td
                key={c.key}
                className={`py-3 text-center tabular-nums ${c.muted ? "text-muted-foreground" : ""} ${
                  c.onMobile ? "" : "hidden sm:table-cell"
                }`}
              >
                {c.key === "gd" && r.gd > 0 ? `+${r.gd}` : r[c.key]}
              </td>
            ))}
            <td className="py-3 text-center font-medium tabular-nums">{r.pts}</td>
            <td className="py-3 pl-2 sm:pl-4">
              <span className="flex gap-1">
                {r.form.map((f, idx) => (
                  <span
                    key={idx}
                    title={formLabel[f]}
                    className={`size-5 place-items-center rounded-sm border text-[10px] font-medium ${
                      formColor[f]
                    } ${idx < r.form.length - MOBILE_FORM_GAMES ? "hidden sm:grid" : "grid"}`}
                  >
                    {f}
                  </span>
                ))}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StandingsKey({ rotateHint = true }: { rotateHint?: boolean }) {
  return (
    <div className="meta-mono mt-5 space-y-1.5 leading-relaxed">
      <p>W/D/L = 3/1/0 pts · Sorted Pts &gt; GD &gt; GF</p>
      <p>
        Form runs left to right, oldest to most recent —{" "}
        <span className="sm:hidden">last 3 games</span>
        <span className="hidden sm:inline">last 5 games</span>
      </p>
      {rotateHint ? <p className="sm:hidden">Rotate your phone for the full table</p> : null}
    </div>
  );
}

function TableView({ divisionId }: { divisionId: DivisionId }) {
  const { teamId } = useMyTeam();
  const entries = standings(divisionId).map((row, i) => ({ rank: i + 1, row }));

  return (
    <div className="animate-rise">
      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <StandingsTable entries={entries} teamId={teamId} />
      </div>
      <StandingsKey />
    </div>
  );
}

/* ---------------------------------- my team --------------------------------- */

function MyTeamView({ divisionId, teamId }: { divisionId: DivisionId; teamId: string }) {
  const table = standings(divisionId).map((row, i) => ({ rank: i + 1, row }));
  const index = table.findIndex((e) => e.row.team.id === teamId);
  if (index === -1) return null;

  // One place either side, so the excerpt shows who is being chased and chasing.
  const from = Math.max(0, index - 1);
  const to = Math.min(table.length, index + 2);
  const excerpt = table.slice(from, to);
  const fixtures = matchesOf(divisionId).filter((m) => m.homeId === teamId || m.awayId === teamId);
  const played = fixtures.filter(isPlayed).length;
  const postponed = fixtures.filter((m) => m.postponed).length;

  return (
    <div className="animate-rise">
      <section>
        <h2 className="label-eyebrow border-b border-border pb-2">Standings</h2>
        <div className="relative mt-1">
          <StandingsTable entries={excerpt} teamId={teamId} compact />
          {/* Fades imply the rest of the table above and below the excerpt. */}
          {from > 0 ? (
            <div className="pointer-events-none absolute inset-x-0 top-8 h-10 bg-gradient-to-b from-background to-transparent" />
          ) : null}
          {to < table.length ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
          ) : null}
        </div>
        <StandingsKey rotateHint={false} />
      </section>

      <section className="mt-12">
        <h2 className="label-eyebrow border-b border-border pb-2">
          Fixtures · {played} played
          {postponed > 0 ? ` · ${postponed} postponed` : ""} · {fixtures.length} total
        </h2>
        <ul>
          {fixtures.map((m) => (
            <MatchRow key={m.id} match={m} showDate />
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
