import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
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

/** Same micro-type as the page eyebrows, so the control reads as chrome. */
const TYPE = "font-mono text-[0.6875rem] uppercase tracking-[0.14em]";

type Option = { value: string; label: string };

/**
 * A listbox rather than a native <select>: the placeholder stays on the
 * trigger instead of masquerading as a selectable option, and the popup can
 * be drawn in the same hairline language as the rest of the page.
 */
function Dropdown({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className = "",
}: {
  label: string;
  value: string | null;
  options: Option[];
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Clearing is a real choice, so it lives in the list and takes part in
  // keyboard navigation — unlike a placeholder, which does not.
  const items: Option[] = value ? [...options, { value: "", label: "Clear" }] : options;
  const selected = options.find((o) => o.value === value) ?? null;

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const openList = () => {
    setActive(
      Math.max(
        0,
        items.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = items[index];
    if (!option) return;
    onChange(option.value || null);
    close();
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(items.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={`relative min-w-0 flex-1 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openList();
          }
        }}
        className={`${TYPE} flex w-full items-center justify-between gap-2 border-b py-1.5 text-left transition-colors disabled:pointer-events-none disabled:opacity-40 ${
          selected
            ? "border-foreground/50 text-foreground hover:border-foreground"
            : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
        }`}
      >
        <span className="truncate">{selected ? selected.label : label}</span>
        <ChevronDown
          className={`size-3 shrink-0 text-muted-foreground transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKeyDown}
          className="absolute top-full right-0 z-50 mt-1 max-h-64 w-max max-w-[min(20rem,78vw)] min-w-full overflow-y-auto border border-border bg-card py-1 shadow-[0_6px_20px_oklch(0_0_0/0.09)] outline-none"
        >
          {items.map((option, index) => {
            const isSelected = !!option.value && option.value === value;
            const isClear = !option.value;
            return (
              <li
                key={option.value || "clear"}
                id={`${id}-${index}`}
                role="option"
                aria-selected={isSelected}
                data-index={index}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`${TYPE} cursor-pointer px-2.5 py-1.5 ${
                  isClear ? "mt-1 border-t border-hairline pt-2" : ""
                } ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : index === active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/** Liga first, then the teams in it. Both are remembered across pages. */
export function MyTeamPicker({ className = "" }: { className?: string }) {
  const { divisionId, teamId, setMyTeam } = useMyTeam();

  const ligaOptions = activeLigas.map((liga) => ({
    value: liga.divisionId,
    label: liga.short,
  }));
  const teamOptions = divisionId
    ? teamsOf(divisionId).map((team) => ({ value: team.id, label: team.name }))
    : [];

  return (
    <div className={`flex items-end gap-5 ${className}`}>
      <Dropdown
        label="My liga"
        value={divisionId}
        options={ligaOptions}
        onChange={(next) => setMyTeam({ divisionId: next as DivisionId | null, teamId: null })}
        className="sm:w-28 sm:flex-none"
      />
      <Dropdown
        label="My team"
        value={teamId}
        options={teamOptions}
        disabled={!divisionId}
        onChange={(next) => setMyTeam({ divisionId, teamId: next })}
        className="sm:w-44 sm:flex-none"
      />
    </div>
  );
}
