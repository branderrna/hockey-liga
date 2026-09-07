const SEMI_FINAL = /^SF\s*(\d+)$/i;
const QUARTER_FINAL = /^QF\s*(\d+)$/i;
const PLACING = /^(\d+(?:ST|ND|RD|TH))\s*\/\s*(\d+(?:ST|ND|RD|TH))$/i;
const ROUND = /^(\d+)(?:\.0+)?$/;

/**
 * Turns the compact stage values used in the U14 Round column into labels a
 * visitor can understand. Unknown values are data we do not yet have a rule
 * for, so leave them unchanged instead of guessing.
 */
export function formatFixtureRound(value: string): string {
  const round = value.trim().replace(/\s+/g, " ");
  if (!round) return round;

  const semiFinal = round.match(SEMI_FINAL);
  if (semiFinal) return `Semi Final ${semiFinal[1]}`;

  const quarterFinal = round.match(QUARTER_FINAL);
  if (quarterFinal) return `Quarter Final ${quarterFinal[1]}`;

  const placing = round.match(PLACING);
  if (placing) return `${placing[1]}/${placing[2]} Placing`;

  const regularRound = round.match(ROUND);
  if (regularRound) return `Round ${regularRound[1]}`;

  return round;
}
