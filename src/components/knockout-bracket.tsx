import type { CSSProperties } from "react";
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
    const teamMatches = matches.filter(
      (match) => match.homeId === teamId || match.awayId === teamId,
    );
    return <CompactBracket matches={teamMatches} />;
  }

  const brackets = bracketsOf(dataset, divisionId);
  if (brackets.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="knockout-heading">
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
        <h2 id="knockout-heading" className="label-eyebrow">
          Knockout bracket
        </h2>
        <p className="meta-mono hidden sm:block">Lines follow the winner</p>
      </div>
      {brackets.map((bracket) => (
        <BracketChart key={bracket.key} bracket={bracket} teamId={teamId} />
      ))}
    </section>
  );
}

function BracketChart({ bracket, teamId }: { bracket: Bracket; teamId: string | null }) {
  return (
    <figure className="knockout-chart">
      <figcaption className="label-eyebrow knockout-chart-title">{bracket.title}</figcaption>
      <div
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
            <div key={`${index}-${column.title}`} className="knockout-column">
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

function CompactBracket({ matches }: { matches: Match[] }) {
  if (matches.length === 0) return null;
  return (
    <section className="mt-12" aria-labelledby="my-team-knockout-heading">
      <h2 id="my-team-knockout-heading" className="label-eyebrow border-b border-border pb-2">
        Knockout run
      </h2>
      <ol className="mt-3 space-y-2">
        {matches.map((match) => (
          <li key={match.id} className="knockout-compact-match">
            <span className="knockout-compact-round">{formatFixtureRound(match.round ?? "")}</span>
            <span className="min-w-0 flex-1 text-sm">
              {match.homeName} <span className="text-muted-foreground">v</span> {match.awayName}
            </span>
            <BracketScore match={match} side="home" />
            <span className="text-muted-foreground">–</span>
            <BracketScore match={match} side="away" />
          </li>
        ))}
      </ol>
    </section>
  );
}
