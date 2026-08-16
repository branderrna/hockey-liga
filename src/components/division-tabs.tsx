import { leagues, type DivisionId } from "@/data/league";

export function DivisionTabs({
  value,
  onChange,
}: {
  value: DivisionId;
  onChange: (id: DivisionId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {leagues.map((l) => (
        <div key={l.id} className="surface flex flex-col gap-2 p-3">
          <span className="label-eyebrow">{l.short}</span>
          <div className="flex gap-2">
            {l.divisions.map((d) => (
              <button
                key={d.id}
                onClick={() => onChange(d.id)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  d.id === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.short}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
