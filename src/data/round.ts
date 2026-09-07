const SEMI_FINAL = /^SF\s*(\d+)$/i;
const QUARTER_FINAL = /^QF\s*(\d+)$/i;
const PLACING = /^(\d+)(?:ST|ND|RD|TH)?\s*([/-])\s*(\d+)(?:ST|ND|RD|TH)?$/i;
const ROUND = /^(\d+)(?:\.0+)?$/;

function ordinal(value: string): string {
  const number = Number(value);
  const suffix =
    number % 100 >= 11 && number % 100 <= 13
      ? "th"
      : number % 10 === 1
        ? "st"
        : number % 10 === 2
          ? "nd"
          : number % 10 === 3
            ? "rd"
            : "th";
  return `${number}${suffix}`;
}

/**
 * Turns compact stage values from the Round column into labels a visitor can
 * understand. Unknown values remain unchanged instead of being guessed at.
 */
export function formatFixtureRound(value: string): string {
  const round = value.trim().replace(/\s+/g, " ");
  if (!round) return round;

  const semiFinal = round.match(SEMI_FINAL);
  if (semiFinal) return `Semi-final ${semiFinal[1]}`;

  const quarterFinal = round.match(QUARTER_FINAL);
  if (quarterFinal) return `Quarter-final ${quarterFinal[1]}`;

  if (/^FINAL$/i.test(round)) return "Final";

  const placing = round.match(PLACING);
  if (placing) {
    const separator = placing[2] === "/" ? "/" : "–";
    return `${ordinal(placing[1]!)}${separator}${ordinal(placing[3]!)} place`;
  }

  const regularRound = round.match(ROUND);
  if (regularRound) return `Round ${Number(regularRound[1])}`;

  return round;
}
