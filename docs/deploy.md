# Deployment

The site runs on Cloudflare Workers as two separate environments, both
deployed by [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
on every push. Both build with `npm run build` and deploy with
`npx wrangler --cwd .output deploy --name <worker>`, authenticated via a
`CLOUDFLARE_API_TOKEN` repo secret.

| Branch    | Worker                          | URL                                                              |
| --------- | -------------------------------- | ----------------------------------------------------------------- |
| `main`    | `branderrna-hockey-liga`         | https://branderrna-hockey-liga.hockey-liga.workers.dev (+ `sghockeyliga.com`) |
| `staging` | `branderrna-hockey-liga-staging` | https://branderrna-hockey-liga-staging.hockey-liga.workers.dev    |

`main` is production — the custom domain points there. `staging` is for
trying out changes (especially larger ones, like infra/dependency work)
before they reach real visitors.

## Suggested workflow

1. Make changes on a feature branch, or directly on `staging`
2. Push to `staging` → it auto-deploys to the staging URL → check it there
3. When it looks right, merge/push `staging` into `main` → deploys to production

Nothing stops you from pushing straight to `main` for small stuff (typo
fixes, copy changes) — staging is there for when you want a safety net,
not a mandatory gate.

Note the fixtures-refresh pipeline (see
[fixtures-refresh.md](fixtures-refresh.md)) only ever commits to `main` —
score updates go straight to production, not staging. It also can't rely on
its push triggering this workflow the normal way — see below.

## Local commits auto-push

Because deploys are push-triggered, a commit that stays local doesn't just
sit there quietly — it means the live site silently drifts from what's
actually in the repo, with no indication anything's out of sync. That
happened once already (see git history around 2026-08-22): a batch of
commits from a stress-testing session sat unpushed for a while, so the
live site kept serving stale data even though local was ahead.

To make that structurally impossible rather than relying on remembering,
this repo has a local git hook — `.git/hooks/post-commit` — that pushes
`main` or `staging` automatically after every commit on either of those
branches. It's not tracked by git (hooks never are), so it only exists on
machines where it's been set up. If cloning fresh, recreate it:

```sh
cat > .git/hooks/post-commit << 'EOF'
#!/bin/sh
branch=$(git rev-parse --abbrev-ref HEAD)
case "$branch" in
  main|staging) ;;
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

## Why the fixtures-refresh workflow triggers deploy.yml explicitly

This one is easy to miss: GitHub doesn't chain workflow triggers when a
push is made using a workflow's own default `GITHUB_TOKEN` — it's built-in
anti-loop protection. `refresh-fixtures.yml` pushes to `main` using exactly
that token, so its commits were **not** firing `deploy.yml`'s `on: push`
at all. Everything looked fine — the commit landed, no errors anywhere —
but the live site just silently kept serving the previous data until
something else happened to push and trigger a real deploy.

The fix: `refresh-fixtures.yml` now explicitly runs
`gh workflow run deploy.yml --ref main` after a successful commit, instead
of assuming the push itself will trigger it. If you ever add another
automation that commits to `main` or `staging`, it needs the same explicit
trigger — don't assume a bot-authored push will deploy on its own.

## Why the Worker name matters

The deploy workflow explicitly maps branch → Worker name rather than
letting it default. That's not incidental: nitro/wrangler otherwise derive
the Worker name from `package.json`'s `name` field, and a mismatch there
silently creates a **new, disconnected Worker** instead of updating the
live one — deploys keep "succeeding" while the real site (and its custom
domain) stops receiving updates. This exact issue was caught during a code
review before it reached production; the explicit branch→name mapping in
the workflow is the fix.
