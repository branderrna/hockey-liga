# Deployment

The site runs on Cloudflare Workers, deployed by
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). It builds
with `npm run build` and deploys with
`npx --no-install wrangler --cwd .output deploy --name "$WORKER_NAME"`,
authenticated via a `CLOUDFLARE_API_TOKEN` repo secret.

Three things start a **production deploy**:

| Trigger             | When                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `push`              | any commit to `main`                                                                     |
| `workflow_run`      | a successful **Refresh fixtures from Google Sheet** run — sheet edits and the daily cron |
| `workflow_dispatch` | **Run workflow** in the Actions tab, against `main`                                      |

Every one of them passes through [`checks.yml`](../.github/workflows/checks.yml)
first — fixtures validation, lint, formatting, typecheck, dead-code check and
build — before any step sees the Cloudflare token. Nothing reaches a Worker
without clearing the same gate a pull request does.

Pushes to any _other_ branch do not deploy. They build a preview instead — see
[Preview deployments](#preview-deployments-cloudflare-workers-builds) below.

| Branch | Worker                   | URL                                                                           |
| ------ | ------------------------ | ----------------------------------------------------------------------------- |
| `main` | `branderrna-hockey-liga` | https://branderrna-hockey-liga.hockey-liga.workers.dev (+ `sghockeyliga.com`) |

`main` is production, and the custom domain points there. It is the only
branch that deploys. There was previously a `staging` branch and Worker; it
was retired on 2026-09-04 in favour of per-branch preview URLs, which give
every branch its own environment instead of one shared slot.

## Manual deployment

Normally you do not need a local deploy: **Actions → Deploy to Cloudflare → Run
workflow** against `main`, and it builds and publishes with the checks gate
applied. The branch selector is safe — `deploy.yml` matches the ref against an
explicit whitelist and refuses anything that is not `main`, so a dispatch from a
feature branch fails fast instead of deploying somewhere unintended.

The command below is the escape hatch for when Actions itself is unavailable.
From the repository root, on the revision you intend to ship, run
`npm run build` and then:

```sh
npx --no-install wrangler --cwd .output deploy --name branderrna-hockey-liga
```

Set `CLOUDFLARE_API_TOKEN` first. `--cwd .output` deploys the generated build,
and `--name` must not be omitted — see
[Why the Worker name matters](#why-the-worker-name-matters).

## Suggested workflow

1. Make changes on a feature branch and push it
2. Open its preview URL — `<branch>-branderrna-hockey-liga.hockey-liga.workers.dev`
   — and check the change running
3. Merge into `main` to ship

Small stuff (typo fixes, copy changes) can go straight to `main`. Previews are
there for when you want to look before shipping, not as a mandatory gate.

Note the fixtures-refresh pipeline (see
[fixtures-refresh.md](fixtures-refresh.md)) only ever commits to `main`, so
score updates go straight to production. It also can't rely on its push
triggering this workflow the normal way — see below.

## Local commits auto-push

Because direct deploys are push-triggered, a commit that stays local doesn't just
sit there quietly — it means the live site silently drifts from what's
actually in the repo, with no indication anything's out of sync. That
happened once already (see git history around 2026-08-22): a batch of
commits from a stress-testing session sat unpushed for a while, so the
live site kept serving stale data even though local was ahead.

To make that structurally impossible rather than relying on remembering,
this repo has a local git hook — `.git/hooks/post-commit` — that pushes
`main` automatically after every commit on that branch. It's not tracked by git
(hooks never are), so it only exists on machines where it's been set up. If
cloning fresh, recreate it:

```sh
cat > .git/hooks/post-commit << 'EOF'
#!/bin/sh
branch=$(git rev-parse --abbrev-ref HEAD)
case "$branch" in
  main) ;;
  *) exit 0 ;;
esac
if git push origin "$branch" 2>&1 | sed 's/^/[auto-push] /'; then
  :
else
  echo "[auto-push] FAILED — this commit is local-only. Push manually: git push origin $branch" >&2
fi
EOF
chmod +x .git/hooks/post-commit
```

If a push ever does fail silently (no network, auth expired, etc.), the
hook prints a clear `[auto-push] FAILED` line — check for that after
committing if the live site doesn't reflect a change you just made.

## Why the fixtures-refresh workflow triggers deploy.yml

This one is easy to miss: GitHub doesn't chain workflow triggers when a
push is made using a workflow's own default `GITHUB_TOKEN` — it's built-in
anti-loop protection. `refresh-fixtures.yml` pushes to `main` using exactly
that token, so its commits do not fire `deploy.yml`'s `on: push` by
themselves.

The fix: `deploy.yml` also listens for a successful completion of
`refresh-fixtures.yml` through `workflow_run`. The deploy workflow is loaded
from the default branch, validates the refresh run's `head_branch` with a
case-sensitive shell `case`, and only then checks out `main` and reaches the
secret-bearing deploy step. This avoids human `workflow_dispatch` while
still deploying refreshed data. If another automation commits to `main`, it
needs an explicitly reviewed trigger path; do not assume a bot-authored push
will deploy on its own.

## Why there is no wrangler config in the repository root

There is deliberately no `wrangler.toml` or `wrangler.jsonc` at the top level.
Nitro generates the real one during `npm run build`, at
`.output/server/wrangler.json`, with the entry point, the assets binding, the
compatibility date and `nodejs_compat` all derived from the build. That is why
every deploy command in this file passes `--cwd .output`: the config only exists
after a build, inside the build output.

A Wrangler command run from the repository root therefore has nothing to point
at. What happens next depends on the subcommand, and the difference matters:

- `wrangler versions upload` fails outright, with
  `✘ [ERROR] Missing entry-point to Worker script or to assets directory`.
- `wrangler deploy` **does not fail.** It drops into Wrangler's interactive
  setup wizard, which in a non-interactive environment answers itself
  (`Using fallback value in non-interactive context: yes`), scaffolds a
  `wrangler.jsonc`, adds `@cloudflare/vite-plugin`, builds to `dist/` instead of
  `.output/`, and deploys — to a Worker named after whatever it inferred.

The second case is the dangerous one, and it is not hypothetical.

## What Cloudflare Workers Builds did here (2026-08-22 to 2026-09-03)

Cloudflare's **Workers Builds** — the Git integration configured in the
dashboard under a Worker's Settings → Build — was connected to this repository
and ran both of those commands, because it uses different defaults per branch:

| Branch     | Deploy command                 | Outcome                 |
| ---------- | ------------------------------ | ----------------------- |
| non-`main` | `npx wrangler versions upload` | failed, visibly         |
| `main`     | `npx wrangler deploy`          | **succeeded, silently** |

Only the failures were ever noticed. Meanwhile every push to `main` was also
being deployed by the wizard path above to a **separate Worker named
`hockey-liga`** — created 2026-08-22, three minutes after the real one, and
serving a live public copy of the site at `hockey-liga.hockey-liga.workers.dev`
for two weeks before anyone looked. It ran a different build pipeline and a
different compatibility date from production.

`sghockeyliga.com` was never affected: it points at `branderrna-hockey-liga`,
deployed by GitHub Actions. But two deploys raced on every push, seconds apart,
and the Workers Builds one skipped the `checks.yml` gate entirely.

**Leave Workers Builds disconnected.** Beyond the above, it cannot cover what
this project needs: it is driven purely by Git events, so it cannot do the daily
scheduled refresh or the Google Sheet edit trigger (see
[fixtures-refresh.md](fixtures-refresh.md)).

Note that disconnecting the integration stops future builds but does **not**
delete the Worker it created. That has to be removed separately, or it keeps
serving whatever it last deployed.

## Preview deployments (Cloudflare Workers Builds)

Every push to a branch other than `main` gets its own preview URL, so a change
can be seen running before it is merged. Two URLs are produced per build and
posted as a pull request comment:

| URL                                                               | Points at                                   |
| ----------------------------------------------------------------- | ------------------------------------------- |
| `<branch>-branderrna-hockey-liga.hockey-liga.workers.dev`         | latest commit on that branch (stable alias) |
| `<version-prefix>-branderrna-hockey-liga.hockey-liga.workers.dev` | that one specific commit                    |

These are **versions** of the production Worker, uploaded but never deployed.
Production keeps serving whatever it was serving; promoting a version would
require an explicit `wrangler versions deploy`, which nothing here runs
automatically.

### This configuration lives in the Cloudflare dashboard, not in this repository

It is the one piece of deployment setup that is not in version control, which is
why it is written down here. It is attached to the **`branderrna-hockey-liga`**
Worker, under Settings → Build:

| Field                              | Value                                                     |
| ---------------------------------- | --------------------------------------------------------- |
| Git repository                     | `branderrna/hockey-liga`                                  |
| Build command                      | `npm run build`                                           |
| Deploy command (production branch) | `echo "Production deploys are handled by GitHub Actions"` |
| Version command (non-production)   | `npx wrangler versions upload`                            |
| Root directory                     | `/`                                                       |
| Production branch                  | `main`                                                    |
| Builds for non-production branches | enabled                                                   |

Two of those are load-bearing and should not be changed casually:

- **The build command must stay set.** Without it there is no `.output`, and
  Wrangler falls into its interactive setup wizard, which auto-answers itself in
  CI and scaffolds a config against the wrong build. That is exactly how the
  duplicate `hockey-liga` Worker described above came to exist. With the build
  command set, the build writes `.wrangler/deploy/config.json`, Wrangler follows
  that redirect to `.output/server/wrangler.json`, and the wizard never runs.
- **The production deploy command must stay a no-op.** Connecting a repository
  makes the production branch build unconditionally, and there is no setting to
  turn that off. GitHub Actions owns production. If this field is ever set back
  to `wrangler deploy`, both systems will deploy `main` and race each other.

A `main` push therefore still runs a Cloudflare build of about a minute that
deploys nothing. That is the price of there being no way to disable production
branch builds, and it is deliberate.

Previews do **not** run `checks.yml`. Lint, formatting, typecheck and fixture
validation still gate `main` through GitHub Actions; a preview only proves the
branch builds and renders.

### Verifying it still works

Push a throwaway branch containing a visible marker, then confirm the preview
shows it and production does not:

```sh
curl -s https://<branch>-branderrna-hockey-liga.hockey-liga.workers.dev | grep -c MARKER  # 1
curl -s https://sghockeyliga.com | grep -c MARKER                                         # 0
```

## Why the Worker name matters

The deploy workflow explicitly maps branch → Worker name rather than
letting it default. That's not incidental: nitro/wrangler otherwise derive
the Worker name from `package.json`'s `name` field, and a mismatch there
silently creates a **new, disconnected Worker** instead of updating the
live one — deploys keep "succeeding" while the real site (and its custom
domain) stops receiving updates. This exact issue was caught during a code
review before it reached production; the explicit branch→name mapping in
the workflow is the fix.
