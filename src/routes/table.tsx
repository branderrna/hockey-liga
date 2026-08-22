import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site";
import { DivisionTabs } from "@/components/division-tabs";
import { divisionById, standings, type DivisionId } from "@/data/league";

export const Route = createFileRoute("/table")({
  head: () => ({
    meta: [
      { title: "League Tables — Hockey Liga 2026 Standings" },
      {
        name: "description",
        content:
          "Standings for all three 2026 Hockey Ligas: points, wins, draws, losses, goals for and against, goal difference and recent form.",
      },
      { property: "og:title", content: "League Tables — Hockey Liga 2026" },
      {
        property: "og:description",
        content: "Women's, Premier and Youth U21 standings updated through the season.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TablePage,
});

const formColor = { W: "bg-win", D: "bg-ot", L: "bg-loss" } as const;
const formLabel = { W: "Win", D: "Draw", L: "Loss" } as const;

function TablePage() {
  const [div, setDiv] = useState<DivisionId>("women");
  const rows = standings(div);

  return (
    <PageShell eyebrow="Standings" title="League Tables">
      <DivisionTabs value={div} onChange={setDiv} />

      <h2 className="mt-8 text-2xl">{divisionById(div).name}</h2>

      <div className="surface mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-3 py-3 text-center">GP</th>
              <th className="px-3 py-3 text-center">W</th>
              <th className="px-3 py-3 text-center">D</th>
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
                className={`border-b border-border/60 last:border-0 ${i < 4 ? "bg-primary/5" : ""}`}
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
                </td>
                <td className="px-3 py-3 text-center text-muted-foreground">{r.gp}</td>
                <td className="px-3 py-3 text-center">{r.w}</td>
                <td className="px-3 py-3 text-center">{r.d}</td>
                <td className="px-3 py-3 text-center">{r.l}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{r.gf}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{r.ga}</td>
                <td className="px-3 py-3 text-center">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                <td className="px-3 py-3 text-center font-display text-xl text-primary">{r.pts}</td>
                <td className="px-4 py-3">
                  <span className="flex gap-1">
                    {r.form.map((f, idx) => (
                      <span
                        key={idx}
                        title={formLabel[f]}
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
