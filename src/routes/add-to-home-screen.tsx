import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Apple,
  Check,
  Chrome,
  MoreVertical,
  PlusSquare,
  Share,
  Smartphone,
} from "lucide-react";
import type { ReactNode } from "react";
import { PageShell } from "@/components/site";

const IOS_REFERENCE_IMAGE = "/guides/ios-add-to-home-screen.png";
const ANDROID_REFERENCE_IMAGE = "/guides/android-add-to-home-screen.png";

export const Route = createFileRoute("/add-to-home-screen")({
  head: () => ({
    meta: [
      { title: "Add to Home Screen — Hockey Liga" },
      {
        name: "description",
        content: "How to add Hockey Liga to your iPhone or Android home screen.",
      },
      { property: "og:title", content: "Add to Home Screen — Hockey Liga" },
      {
        property: "og:description",
        content: "Keep Hockey Liga one tap away on your iPhone or Android phone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddToHomeScreenPage,
});

type GuideStepProps = {
  number: number;
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

function GuideStep({ number, title, icon, children }: GuideStepProps) {
  return (
    <li className="flex gap-3.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border bg-background">
        {icon}
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-medium">
          <span className="meta-mono mr-2">0{number}</span>
          {title}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}

type PlatformCardProps = {
  number: string;
  platform: string;
  browser: string;
  icon: ReactNode;
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  sourceLabel: string;
  sourceUrl: string;
  children: ReactNode;
};

function PlatformCard({
  number,
  platform,
  browser,
  icon,
  image,
  imageAlt,
  imageWidth,
  imageHeight,
  sourceLabel,
  sourceUrl,
  children,
}: PlatformCardProps) {
  return (
    <article className="surface overflow-hidden">
      <header className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-secondary"
            aria-hidden="true"
          >
            {icon}
          </div>
          <div>
            <p className="label-eyebrow">{platform}</p>
            <h2 className="mt-1 text-xl">{browser}</h2>
          </div>
        </div>
        <span className="meta-mono">{number}</span>
      </header>

      <div className="p-5 sm:p-6">
        <figure className="rounded-md border border-hairline bg-secondary/40 p-3">
          <img
            src={image}
            alt={imageAlt}
            width={imageWidth}
            height={imageHeight}
            className="h-64 w-full rounded-sm object-contain grayscale sm:h-72"
            loading="lazy"
            decoding="async"
          />
          <figcaption className="mt-2 flex min-h-11 items-center justify-center text-center text-xs text-muted-foreground">
            Edited reference ·{" "}
            <a
              className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {sourceLabel}
            </a>
          </figcaption>
        </figure>

        <ol className="mt-7 flex flex-col gap-5">{children}</ol>
      </div>
    </article>
  );
}

function AddToHomeScreenPage() {
  return (
    <PageShell
      eyebrow="Quick start"
      title="Add Hockey Liga to your home screen"
      intro="Keep fixtures, results and the league table one tap away. Follow the steps for your phone below."
    >
      <div className="space-y-8">
        <section
          className="surface flex items-start gap-4 p-5 sm:p-6"
          aria-labelledby="one-tap-title"
        >
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-secondary"
            aria-hidden="true"
          >
            <Smartphone className="size-5" />
          </div>
          <div>
            <p className="label-eyebrow" id="one-tap-title">
              One tap away
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Adding a shortcut means you can jump straight back to Hockey Liga without typing the
              address again. Use the browser you normally use on your phone.
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <PlatformCard
            number="01"
            platform="iPhone & iPad"
            browser="Safari"
            icon={<Apple className="size-5" aria-hidden="true" />}
            image={IOS_REFERENCE_IMAGE}
            imageAlt="Safari Share menu with Add to Home Screen highlighted"
            imageWidth={562}
            imageHeight={1008}
            sourceLabel="Apple Support"
            sourceUrl="https://support.apple.com/guide/iphone/add-a-website-to-your-home-screen-iph42ab2f3a7/ios"
          >
            <GuideStep
              number={1}
              title="Open this page in Safari"
              icon={<Smartphone className="size-4" aria-hidden="true" />}
            >
              Visit Hockey Liga in Safari on your iPhone or iPad.
            </GuideStep>
            <GuideStep
              number={2}
              title="Tap Share"
              icon={<Share className="size-4" aria-hidden="true" />}
            >
              Tap the Share button in Safari&rsquo;s toolbar.
            </GuideStep>
            <GuideStep
              number={3}
              title="Choose Add to Home Screen"
              icon={<PlusSquare className="size-4" aria-hidden="true" />}
            >
              Scroll the share sheet if needed, tap Add to Home Screen, then tap Add to finish.
            </GuideStep>
          </PlatformCard>

          <PlatformCard
            number="02"
            platform="Android phones"
            browser="Chrome"
            icon={<Chrome className="size-5" aria-hidden="true" />}
            image={ANDROID_REFERENCE_IMAGE}
            imageAlt="Chrome Add to Home screen dialog"
            imageWidth={1440}
            imageHeight={750}
            sourceLabel="Chrome for Developers"
            sourceUrl="https://developer.chrome.com/blog/a2hs-updates/"
          >
            <GuideStep
              number={1}
              title="Open this page in Chrome"
              icon={<Smartphone className="size-4" aria-hidden="true" />}
            >
              Visit Hockey Liga in Chrome on your Android phone.
            </GuideStep>
            <GuideStep
              number={2}
              title="Open the three-dot menu"
              icon={<MoreVertical className="size-4" aria-hidden="true" />}
            >
              Tap the three dots in the top-right corner of Chrome.
            </GuideStep>
            <GuideStep
              number={3}
              title="Tap Add to Home screen or Install app"
              icon={<PlusSquare className="size-4" aria-hidden="true" />}
            >
              The wording varies by device and Chrome version. Confirm the name, then tap Add or
              Install.
            </GuideStep>
          </PlatformCard>
        </div>

        <section className="surface p-5 sm:p-6" aria-labelledby="after-adding-title">
          <div className="flex items-start gap-4">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-secondary"
              aria-hidden="true"
            >
              <Check className="size-5" />
            </div>
            <div>
              <p className="label-eyebrow" id="after-adding-title">
                After adding it
              </p>
              <h2 className="mt-2 text-lg">Launch it like an app</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Look for the Hockey Liga icon on your home screen. Tapping it opens the site
                directly, so the latest fixtures and results are always close at hand.
              </p>
              <Link
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                to="/"
              >
                Back to Hockey Liga
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
