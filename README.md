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
automatically twice a week — see [Fixtures & results](#fixtures--results) below.

This project is a TanStack Start + Vite app deployed to Cloudflare Workers.
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

The site auto-deploys to Cloudflare Workers on every push to `main`
(production) or `staging` (a separate environment for trying out changes
first) — see [docs/deploy.md](docs/deploy.md) for both URLs, the suggested
staging workflow, and how local commits stay in sync with what's deployed.

## Contributing

Adding a collaborator is just a normal GitHub thing — **Settings →
Collaborators and teams → Add people** on this repo. A few things worth
knowing once you're in:

- **No Cloudflare access needed.** Deploys are triggered by GitHub Actions
  using a token already stored as a repo secret, not by anyone's local
  machine. Push to `main` and it deploys, regardless of what editor/tooling/
  LLM you use locally.
- **Set up locally** the same way as [Development](#development) above —
  clone, `npm i`, `npm run dev`.
- **Consider recreating the auto-push git hook** described in
  [docs/deploy.md](docs/deploy.md), so a commit never accidentally sits
  unpushed while the live site quietly falls out of date.
- **Workflow**: work on a branch and push it for review. For anything more
  than a small change, push to `staging` first, check the staging URL, then
  merge into `main` to ship — see [docs/deploy.md](docs/deploy.md). Small
  stuff can go straight to `main`. If two pushes land at the same time, git
  just rejects the second one — `git pull`, then push again. No data is lost.
- **Google Sheet access is separate** from GitHub — if a collaborator also
  needs to update fixtures/scores (not just code), share the sheet with
  their Google account directly. See [docs/fixtures-refresh.md](docs/fixtures-refresh.md)
  for the sheet's expected format.
