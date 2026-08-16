import { divisions, type DivisionId } from "@/data/league";

export function DivisionTabs({
  value,
  onChange,
}: {
  value: DivisionId;
  onChange: (id: DivisionId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {divisions.map((d) => (
        <button
          key={d.id}
          onClick={() => onChange(d.id)}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            d.id === value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {d.short}
        </button>
      ))}
    </div>
  );
}
