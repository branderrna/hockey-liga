import { createContext, useContext } from "react";
import { activeLigas, teamsOf, type DivisionId } from "@/data/league";

/**
 * The visitor's own liga and team. It is a display preference only — it
 * highlights their fixtures and standings row, and never limits what they
 * can browse.
 */
export type MyTeam = { divisionId: DivisionId | null; teamId: string | null };

export const NO_TEAM: MyTeam = { divisionId: null, teamId: null };

const STORAGE_KEY = "hockey-liga:my-team";

export type MyTeamValue = MyTeam & { setMyTeam: (next: MyTeam) => void };

export const MyTeamContext = createContext<MyTeamValue>({ ...NO_TEAM, setMyTeam: () => {} });

export const useMyTeam = () => useContext(MyTeamContext);

/** Reads the stored pick, discarding anything that no longer matches the data. */
export function readMyTeam(): MyTeam {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return NO_TEAM;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return NO_TEAM;
    const { divisionId, teamId } = parsed as Partial<MyTeam>;
    const liga = activeLigas.find((l) => l.divisionId === divisionId);
    if (!liga) return NO_TEAM;
    const team = teamsOf(liga.divisionId).find((t) => t.id === teamId);
    return { divisionId: liga.divisionId, teamId: team?.id ?? null };
  } catch {
    return NO_TEAM;
  }
}

export function writeMyTeam(value: MyTeam) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private browsing, blocked site data). The
    // pick still works for this visit, it just is not remembered.
  }
}
