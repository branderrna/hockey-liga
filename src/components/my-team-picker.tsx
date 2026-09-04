import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
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

export type Option = { value: string; label: string };

/**
 * A blank in a sentence that opens a listbox. The unfilled state reads as
 * placeholder prose rather than a form control, so the line still scans as a
 * sentence before anything is chosen.
 */
export function InlineSelect({
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
  uppercase = false,
  className = "",
  variant = "blank",
}: {
  placeholder: string;
  value: string | null;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Display-only casing; the underlying label text is left intact. */
  uppercase?: boolean;
  /** Sizing for the blank; the trigger inherits it. */
  className?: string;
  /** "blank" is the ruled fill-in on the landing; "quiet" sits inside prose. */
  variant?: "blank" | "quiet";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [shift, setShift] = useState(0);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

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

  // The popup is anchored to the trigger, which can sit anywhere on the line,
  // so pull it back inside the viewport when it would run off the right edge.
  useLayoutEffect(() => {
    if (!open) {
      setShift(0);
      return;
    }
    const rect = listRef.current?.getBoundingClientRect();
    if (!rect) return;
    // clientWidth, not innerWidth: the latter counts the scrollbar gutter.
    const overflow = rect.right - (document.documentElement.clientWidth - 8);
    if (overflow > 0) setShift(-overflow);
  }, [open]);

  const openList = () => {
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    close();
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <span ref={wrapRef} className={`relative inline-block max-w-full ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={placeholder}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openList();
          }
        }}
        className={
          variant === "quiet"
            ? `inline-flex max-w-full items-center gap-1 text-left underline decoration-transparent underline-offset-4 transition-colors hover:decoration-border disabled:pointer-events-none disabled:opacity-45 ${
                selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`
            : `inline-flex max-w-full items-center gap-2 border-b-2 pb-0.5 text-left align-bottom transition-colors disabled:pointer-events-none disabled:opacity-45 ${
                selected
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/60 hover:text-foreground"
              }`
        }
      >
        <span className={`text-left ${selected && uppercase ? "uppercase" : ""}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`shrink-0 text-muted-foreground transition-transform duration-150 ${
            variant === "quiet" ? "size-3" : "size-[0.5em]"
          } ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={placeholder}
          tabIndex={-1}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKeyDown}
          style={{ marginLeft: shift }}
          className={`absolute top-full left-0 z-50 mt-2 max-h-72 w-max max-w-[min(22rem,80vw)] overflow-y-auto border border-border bg-card py-1 shadow-[0_6px_20px_oklch(0_0_0/0.09)] outline-none ${
            variant === "quiet" ? "font-mono text-[0.6875rem] tracking-[0.04em]" : "text-sm"
          }`}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-${index}`}
              role="option"
              aria-selected={option.value === value}
              data-index={index}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(index)}
              className={`cursor-pointer ${variant === "quiet" ? "px-2.5 py-1.5" : "px-3 py-2"} ${
                uppercase ? "uppercase" : ""
              } ${
                option.value === value
                  ? "bg-primary text-primary-foreground"
                  : index === active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
    </span>
  );
}

/** Read-only echo of the choice made on the landing page. */
export function ViewingAs() {
  const { divisionId, teamId, setMyTeam } = useMyTeam();

  const teamOptions = divisionId
    ? teamsOf(divisionId).map((team) => ({ value: team.id, label: team.name }))
    : [];
  const ligaOptions = activeLigas.map((liga) => ({ value: liga.divisionId, label: liga.name }));

  return (
    // Wraps rather than truncates: on a narrow screen the liga name is the
    // part that would be cut, and it is the half worth keeping.
    <p className="meta-mono leading-snug">
      Viewing as{" "}
      <InlineSelect
        variant="quiet"
        placeholder="select team"
        value={teamId}
        options={teamOptions}
        disabled={!divisionId}
        onChange={(next) => setMyTeam({ divisionId, teamId: next })}
      />{" "}
      in{" "}
      <InlineSelect
        variant="quiet"
        uppercase
        placeholder="select liga"
        value={divisionId}
        options={ligaOptions}
        onChange={(next) => setMyTeam({ divisionId: next as DivisionId, teamId: null })}
      />
    </p>
  );
}
