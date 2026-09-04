import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/site";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "Past Seasons — Hockey Liga" },
      {
        name: "description",
        content: "Results from earlier Hockey Liga seasons.",
      },
      { property: "og:title", content: "Past Seasons — Hockey Liga" },
      { property: "og:description", content: "Results from earlier Hockey Liga seasons." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-14 sm:px-8 lg:py-20">
        <p className="label-eyebrow">Archive</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Past seasons</h1>
        <div className="surface mt-8 max-w-xl p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Results from earlier seasons are not on the site yet. They will appear here once the
            older schedules and tables have been collected.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
