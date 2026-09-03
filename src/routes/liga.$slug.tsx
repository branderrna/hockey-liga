import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/site";
import {
  isPlayed,
  latestWeekendKey,
  ligaBySlug,
  matchesOf,
  playedOf,
  standings,
  teamsOf,
  weekendsOf,
  type DivisionId,
  type Liga,
  type NumberedMatch,
  type Weekend,
} from "@/data/league";

type View = "schedule" | "table";

export const Route = createFileRoute("/liga/$slug")({
  // Schedule is the default view, so it stays out of the URL entirely.
  validateSearch: (search: { view?: unknown }): { view?: View } =>
    search.view === "table" ? { view: "table" } : {},
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

function LigaPage() {
  const { slug } = Route.useParams();
  const { view = "schedule" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const liga = ligaBySlug(slug)!;

  if (liga.status === "upcoming") return <ComingSoon liga={liga} />;

  const divisionId = liga.divisionId;

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
            {(["schedule", "table"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() =>
                  navigate({ search: v === "table" ? { view: "table" } : {}, replace: true })
                }
                aria-pressed={view === v}
                className={`rounded-[3px] px-4 py-1.5 text-sm transition-colors duration-150 ${
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "table" ? "League table" : "Schedule"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-10">
        {view === "table" ? (
          <TableView divisionId={divisionId} />
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
    const el = strip?.querySelector<HTMLElement>(`[data-key="${activeKey}"]`);
    if (!strip || !el) return;
    const offset = el.getBoundingClientRect().left - strip.getBoundingClientRect().left;
    const left = strip.scrollLeft + offset - (strip.clientWidth - el.offsetWidth) / 2;
    strip.scrollTo({ left, behavior: "instant" });
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

function MatchRow({ match: m }: { match: NumberedMatch }) {
  return (
    <li className="border-b border-hairline transition-colors duration-150 hover:bg-secondary/70">
      <div className="grid grid-cols-[2.25rem_1fr] items-center gap-x-3 gap-y-2 px-1 py-3 sm:grid-cols-[2.25rem_3.25rem_1fr_5.5rem_1fr_7rem] sm:gap-x-4">
        <span className="meta-mono tabular-nums">{String(m.no).padStart(2, "0")}</span>

        <span className="meta-mono">
          {m.time}
          <span className="sm:hidden"> · {m.venue}</span>
        </span>

        <span className="col-span-2 grid grid-cols-[1fr_5.5rem_1fr] items-center gap-2 sm:contents">
          <span className="text-right text-sm leading-tight font-medium sm:truncate">
            {m.homeName}
          </span>
          <Score match={m} />
          <span className="text-sm leading-tight font-medium sm:truncate">{m.awayName}</span>
        </span>

        <span className="meta-mono hidden truncate text-right sm:block">{m.venue}</span>
      </div>

      {m.note ? (
        <p
          className={`px-1 pb-3 text-xs leading-snug sm:pl-[6.5rem] ${
            m.postponed ? "text-ot" : "text-muted-foreground"
          }`}
        >
          {m.note}
        </p>
      ) : null}
    </li>
  );
}

function Score({ match: m }: { match: NumberedMatch }) {
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
      <span className="meta-mono text-center font-medium text-ot" title="Postponed">
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

function TableView({ divisionId }: { divisionId: DivisionId }) {
  const rows = standings(divisionId);

  return (
    <div className="animate-rise">
      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="label-eyebrow py-2 pr-3 text-left font-normal">#</th>
              <th className="label-eyebrow py-2 pr-3 text-left font-normal">Team</th>
              {["GP", "W", "D", "L", "GF", "GA", "GD"].map((h) => (
                <th key={h} className="label-eyebrow w-11 py-2 text-center font-normal">
                  {h}
                </th>
              ))}
              <th className="label-eyebrow w-12 py-2 text-center font-normal">Pts</th>
              <th className="label-eyebrow w-28 py-2 pl-4 text-left font-normal">Form</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.team.id}
                className="border-b border-hairline transition-colors duration-150 last:border-0 hover:bg-secondary/70"
              >
                <td className="meta-mono py-3 pr-3 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td className="py-3 pr-3 font-medium">{r.team.name}</td>
                <td className="py-3 text-center tabular-nums text-muted-foreground">{r.gp}</td>
                <td className="py-3 text-center tabular-nums">{r.w}</td>
                <td className="py-3 text-center tabular-nums">{r.d}</td>
                <td className="py-3 text-center tabular-nums">{r.l}</td>
                <td className="py-3 text-center tabular-nums text-muted-foreground">{r.gf}</td>
                <td className="py-3 text-center tabular-nums text-muted-foreground">{r.ga}</td>
                <td className="py-3 text-center tabular-nums">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                <td className="py-3 text-center font-medium tabular-nums">{r.pts}</td>
                <td className="py-3 pl-4">
                  <span className="flex gap-1">
                    {r.form.map((f, idx) => (
                      <span
                        key={idx}
                        title={formLabel[f]}
                        className={`grid size-5 place-items-center rounded-sm border text-[10px] font-medium ${formColor[f]}`}
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
      </div>
      <p className="meta-mono mt-5">
        3 points for a win · 1 for a draw · sorted by points, then goal difference, then goals for
      </p>
    </div>
  );
}
