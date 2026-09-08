import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { formatFixtureRound } from "@/data/round";
import {
  bracketsOf,
  isPlayed,
  knockoutMatchesOf,
  knockoutStage,
  type Bracket,
  type BracketSlot,
  type CompetitionDataset,
} from "@/data/competition";
import type { DivisionId, Match } from "@/data/types";

export function KnockoutBracket({
  dataset,
  divisionId,
  teamId = null,
  compact = false,
}: {
  dataset: CompetitionDataset;
  divisionId: DivisionId;
  teamId?: string | null;
  /** My Team uses the selected team's path instead of the full bracket. */
  compact?: boolean;
}) {
  const matches = knockoutMatchesOf(dataset, divisionId);
  if (matches.length === 0) return null;

  if (compact) {
    if (!teamId) return null;
    const teamMatches = matches.filter(
      (match) => match.homeId === teamId || match.awayId === teamId,
    );
    return <CompactBracket matches={teamMatches} teamId={teamId} />;
  }

  const brackets = bracketsOf(dataset, divisionId);
  if (brackets.length === 0) return null;

  return (
    // The phase switcher above already names this, so the region carries its
    // label for assistive tech rather than repeating it on screen.
    <section aria-label="Knockout bracket">
      <div className="flex items-baseline justify-end border-b border-border pb-2">
        <p className="meta-mono hidden sm:block">Lines follow the winner</p>
      </div>
      {brackets.map((bracket) => (
        <BracketChart key={bracket.key} bracket={bracket} teamId={teamId} />
      ))}
    </section>
  );
}

function columnAt(scroller: HTMLDivElement, index: number): HTMLElement | undefined {
  return scroller.querySelectorAll<HTMLElement>(".knockout-column")[index];
}

/**
 * Where a column comes to rest: the chart's left edge, plus the inset the
 * stylesheet reserves for its fade. Without it the column sits under the
 * gradient and its cards read as cut off down one side.
 */
function stageAnchor(scroller: HTMLDivElement): number {
  const inset = parseFloat(getComputedStyle(scroller).scrollPaddingLeft);
  return scroller.getBoundingClientRect().left + (Number.isFinite(inset) ? inset : 0);
}

/** Brings a column to the left of its chart, however wide the columns are. */
function scrollToColumn(scroller: HTMLDivElement, index: number, behavior: ScrollBehavior) {
  const column = columnAt(scroller, index);
  if (!column) return;
  const delta = column.getBoundingClientRect().left - stageAnchor(scroller);
  scroller.scrollTo({ left: scroller.scrollLeft + delta, behavior });
}

function BracketChart({ bracket, teamId }: { bracket: Bracket; teamId: string | null }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const opened = useRef(false);
  const [edges, setEdges] = useState({ start: false, end: false });

  const first = Math.max(
    0,
    bracket.columns.findIndex((column) => column.slots.length > 0),
  );

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const measure = () => {
      const overflow = scroller.scrollWidth - scroller.clientWidth;
      // Compared before storing, so scrolling only re-renders when a fade
      // a reader can see has actually turned on or off.
      const start = scroller.scrollLeft > 1;
      const end = scroller.scrollLeft < overflow - 1;
      setEdges((was) => (was.start === start && was.end === end ? was : { start, end }));

      // A chart that starts at a later stage opens on it. Its leading columns
      // are empty by design, and on a phone they are a screen of nothing.
      if (!opened.current && overflow > 1) {
        opened.current = true;
        scrollToColumn(scroller, first, "instant");
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    scroller.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", measure);
    };
  }, [first]);

  return (
    <figure className="knockout-chart">
      <figcaption className="label-eyebrow knockout-chart-title">{bracket.title}</figcaption>

      <div
        className="knockout-viewport"
        {...(edges.start ? { "data-start": "" } : {})}
        {...(edges.end ? { "data-end": "" } : {})}
      >
        <div
          ref={scrollRef}
          className="knockout-scroll"
          role="region"
          aria-label={`${bracket.title} bracket`}
          tabIndex={0}
        >
          <div
            className="knockout-bracket"
            style={{ "--knockout-rows": bracket.rows } as CSSProperties}
          >
            {bracket.columns.map((column, index) => (
              // The heading box is always present, empty columns included, so
              // every column's first row starts at the same height.
              <div
                key={`${index}-${column.title}`}
                className="knockout-column"
                {...(column.slots.length === 0 ? { "data-empty": "" } : {})}
              >
                <div className="knockout-column-head">
                  {column.title ? <h3 className="label-eyebrow">{column.title}</h3> : null}
                </div>
                <div className="knockout-column-body">
                  {column.slots.map((slot) => (
                    <BracketSlotCard key={slot.match.id} slot={slot} teamId={teamId} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Games this bracket settled that sit on no path through it. Under the
          chart rather than in it, so they cost no row the other columns would
          have to leave blank. */}
      {bracket.extras.length > 0 ? (
        <div className="knockout-extras">
          {bracket.extras.map((slot) => (
            <BracketMatch key={slot.match.id} slot={slot} teamId={teamId} />
          ))}
        </div>
      ) : null}
    </figure>
  );
}

function BracketSlotCard({ slot, teamId }: { slot: BracketSlot; teamId: string | null }) {
  const style: CSSProperties = { gridRow: `${slot.row + 1} / span ${slot.span}` };
  if (slot.join) {
    Object.assign(style, {
      "--knockout-join-from": `${slot.join.from}%`,
      "--knockout-join-to": `${slot.join.to}%`,
    });
  }

  return (
    <div
      className="knockout-slot"
      style={style}
      {...(slot.join && slot.feedsIn > 1 ? { "data-join": "" } : {})}
    >
      <BracketMatch slot={slot} teamId={teamId} />
    </div>
  );
}

/** Where a card's sides came from, when no line into the card says it. */
const ROUTE_NOTE = /\bvs?\b|winner|loser/i;

function routeNote(slot: BracketSlot): string | null {
  if (slot.feedsIn > 1) return null;
  const note = slot.match.note?.trim();
  return note && ROUTE_NOTE.test(note) ? note : null;
}

function BracketMatch({ slot, teamId }: { slot: BracketSlot; teamId: string | null }) {
  const match = slot.match;
  const winner = winnerForDisplay(match);
  const note = routeNote(slot);
  const emphasis = slot.attached
    ? "knockout-match-attached"
    : knockoutStage(match.round) === "final"
      ? "knockout-match-final"
      : "";

  return (
    <article
      className={`knockout-match ${emphasis}`}
      {...(slot.advances ? { "data-advances": "" } : {})}
      {...(slot.join && slot.feedsIn > 0 ? { "data-fed": "" } : {})}
    >
      <p className="knockout-match-round">{formatFixtureRound(match.round ?? "")}</p>
      <div className={`knockout-team ${winner === match.homeId ? "knockout-team-winner" : ""}`}>
        <span className={teamId && match.homeId === teamId ? "knockout-team-mine" : ""}>
          {match.homeName}
        </span>
        <BracketScore match={match} side="home" />
      </div>
      <div className={`knockout-team ${winner === match.awayId ? "knockout-team-winner" : ""}`}>
        <span className={teamId && match.awayId === teamId ? "knockout-team-mine" : ""}>
          {match.awayName}
        </span>
        <BracketScore match={match} side="away" />
      </div>
      {note ? <p className="knockout-match-note">{note}</p> : null}
    </article>
  );
}

/**
 * The shootout result sits beside each side's score rather than on a line of
 * its own. It costs the card no height, and it says which of the two won the
 * shootout instead of leaving the reader to pair up a bracketed scoreline.
 */
function BracketScore({ match, side }: { match: Match; side: "home" | "away" }) {
  if (!isPlayed(match)) return <span className="meta-mono">{match.postponed ? "PP" : "—"}</span>;
  const shootout = side === "home" ? match.shootoutHomeGoals : match.shootoutAwayGoals;
  const paired = match.shootoutHomeGoals != null && match.shootoutAwayGoals != null;
  return (
    <span className="shrink-0 font-mono tabular-nums">
      {side === "home" ? match.homeGoals : match.awayGoals}
      {paired ? <span className="knockout-shootout">({shootout})</span> : null}
    </span>
  );
}

function winnerForDisplay(match: Match): string | null {
  if (!isPlayed(match) || !match.homeId || !match.awayId) return null;
  if (match.homeGoals! > match.awayGoals!) return match.homeId;
  if (match.awayGoals! > match.homeGoals!) return match.awayId;
  if (
    match.shootoutHomeGoals != null &&
    match.shootoutAwayGoals != null &&
    match.shootoutHomeGoals !== match.shootoutAwayGoals
  ) {
    return match.shootoutHomeGoals > match.shootoutAwayGoals ? match.homeId : match.awayId;
  }
  return null;
}

/**
 * The selected team's run through the knockout, read from their side: the
 * opponent rather than both names, and their own score first. Naming the team
 * on every row of their own page says nothing, and once the row reads "v
 * someone" the scoreline has to be theirs first or it reports the wrong result
 * whenever they played away.
 */
function CompactBracket({ matches, teamId }: { matches: Match[]; teamId: string }) {
  if (matches.length === 0) return null;
  return (
    <section className="mt-12" aria-labelledby="my-team-knockout-heading">
      <h2 id="my-team-knockout-heading" className="label-eyebrow border-b border-border pb-2">
        Knockout run
      </h2>
      {/* One grid for the whole run, so the opponents line up under each other
          rather than each row sizing its own stage column. The roles are
          explicit because `display: contents` on a list item drops list
          semantics in older browsers. */}
      <ol className="knockout-compact-run mt-3" role="list">
        {matches.map((match) => (
          <li key={match.id} className="knockout-compact-match" role="listitem">
            <span className="knockout-compact-round">{formatFixtureRound(match.round ?? "")}</span>
            <span className="knockout-compact-opponent text-sm">
              <span className="text-muted-foreground">v</span>{" "}
              {match.homeId === teamId ? match.awayName : match.homeName}
            </span>
            <CompactScore match={match} teamId={teamId} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function CompactScore({ match, teamId }: { match: Match; teamId: string }) {
  if (!isPlayed(match)) return <span className="meta-mono">{match.postponed ? "PP" : "—"}</span>;
  const home = match.homeId === teamId;
  const paired = match.shootoutHomeGoals != null && match.shootoutAwayGoals != null;
  const side = (ours: boolean) => {
    const goals = home === ours ? match.homeGoals : match.awayGoals;
    const shootout = home === ours ? match.shootoutHomeGoals : match.shootoutAwayGoals;
    return (
      <>
        {goals}
        {paired ? <span className="knockout-shootout">({shootout})</span> : null}
      </>
    );
  };

  return (
    <span className="knockout-compact-score">
      {side(true)}
      <span className="px-1.5 text-muted-foreground">–</span>
      {side(false)}
    </span>
  );
}
