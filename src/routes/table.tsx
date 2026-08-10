import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site";
import { standings } from "@/data/league";

export const Route = createFileRoute("/table")({
  head: () => ({
    meta: [
      { title: "League Table — Northern Ice Cup Standings" },
      {
        name: "description",
        content:
          "Live Northern Ice Cup standings: points, wins, overtime results, goals for and against, goal difference and recent form.",
      },
      { property: "og:title", content: "League Table — Northern Ice Cup Standings" },
      {
        property: "og:description",
        content: "Full standings for the six-month Northern Ice Cup hockey tournament.",
      },
    ],
  }),
  component: TablePage,
});

const formColor = { W: "bg-win", L: "bg-loss", O: "bg-ot" } as const;

function TablePage() {
  const rows = standings();

  return (
    <PageShell
      eyebrow="Standings"
      title="League Table"
      intro="Win 3 pts · Overtime win 2 pts · Overtime loss 1 pt · Loss 0 pts. Top 4 qualify for the playoff series."
    >
      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-3 py-3 text-center">GP</th>
              <th className="px-3 py-3 text-center">W</th>
              <th className="px-3 py-3 text-center">OTW</th>
              <th className="px-3 py-3 text-center">OTL</th>
              <th className="px-3 py-3 text-center">L</th>
              <th className="px-3 py-3 text-center">GF</th>
              <th className="px-3 py-3 text-center">GA</th>
              <th className="px-3 py-3 text-center">GD</th>
              <th className="px-3 py-3 text-center">Pts</th>
              <th className="px-4 py-3 text-left">Form</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.team.id}
                className={`border-b border-border/60 last:border-0 ${
                  i < 4 ? "bg-primary/5" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-grid h-6 w-6 place-items-center rounded font-display ${
                      i < 4 ? "bg-primary text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{r.team.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{r.team.city}</span>
                </td>
                <td className="px-3 py-3 text-center text-muted-foreground">{r.gp}</td>
                <td className="px-3 py-3 text-center">{r.w}</td>
                <td className="px-3 py-3 text-center">{r.otw}</td>
                <td className="px-3 py-3 text-center">{r.otl}</td>
                <td className="px-3 py-3 text-center">{r.l}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{r.gf}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{r.ga}</td>
                <td className="px-3 py-3 text-center">
                  {r.gd > 0 ? `+${r.gd}` : r.gd}
                </td>
                <td className="px-3 py-3 text-center font-display text-xl text-primary">
                  {r.pts}
                </td>
                <td className="px-4 py-3">
                  <span className="flex gap-1">
                    {r.form.map((f, idx) => (
                      <span
                        key={idx}
                        title={f === "O" ? "Overtime loss" : f === "W" ? "Win" : "Loss"}
                        className={`grid h-5 w-5 place-items-center rounded text-[10px] font-bold text-background ${formColor[f]}`}
                      >
                        {f}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
