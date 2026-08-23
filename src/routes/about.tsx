import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Github, Mail } from "lucide-react";
import { PageShell } from "@/components/site";
import logo from "@/assets/liga-logo.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Hockey Liga — 9-a-side Social Hockey Singapore" },
      {
        name: "description",
        content:
          "Hockey Liga is a 9-a-side social hockey tournament in Singapore, a pre-season platform for SHF Leagues and School Tournaments.",
      },
      { property: "og:title", content: "About Hockey Liga — 9-a-side Social Hockey Singapore" },
      {
        property: "og:description",
        content:
          "A 9-a-side social hockey tournament keeping hockey played in Singapore all year round.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell eyebrow="Hockey Liga" title="About the Liga">
      <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
        <div className="rounded-xl border border-border bg-card p-6">
          <img
            src={logo}
            alt="Hockey Liga logo: two hockey players with sticks and ball"
            className="mx-auto w-full max-w-[180px]"
            loading="lazy"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg leading-relaxed text-foreground">
            Hockey Liga is a 9-a-side Social Hockey Tournament which aims to create a platform for
            pre-season preparations for the SHF Leagues and School Tournaments and have Hockey being
            played in Singapore all year round.
          </p>

          <div className="rounded-xl border border-border bg-card p-6">
            <p className="label-eyebrow">Get in touch</p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <a
                className="flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                href="https://www.facebook.com/hockeyligasg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="size-4 shrink-0" aria-hidden="true" />
                facebook.com/hockeyligasg
              </a>
              <a
                className="flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                href="mailto:balestierlions@gmail.com"
              >
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                balestierlions@gmail.com
              </a>
              <a
                className="flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                href="https://github.com/branderrna/hockey-liga"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="size-4 shrink-0" aria-hidden="true" />
                github.com/branderrna/hockey-liga
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <p className="label-eyebrow">A Note From Us</p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              This site is a pro bono project created to give back to the Liga community and is
              maintained on a best-effort basis. While we endeavour to ensure that all information
              provided on this site is accurate and up to date, we cannot guarantee that it is free
              from errors or omissions.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              As Balestier Lions remains the official authority for all final scores, fixtures, and
              results, should you identify any inaccuracies or have any concerns regarding the
              information published on this site, please contact us at{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="mailto:balestierlions@gmail.com"
              >
                balestierlions@gmail.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
