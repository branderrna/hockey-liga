# Deployment

The site runs on Cloudflare Workers and redeploys automatically on every
push to `main` — see [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).
It builds with `npm run build` and deploys with `npx nitro deploy --prebuilt`,
authenticated via a `CLOUDFLARE_API_TOKEN` repo secret.

Live URL: https://branderrna-hockey-liga.hockey-liga.workers.dev

## Local commits auto-push

Because deploys are push-triggered, a commit that stays local doesn't just
sit there quietly — it means the live site silently drifts from what's
actually in the repo, with no indication anything's out of sync. That
happened once already (see git history around 2026-08-22): a batch of
commits from a stress-testing session sat unpushed for a while, so the
live site kept serving stale data even though local was ahead.

To make that structurally impossible rather than relying on remembering,
this repo has a local git hook — `.git/hooks/post-commit` — that pushes
`main` automatically after every commit. It's not tracked by git (hooks
never are), so it only exists on machines where it's been set up. If
cloning fresh, recreate it:

```sh
cat > .git/hooks/post-commit << 'EOF'
#!/bin/sh
branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "main" ]; then
  exit 0
fi
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
