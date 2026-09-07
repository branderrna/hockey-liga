import { formatFixtureRound } from "@/data/round";
import {
  isPlayed,
  knockoutMatchesOf,
  knockoutStage,
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

  const quarterFinals = matches.filter((match) => knockoutStage(match.round) === "quarter-final");
  const semiFinals = matches.filter((match) => knockoutStage(match.round) === "semi-final");
  const final = matches.find((match) => knockoutStage(match.round) === "final");
  const placing = matches.filter((match) => knockoutStage(match.round) === "placing");
  const thirdPlace = placing.find((match) => /^3RD/i.test(match.round ?? ""));
  const otherPlacing = placing.filter((match) => match !== thirdPlace);
  const playIns = matches.filter((match) => knockoutStage(match.round) === "play-in");

  return (
    <section className="mt-12" aria-labelledby="knockout-heading">
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
        <h2 id="knockout-heading" className="label-eyebrow">
          Knockout bracket
        </h2>
        <p className="meta-mono hidden sm:block">Source rounds · replay rows collapsed</p>
      </div>

      <div className="knockout-scroll mt-6" role="region" aria-label="Knockout bracket">
        <div className="knockout-bracket">
          {playIns.length > 0 ? (
            <BracketColumn title="Play-in" matches={playIns} teamId={teamId} />
          ) : null}
          {quarterFinals.length > 0 ? (
            <BracketColumn title="Quarter-finals" matches={quarterFinals} teamId={teamId} />
          ) : null}
          {semiFinals.length > 0 ? (
            <BracketColumn title="Semi-finals" matches={semiFinals} teamId={teamId} />
          ) : null}
          <div className="knockout-center-column">
            {final ? <BracketMatch match={final} teamId={teamId} emphasis="final" /> : null}
            {thirdPlace ? (
              <BracketMatch match={thirdPlace} teamId={teamId} emphasis="third" />
            ) : null}
          </div>
          {otherPlacing.length > 0 ? (
            <BracketColumn title="Placing" matches={otherPlacing} teamId={teamId} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function BracketColumn({
  title,
  matches,
  teamId,
}: {
  title: string;
  matches: Match[];
  teamId: string | null;
}) {
  return (
    <div className="knockout-stage" data-count={matches.length}>
      <h3 className="label-eyebrow mb-3">{title}</h3>
      <div className="knockout-stage-list">
        {matches.map((match) => (
          <BracketMatch key={match.id} match={match} teamId={teamId} />
        ))}
      </div>
    </div>
  );
}

function BracketMatch({
  match,
  teamId,
  emphasis,
}: {
  match: Match;
  teamId: string | null;
  emphasis?: "final" | "third";
}) {
  const winner = winnerForDisplay(match);
  const shootout =
    match.shootoutHomeGoals != null && match.shootoutAwayGoals != null
      ? `(${match.shootoutHomeGoals}–${match.shootoutAwayGoals})`
      : null;

  return (
    <article className={`knockout-match ${emphasis ? `knockout-match-${emphasis}` : ""}`}>
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
      {shootout ? <p className="knockout-shootout">{shootout}</p> : null}
    </article>
  );
}

function BracketScore({ match, side }: { match: Match; side: "home" | "away" }) {
  if (!isPlayed(match)) return <span className="meta-mono">{match.postponed ? "PP" : "—"}</span>;
  return (
    <span className="font-mono tabular-nums">
      {side === "home" ? match.homeGoals : match.awayGoals}
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
