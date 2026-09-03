import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { activeLigas, teamsOf, type DivisionId } from "@/data/league";
import {
  MyTeamContext,
  NO_TEAM,
  readMyTeam,
  useMyTeam,
  writeMyTeam,
  type MyTeam,
} from "@/lib/my-team";

export function MyTeamProvider({ children }: { children: ReactNode }) {
  const [myTeam, setState] = useState<MyTeam>(NO_TEAM);

  // Read after mount — the server render has no access to localStorage.
  useEffect(() => setState(readMyTeam()), []);

  const setMyTeam = useCallback((next: MyTeam) => {
    setState(next);
    writeMyTeam(next);
  }, []);

  const value = useMemo(() => ({ ...myTeam, setMyTeam }), [myTeam, setMyTeam]);

  return <MyTeamContext.Provider value={value}>{children}</MyTeamContext.Provider>;
}

function Select({
  width,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { width: string }) {
  return (
    <span className={`relative inline-flex min-w-0 flex-1 items-center ${width}`}>
      <select
        {...props}
        className="w-full appearance-none truncate rounded-md border border-border bg-card py-1.5 pr-7 pl-2.5 text-sm transition-colors hover:border-foreground/40 disabled:opacity-50"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 size-3.5 text-muted-foreground"
        aria-hidden="true"
      />
    </span>
  );
}

/** Liga first, then the teams in it. Both are remembered across pages. */
export function MyTeamPicker({ className = "" }: { className?: string }) {
  const { divisionId, teamId, setMyTeam } = useMyTeam();
  const teams = divisionId ? teamsOf(divisionId) : [];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select
        width="sm:w-32 sm:flex-none"
        aria-label="My liga"
        value={divisionId ?? ""}
        onChange={(e) =>
          setMyTeam({ divisionId: (e.target.value || null) as DivisionId | null, teamId: null })
        }
      >
        <option value="">My liga</option>
        {activeLigas.map((liga) => (
          <option key={liga.slug} value={liga.divisionId}>
            {liga.short}
          </option>
        ))}
      </Select>

      <Select
        width="sm:w-44 sm:flex-none"
        aria-label="My team"
        disabled={!divisionId}
        value={teamId ?? ""}
        onChange={(e) => setMyTeam({ divisionId, teamId: e.target.value || null })}
      >
        <option value="">{divisionId ? "My team" : "Pick a liga first"}</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
