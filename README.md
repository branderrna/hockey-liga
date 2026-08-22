# Hockey Liga 2026

A companion website for the 2026 Hockey Liga season — Women's, Premier, and
Youth (U21 Girls / U21 Boys) — running August to November 2026 across four
divisions and 15+ teams.

The site shows:

- **Fixtures & results** — the full match schedule per division, filterable
  by date or team, with scores as they come in and postponed matches clearly
  flagged
- **League tables** — standings computed live from match results (points,
  goal difference, recent form), never entered by hand
- **Team info** — kit colours and per-team availability notes

Fixtures and results are sourced from the league's Google Sheet and refreshed
automatically every week — see [Fixtures & results](#fixtures--results) below.

This project was built with [Lovable](https://lovable.dev) and is a TanStack
Start + Vite app.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fa976fac-f476-497a-8889-1384702a94d1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Fixtures & results

Fixtures, scores, and postponements are pulled weekly from a Google Sheet and
committed automatically — see [docs/fixtures-refresh.md](docs/fixtures-refresh.md)
for how the pipeline works, the sheet format it expects, and how to trigger a
refresh manually.

## Deployment

The site auto-deploys to Cloudflare Workers on every push to `main` — see
[docs/deploy.md](docs/deploy.md) for the live URL and how local commits stay
in sync with what's deployed.
