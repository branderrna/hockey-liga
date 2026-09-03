# Deprecate Obsolete Infra Implementation Plan

> **For Hermes:** Use the subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Remove unreachable Lovable/shadcn scaffolding and stale project infrastructure while preserving the live TanStack Start + Cloudflare Workers application and its Google Sheet refresh pipeline.

**Architecture:** Keep the active 20-file application closure, server error handling, generated TanStack route/data files, and fixture refresh workflow. Move shared agent guidance into `AGENTS.md`, keep MCP server configuration in `.mcp.json`/the Hermes profile, then replace the Lovable Vite wrapper with explicit project-owned configuration before pruning wrapper-only packages.

**Tech Stack:** TypeScript, React 19, TanStack Start/Router, Vite 8, Tailwind CSS 4, Nitro Cloudflare Workers, npm, GitHub Actions, code-review-graph MCP.

---

## Current context and evidence

- Branch: `deprecate-obsolete-infra`, already pushed from `main` at `ed54ce7`.
- Working tree is clean and local matches `origin/deprecate-obsolete-infra`.
- The code graph reports 157 nodes, 1,291 edges, and 67 files.
- The active application import closure is 20 files.
- All 46 files in `src/components/ui/` are outside that closure; together they are 4,361 lines and are only imported by other dead UI components.
- `src/hooks/use-mobile.tsx` and `src/lib/utils.ts` are also unreachable.
- Knip reports 48 unused source files, 42 unused direct dependencies, 8 unused exports, and 1 unused exported type.
- `npx tsc --noEmit` and `npm run build` pass. ESLint has 0 errors and 7 warnings, all in dead UI files or an unused export.
- `@lovable.dev/vite-tanstack-config` is still active and currently supplies real Vite/TanStack/Nitro/Tailwind/Cloudflare wiring, so it must be replaced before removal.
- `AGENTS.md` currently contains only the obsolete Lovable connection warning. It must be rewritten, not deleted.

## Assumptions and decisions

- npm is the canonical package manager because the README and GitHub Actions use `npm ci`, `npm run`, and `package-lock.json`.
- Unless Jeremy explicitly wants Bun support retained, remove the duplicate `bun.lock`/`bunfig.toml` setup after confirming no local workflow depends on it.
- Do not hand-edit `src/routeTree.gen.ts` or `src/data/matches.generated.ts`.
- Do not push directly to `main` during cleanup. Work only on `deprecate-obsolete-infra`, push that branch, and leave merging/release as a separate decision.
- Do not delete `src/server.ts`, `src/start.ts`, `src/lib/error-capture.ts`, or `src/lib/error-page.ts`; they are active production error-handling infrastructure.

---

## Task 1: Rewrite shared agent instructions

**Objective:** Replace the stale Lovable warning with portable project rules that Hermes, Claude Code, Codex, and other agents can use.

**Files:**
- Modify: `AGENTS.md`
- Review: `CLAUDE.md`
- Review: `.mcp.json`

**Steps:**

1. Replace the Lovable-only content in `AGENTS.md` with:
   - stack and deployment target
   - npm commands and validation requirements
   - generated-file rules for `routeTree.gen.ts` and `matches.generated.ts`
   - Google Sheet refresh rules
   - branch/deployment safety rules
   - the shared code-review-graph workflow
2. Put the portable CRG guidance in `AGENTS.md` because Hermes uses the first project-context file it finds and will prefer `AGENTS.md` over `CLAUDE.md`.
3. Keep MCP server configuration out of the instructions:
   - Claude Code server launch remains in `.mcp.json`.
   - Hermes server configuration remains in the active Hermes profile.
4. Keep `CLAUDE.md` only for Claude-specific behavior, or reduce it to a short Claude-specific supplement after confirming Claude’s context-file loading behavior. Avoid two conflicting sources of truth.
5. Review the absolute `cwd` in `.mcp.json`. If Claude Code supports a project-root variable, use it; otherwise document that the file is machine-specific rather than pretending it is portable.

**Validation:** Parse `.mcp.json`; inspect the final instruction files; verify Hermes still connects to `crg` and Claude Code still sees the project MCP config.

---

## Task 2: Remove Lovable metadata and stale documentation

**Objective:** Remove editor-connection artifacts and update documentation to describe the self-hosted GitHub/Cloudflare workflow.

**Files:**
- Delete: `.lovable/project.json`
- Delete or replace: `components.json` after the dead UI tree is removed
- Modify: `README.md`
- Modify: `bunfig.toml` or delete it with Bun support
- Modify: `docs/fixtures-refresh.md`
- Review: `CHANGELOG.md` (retain historical entries; do not rewrite history)

**Steps:**

1. Remove the README’s Lovable editor section and Lovable project URL.
2. Rewrite the development/contributing text so it reflects the actual branch and deployment workflow rather than “push straight to main and sync back into Lovable.”
3. Correct the fixture documentation’s stale Cloudflare Pages wording to Cloudflare Workers.
4. If npm is canonical, remove `bun.lock` and `bunfig.toml`; otherwise retain them and remove only the five unused Lovable package exclusions.
5. Keep historical Lovable references in `CHANGELOG.md` when they describe what happened at that time.

**Validation:** Search tracked files for `Lovable`, `.lovable`, and Cloudflare Pages references; every remaining match should be intentional historical context or an active migration dependency.

---

## Task 3: Remove Lovable-only browser telemetry

**Objective:** Remove the editor-preview error reporting hook without weakening the application’s existing error display/logging.

**Files:**
- Delete: `src/lib/lovable-error-reporting.ts`
- Modify: `src/routes/__root.tsx`

**Steps:**

1. Remove the `reportLovableError` import and call from `ErrorComponent`.
2. Keep `console.error(error)` and the existing retry/home actions.
3. Delete the module after confirming no other source file imports it.
4. Do not remove `src/lib/error-capture.ts`; it is used by `src/server.ts` for SSR error recovery.

**Validation:** Run typecheck, lint, production build, and a local error-boundary smoke test if available. Confirm no `__lovableEvents` or `__lovableReportRuntimeError` references remain in source.

---

## Task 4: Delete unreachable UI scaffolding

**Objective:** Remove the generated shadcn/Radix component library that is not used by any active route, server entrypoint, or script.

**Files:**
- Delete: all 46 files under `src/components/ui/`
- Delete: `src/hooks/use-mobile.tsx`
- Delete: `src/lib/utils.ts`
- Keep: `src/components/site.tsx`
- Keep: `src/components/division-tabs.tsx`
- Keep: `src/styles.css`

**Steps:**

1. Re-run the CRG minimal context and import-closure check before deletion.
2. Delete the 46 UI files and the two unreachable helpers as one coherent cleanup.
3. Do not delete generated routes, active site components, or data files merely because they are not directly imported by a route entrypoint.
4. Remove `components.json` once no component-generation workflow remains.

**Validation:** Run Knip/import-closure analysis; no active source file should import `@/components/ui`, `@/lib/utils`, or `@/hooks/use-mobile`.

---

## Task 5: Prune dead direct dependencies

**Objective:** Remove packages that only supported the deleted UI scaffolding.

**Files:**
- Modify: `package.json`
- Regenerate: `package-lock.json`
- Regenerate or delete: `bun.lock`, depending on the package-manager decision

**Initial removal set from Knip:**

```text
@hookform/resolvers
@radix-ui/react-accordion
@radix-ui/react-alert-dialog
@radix-ui/react-aspect-ratio
@radix-ui/react-avatar
@radix-ui/react-checkbox
@radix-ui/react-collapsible
@radix-ui/react-context-menu
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-hover-card
@radix-ui/react-label
@radix-ui/react-menubar
@radix-ui/react-navigation-menu
@radix-ui/react-popover
@radix-ui/react-progress
@radix-ui/react-radio-group
@radix-ui/react-scroll-area
@radix-ui/react-select
@radix-ui/react-separator
@radix-ui/react-slider
@radix-ui/react-slot
@radix-ui/react-switch
@radix-ui/react-tabs
@radix-ui/react-toggle
@radix-ui/react-toggle-group
@radix-ui/react-tooltip
@tanstack/router-plugin
class-variance-authority
clsx
cmdk
date-fns
embla-carousel-react
input-otp
react-day-picker
react-hook-form
react-resizable-panels
recharts
sonner
tailwind-merge
vaul
zod
```

**Steps:**

1. Remove packages only after the source deletion in Task 4.
2. Preserve active runtime/build packages: React, React DOM, TanStack Start/Router/Query, Lucide, Tailwind, Vite, Nitro, TypeScript, and the lint/format toolchain.
3. Reassess `@tanstack/router-plugin`, `@tailwindcss/vite`, and `vite-tsconfig-paths` against the replacement Vite config in Task 6 rather than deleting build support blindly.
4. Run `npm install` or the equivalent lockfile update, then verify `npm ci` succeeds from the resulting lockfile.

**Validation:** `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and Knip.

---

## Task 6: Replace the Lovable Vite wrapper

**Objective:** Own the build configuration instead of relying on `@lovable.dev/vite-tanstack-config`.

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`
- Regenerate: `package-lock.json`
- Review: `.github/workflows/deploy.yml`

**Steps:**

1. Inspect the installed TanStack Start/Vite exports before editing; do not guess plugin names or option shapes.
2. Recreate only the behavior the application actually needs:
   - React plugin
   - TanStack Start plugin and route generation
   - Tailwind CSS 4 integration
   - native Vite tsconfig path resolution where supported
   - Nitro Cloudflare-module output
   - the custom `server` entry pointing at `src/server.ts`
3. Preserve the current production contract: `npm run build` must produce the prebuilt output consumed by `npx --no-install wrangler --cwd .output deploy --name "$WORKER_NAME"`, with `WORKER_NAME` explicitly set to `branderrna-hockey-liga` for production or `branderrna-hockey-liga-staging` for staging.
4. Do not carry over Lovable sandbox asset proxying, bundled-dev behavior, editor HMR gates, or Lovable-specific diagnostics unless a real local workflow still depends on them.
5. Remove `@lovable.dev/vite-tanstack-config` only after the native config builds successfully.
6. Reassess and remove wrapper-only peer packages. Vite’s current warning indicates `vite-tsconfig-paths` can likely be replaced with native `resolve.tsconfigPaths` support.

**Validation:** Run local dev/preview if possible, `npm run build`, inspect `.output/server/wrangler.json`, and validate both deployment targets with `npx --no-install wrangler --cwd .output deploy --dry-run --name branderrna-hockey-liga` and `npx --no-install wrangler --cwd .output deploy --dry-run --name branderrna-hockey-liga-staging` before any release.

---

## Task 7: Remove stale exports and generated theme tokens

**Objective:** Reduce the remaining public API and CSS surface after the structural cleanup.

**Files:**
- Modify: `src/components/site.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/lib/error-capture.ts`
- Modify: `src/data/league.ts`
- Modify: `src/styles.css`

**Steps:**

1. Remove unnecessary `export` modifiers from `SiteHeader`, `SiteFooter`, `fmtDate`, and `describeError`.
2. Remove or de-export `leagues`, the `matches` re-export, `teamById`, `upcomingOf`, and the exported `League` type according to their remaining internal uses.
3. Remove shadcn-only CSS tokens for charts/sidebar/popovers only after checking active class usage.
4. Remove `tw-animate-css` if no active code uses its utilities; preserve Tailwind itself and all semantic tokens used by the live routes.

**Validation:** Typecheck, lint, build, and a visual smoke test of `/`, `/table`, and `/about`.

---

## Task 8: Final review and branch delivery

**Objective:** Prove the cleanup is safe and publish the branch without merging it.

**Validation commands:**

```sh
npm ci
npm run lint
npx tsc --noEmit
npm run build
npx knip --include files,exports,dependencies,types

git diff --check
git status --short --branch
```

Also verify:

- no active source imports deleted UI or Lovable telemetry
- generated route/data files remain intact
- `npm run refresh-fixtures` is still available, but do not overwrite generated data unless a fixture refresh is intentionally part of the task
- Cloudflare deployment configuration still targets Workers
- the repository has one clear package-manager story
- AGENTS/CLAUDE/MCP instructions do not contradict each other

After an independent review of the diff:

```sh
git add <intentional files>
git commit -m "chore: remove obsolete Lovable infrastructure"
git push origin deprecate-obsolete-infra
```

Do not merge or push to `main` as part of this cleanup pass.

## Risks and open decisions

- **Bun support:** Removing `bun.lock`/`bunfig.toml` is correct only if npm is the intended sole package manager. The current CI and docs strongly suggest that it is.
- **Native Vite replacement:** This is the highest-risk step. The Lovable wrapper currently supplies more than editor integration, including Nitro and Cloudflare behavior. Replace it only with a build that reproduces the deploy contract.
- **Telemetry:** Removing Lovable browser reporting is safe only if no external telemetry service still consumes those globals. Existing console/server error handling remains.
- **MCP portability:** `.mcp.json` currently contains an absolute Windows `cwd`. Confirm Claude Code’s project-root variable support before making it portable; do not commit a fake portable configuration.
- **Generated files:** `routeTree.gen.ts` and `matches.generated.ts` are generated but active. They are not obsolete and must remain in the repository.
- **Query client:** `@tanstack/react-query` is active through the router context/provider even though no query hooks are currently used. Treat removing it as a separate simplification, not part of dead-code deletion.
