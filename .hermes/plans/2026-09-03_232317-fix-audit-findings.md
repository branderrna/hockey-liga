# Hockey Liga Infrastructure Audit Fix Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Bring `deprecate-obsolete-infra` up to the latest `main`, remove deployment-command ambiguity, harden the GitHub deployment workflow, and add enforceable validation without deploying live Workers.

**Architecture:** Keep the existing TanStack Start + Vite + Tailwind CSS 4 + Nitro Cloudflare-module build. Treat the generated `.output` directory as a build artifact and keep Worker targeting explicit at the deployment boundary. Keep fixture data generated from the existing Google Sheet workflow; do not hand-edit generated match records.

**Tech Stack:** TypeScript, React, TanStack Start/Router, Vite, Tailwind CSS 4, Nitro, Cloudflare Workers/Wrangler, GitHub Actions, npm.

---

## Current context and assumptions

- Repository: `D:\_github-repos\hockey-liga`
- Branch: `deprecate-obsolete-infra`
- Current branch tip: `349872d4db4f341b9c2fb159d522432348ed1185`
- Current remote `origin/main`: `cb2402216e05c6ac8fdedeb52692be749db36cd2`
- `origin/main` advanced after the cleanup branch was published with `cb24022 chore: fixtures/results refresh`.
- The branch is currently one commit ahead and one commit behind. The new `main` commit changes 35 generated match records and no match IDs.
- The branch is not to be deployed live as part of this work. Production and staging validation must use Wrangler dry-runs only.
- The existing local audit passed install, lint, TypeScript, build, Knip, npm audit, data invariants, Wrangler dry-runs, and local generated-Worker route smoke checks.

### Findings this plan addresses

1. **Merge blocker:** `AGENTS.md:42` and the committed 2026-08-23 plan advertise `npx nitro deploy --prebuilt`, while `.github/workflows/deploy.yml` and `docs/deploy.md` use explicit Wrangler deployment. Nitro's generated config defaults to the production Worker name, so the stale command is unsafe for staging.
2. **Carried-forward workflow security issue:** `.github/workflows/deploy.yml` interpolates `github.ref_name` directly into shell source. `workflow_dispatch` accepts arbitrary refs, and Git permits quote-bearing ref names. Use an environment variable and a job-level supported-ref guard.
3. **Validation gap:** `package.json` has no `test` script, and the deployment workflow only runs `npm ci` and `npm run build`.
4. **Carried-forward Worker reliability issue:** `src/lib/error-capture.ts` uses module-level mutable state to correlate errors across requests. Do not redesign this opportunistically without a supported request-local correlation hook; track it as a follow-up unless reproduction and a safe replacement are established.
5. **Hardening gap:** Wrangler is invoked through unpinned `npx`, and the generated compatibility date is build-dependent. Pin these only after confirming the supported Nitro/Wrangler configuration shape.
6. **Minor branch regression:** `README.md` fails Prettier because it lacks a blank line before `## Development`.

---

## Proposed order

1. Refresh and rebase onto the current `origin/main`.
2. Correct every deployment instruction and make the branch-only workflow safe.
3. Add the smallest useful CI/test gate.
4. Apply optional Wrangler/compatibility hardening if it does not expand the deployment surface unnecessarily.
5. Run the complete verification matrix, publish with `--force-with-lease`, and verify the GitHub comparison.
6. Leave the Worker error-correlation redesign as a separately reviewed follow-up unless its supported replacement is proven during implementation.

---

## Task 1: Refresh the branch base without touching generated data by hand

**Objective:** Rebase the cleanup commit onto the current fixture-refresh tip and preserve `origin/main`'s generated match data.

**Files:**
- Potentially conflict-resolved: `src/data/matches.generated.ts` (generated; prefer `origin/main`)
- Potentially conflict-resolved: any documentation files changed by both histories

**Steps:**

1. Confirm the worktree is clean and fetch current refs:

   ```bash
   git status --short --branch
   git fetch origin --prune
   git rev-parse HEAD
   git rev-parse origin/main
   git rev-list --left-right --count origin/main...HEAD
   ```

2. Rebase, not merge, so the feature branch has a linear reviewable history:

   ```bash
   git rebase origin/main
   ```

3. If `src/data/matches.generated.ts` conflicts, take the `origin/main` side and do not hand-edit the generated records. The refresh commit is the source of truth.

4. Resolve any documentation conflicts by preserving the corrected deployment contract in this plan and in `docs/deploy.md`.

5. Verify there are no conflict markers or whitespace errors:

   ```bash
   git diff --check
   git status --short
   ```

**Expected result:** `git rev-list --left-right --count origin/main...HEAD` reports zero behind commits before the fix commit is added, and the 35 current fixture updates remain present.

---

## Task 2: Make deployment documentation use one safe command

**Objective:** Remove the unsafe Nitro command from developer instructions and make Worker targeting explicit everywhere.

**Files:**
- Modify: `AGENTS.md:40-45`
- Modify: `.hermes/plans/2026-08-23_091834-deprecate-obsolete-infra.md:218,223`
- Review/possibly clarify: `docs/deploy.md:1-31`
- Review/possibly clarify: `README.md` deployment workflow section

**Required contract:**

- CI deployment remains:

  ```bash
  npx --no-install wrangler --cwd .output deploy --name "$WORKER_NAME"
  ```

- Manual production deployment must name production explicitly:

  ```bash
  npx --no-install wrangler --cwd .output deploy --name branderrna-hockey-liga
  ```

- Manual staging deployment must name staging explicitly:

  ```bash
  npx --no-install wrangler --cwd .output deploy --name branderrna-hockey-liga-staging
  ```

- No active instruction may recommend `npx nitro deploy --prebuilt`.

**Steps:**

1. Replace the stale command in `AGENTS.md` with a pointer to `docs/deploy.md` plus the explicit Wrangler command.
2. Update the old committed implementation plan so its production contract and validation step refer to the explicit Wrangler command, not Nitro deploy.
3. Keep `docs/deploy.md` as the source of truth and add the two manual commands if the generic `<worker>` placeholder could be copied without a safe name.
4. Search active instructions for stale commands:

   ```bash
   python -c "from pathlib import Path; root=Path('.'); terms=('nitro deploy --prebuilt','wrangler --cwd .output deploy'); files=[p for p in root.rglob('*') if p.is_file() and '.git' not in p.parts and 'node_modules' not in p.parts and p.suffix in {'.md','.yml','.yaml','.json','.ts'}]; [print(p, i+1, line.strip()) for p in files for i,line in enumerate(p.read_text(encoding='utf-8',errors='ignore').splitlines()) if any(t in line for t in terms)]"
   ```

**Expected result:** The only deployment command in active documentation is explicit Wrangler deployment with a Worker name; staging cannot accidentally inherit the generated production name.

---

## Task 3: Harden branch handling in the deploy workflow

**Objective:** Prevent arbitrary refs from reaching the secret-bearing deploy step or being embedded into shell source. The deploy workflow has no human `workflow_dispatch`; direct deployments are push-only, and the fixture refresh automation uses a validated reusable workflow call.

**Files:**
- Modify: `.github/workflows/deploy.yml:3-71`
- Modify: `.github/workflows/refresh-fixtures.yml:10-55`

**Implementation shape:**

1. Keep push triggers limited to `main` and `staging`.
2. Do not expose the secret-bearing deploy job through `workflow_dispatch`; local manual deployment is documented separately with explicit Worker names. Automation that commits with `GITHUB_TOKEN` must call this workflow through `workflow_call` with a matching supported branch input.
3. Keep a job-level full-ref guard as defense in depth so only matching branch refs can deploy directly or through a reusable call:

   ```yaml
   jobs:
     deploy:
       if: ${{ (github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging')) || (github.event_name == 'workflow_call' && ((github.ref == 'refs/heads/main' && inputs.branch == 'main') || (github.ref == 'refs/heads/staging' && inputs.branch == 'staging'))) }}
   ```

4. Pass the ref through an environment variable and use a quoted shell variable. Do not place `${{ github.ref_name }}` inside any `run:` block:

   ```yaml
   - name: Set Worker name for this branch
     env:
       BRANCH_NAME: ${{ github.ref_name }}
     run: |
       case "$BRANCH_NAME" in
         main)
           echo "WORKER_NAME=branderrna-hockey-liga" >> "$GITHUB_ENV"
           ;;
         staging)
           echo "WORKER_NAME=branderrna-hockey-liga-staging" >> "$GITHUB_ENV"
           ;;
         *)
           printf 'No Worker mapping for branch %s\n' "$BRANCH_NAME" >&2
           exit 1
           ;;
       esac
   ```

5. Use the same environment-variable pattern in the deploy log line:

   ```yaml
   - name: Deploy to Cloudflare Workers
     env:
       BRANCH_NAME: ${{ github.ref_name }}
       CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
       CLOUDFLARE_ACCOUNT_ID: "<existing public account id>"
     run: |
       printf 'Deploying branch %s to Worker %s\n' "$BRANCH_NAME" "$WORKER_NAME"
       npx --no-install wrangler --cwd .output deploy --name "$WORKER_NAME"
   ```

6. Do not change the existing secret value or record it in the repository.

**Validation:**

- Confirm the deploy workflow has no `workflow_dispatch` trigger and its job guard uses full `refs/heads/...` values.
- Confirm no `github.ref_name` expression remains inside a `run:` block.
- Confirm the workflow is accepted by GitHub:

  ```bash
  gh workflow view deploy.yml
  gh workflow view refresh-fixtures.yml
  ```

- Use a syntax-only shell test with a quote-bearing sample ref to confirm the generated shell remains valid. Do not execute the sample as a real workflow.

**Expected result:** The deploy workflow accepts direct pushes only for `main` and `staging`, and accepts reusable calls only when the caller ref and branch input match; tag/manual refs cannot reach secret-bearing deployment work, and supported refs cannot alter shell syntax through their names.

---

## Task 4: Add enforceable validation without introducing a large test framework

**Objective:** Make the checks that were run manually part of the repository's review/deploy path.

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `scripts/validate-fixtures.ts` (or use a project-approved equivalent)
- Modify: `package.json`
- Modify: `package-lock.json`

**Test strategy:**

1. Add a small data-invariant test script using the same Node TypeScript execution model already used by `scripts/refresh-fixtures.ts`. It should fail on:
   - duplicate match/team/division IDs;
   - unknown division or team IDs;
   - malformed `HH:MM` times;
   - dates outside `SEASON.start`/`SEASON.end`;
   - negative/non-integer scores;
   - `homeId === awayId` for resolved matches;
   - inconsistent standings arithmetic.

2. Add the smallest stable npm entry point:

   ```json
   {
     "scripts": {
       "test": "node --experimental-strip-types scripts/validate-fixtures.ts"
     }
   }
   ```

3. Create a pull-request CI workflow using Node 24 and the lockfile:

   ```yaml
   name: CI

   on:
     pull_request:
     workflow_dispatch:

   permissions:
     contents: read

   jobs:
     check:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
         - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
           with:
             node-version: "24"
             cache: npm
         - run: npm ci
         - run: npm test
         - run: npm run lint
         - run: npx --no-install tsc --noEmit
         - run: npx --no-install knip --include files,exports,dependencies,types
         - run: npm run build
   ```

4. Keep the deploy workflow's build step as a final packaging check; avoid duplicating live deployment.

**Expected result:** A pull request cannot rely only on local checks, and `npm test` has a real, deterministic meaning without adding Vitest or a Workers test pool prematurely.

**Tradeoff:** This adds one small custom test script instead of a full component/browser test suite. Component/UI coverage remains a separate product-quality investment.

---

## Task 5: Pin Wrangler and make compatibility settings deliberate

**Objective:** Reduce deployment drift after the safety fixes are complete.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts` or create/update a root `wrangler.jsonc`, only after validating Nitro's merge behavior
- Possibly generate: `worker-configuration.d.ts` if bindings are accessed directly

**Steps:**

1. Use the currently validated Wrangler version as the starting point:

   ```bash
   npm install --save-dev --save-exact wrangler@4.128.0
   ```

2. Change workflow/docs commands to use the project-local Wrangler via `npx --no-install`. Do not allow deployment to download a mutable CLI version.
3. Confirm the installed Nitro types and generated config support an explicit Cloudflare compatibility date. Prefer a checked-in source setting over relying on the build date.
4. If enabling observability, add only the documented non-secret config and verify it survives Nitro generation:

   ```jsonc
   {
     "observability": {
       "enabled": true,
       "head_sampling_rate": 1
     }
   }
   ```

5. Rebuild and inspect `.output/server/wrangler.json`; do not commit `.output`.

**Validation:**

```bash
npm ci
npm run build
npx --no-install wrangler --cwd .output deploy --dry-run --name branderrna-hockey-liga
npx --no-install wrangler --cwd .output deploy --dry-run --name branderrna-hockey-liga-staging
```

**Tradeoff:** Adding Wrangler to `devDependencies` increases the lockfile and install footprint, but prevents an unreviewed CLI version from being downloaded during deployment. If that churn is not justified, pin the workflow command as `npx wrangler@4.128.0` instead and record the tradeoff.

---

## Task 6: Decide the error-capture follow-up separately

**Objective:** Avoid making a speculative concurrency change while fixing deployment safety.

**Files:**
- Review: `src/lib/error-capture.ts`
- Review: `src/server.ts`

**Steps:**

1. Reproduce two overlapping failing SSR requests in a controlled test or local Worker harness.
2. Identify a supported TanStack Start/h3 request-local error hook or a way to catch the original error before h3 serializes it.
3. Replace the module-level `lastCapturedError` only when the replacement correlates an error to the same request and preserves the generic public error response.
4. Add a concurrency regression test before changing production behavior.

**Decision for this branch:** Keep the current behavior unchanged unless a safe request-local replacement is proven. Track this as a follow-up rather than widening the infrastructure cleanup.

---

## Task 7: Fix the branch-only formatting regression

**Objective:** Restore a clean formatter result without rewriting inherited documentation/style debt.

**Files:**
- Modify: `README.md`

**Steps:**

1. Add the missing blank line before `## Development`.
2. Run:

   ```bash
   npx prettier --check README.md
   ```

3. Do not reformat `docs/deploy.md`, `docs/fixtures-refresh.md`, or `src/styles.css` in this scoped fix unless a separate formatting cleanup is approved; their failures predate this branch.

---

## Task 8: Full verification and publication

**Objective:** Prove the corrected branch is safe before publishing its rewritten history.

**Commands:**

```bash
npm ci
npm test
npm run lint
npx --no-install tsc --noEmit
npx --no-install knip --include files,exports,dependencies,types
npm audit --audit-level=high
npm run build
npx --no-install wrangler --cwd .output deploy --dry-run --name branderrna-hockey-liga
npx --no-install wrangler --cwd .output deploy --dry-run --name branderrna-hockey-liga-staging
git diff --check
npx prettier --check README.md AGENTS.md CLAUDE.md docs/deploy.md docs/fixtures-refresh.md package.json vite.config.ts src/components/site.tsx src/data/league.ts src/lib/error-capture.ts src/routes/__root.tsx src/routes/index.tsx src/routes/table.tsx src/routes/about.tsx src/styles.css .github/workflows/deploy.yml .github/workflows/refresh-fixtures.yml
git status --short --branch
```

Run a local generated-Worker smoke test without live Cloudflare access:

- `/` -> `200`
- `/table` -> `200`
- `/about` -> `200`
- an unknown route -> `404`
- HTML contains the expected page title and route content.

Inspect the generated config and ensure:

- the Worker has `nodejs_compat`;
- assets bind to `env.ASSETS`;
- the generated package is within the observed upload size;
- staging and production names are supplied only at the explicit deploy boundary.

After all checks pass:

```bash
git status --short --branch
git diff --check origin/main...HEAD
git push --force-with-lease origin deprecate-obsolete-infra
gh api repos/branderrna/hockey-liga/compare/main...deprecate-obsolete-infra --jq '{status,ahead_by,behind_by,base_sha:.base_commit.sha,head_sha:(.commits[-1].sha)}'
```

Do not run a live `wrangler deploy`, trigger the production workflow, merge the branch, or alter live fixture data without explicit approval.

---

## Risks, rollback, and tradeoffs

- **Rebase risk:** the branch is already published. Use `git push --force-with-lease`, never plain `--force`. If a conflict is ambiguous, stop and preserve the pre-rebase remote SHA for recovery.
- **Generated data risk:** `origin/main` contains the newest fixture refresh. Keep its generated file during rebase; do not regenerate from the Google Sheet as part of this fix unless the refresh workflow is explicitly requested.
- **Deployment risk:** no live deploy is needed to validate the fix. Dry-runs plus the local Worker emulator are sufficient.
- **CI cost:** adding PR CI duplicates the build already done by deployment, but catches failures before a merge reaches `main`.
- **Dependency churn:** pinning Wrangler as a project dependency expands the lockfile, but ensures the secret-bearing deployment command uses the reviewed local version.
- **Error handling scope:** the shared error state is real technical debt, but a speculative rewrite could remove the current diagnostic recovery. Defer until a request-local design and regression test exist.
- **Formatting scope:** fix only the branch-introduced README regression; do not mix inherited formatter cleanup into the infrastructure fix.

## Completion criteria

- No active documentation or committed plan recommends `npx nitro deploy --prebuilt`.
- The deploy workflow has no human `workflow_dispatch`, uses full branch refs for push and reusable-call guards, and the fixture refresh workflow calls it only with a matching `main` input.
- Branch is rebased onto the latest `origin/main` with current fixture data preserved.
- `npm test`, lint, TypeScript, Knip, build, audit, both Wrangler dry-runs, and local Worker smoke checks pass.
- GitHub comparison reports zero commits behind `main` after the final fetch.
- The branch is published with `--force-with-lease`; no live Worker deployment occurs during the fix.
