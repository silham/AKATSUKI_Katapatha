# AI tool disclosure

Team AKATSUKI used **Claude Code** (Anthropic's agentic coding tool, running
in the terminal and in VS Code) throughout the build phase of Katapatha. This
page states what it was used for, how its output was checked, and where the
record of it is.

## Tool

| | |
|---|---|
| Tool | Claude Code, by Anthropic |
| Models | Claude Opus 4.7, Opus 5, Opus 5.5 and Sonnet 5.5, as recorded in commit trailers |
| Where it ran | developers' own machines, against this repository |
| Project instructions | [apps/web/CLAUDE.md](../apps/web/CLAUDE.md), which points to `apps/web/AGENTS.md` |

No other AI coding or content tool was used in the repository.

## What it was used for

- **Writing code** across the API (Fastify routes, services, Prisma schema and
  migrations, the allocator and routing), the web app (Next.js screens built
  from the Designathon designs) and the native driver app (Expo).
- **Writing tests:** Vitest suites in `apps/api/src/test` and the mobile app,
  and the HTTP smoke script `scripts/demo-smoke.mjs`.
- **Writing documentation:** the files in `docs/`, this README and the code
  comments.
- **Reviewing and debugging:** reading diffs for bugs, tracing failures,
  and fixing the issues found in manual QA (see
  [qa/test-findings-2026-10-03.md](qa/test-findings-2026-10-03.md)).
- **Deployment configuration:** Dockerfiles and the Coolify compose file.

## What the team did

- Set the product scope, the role workflows and the rules in
  [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md), and produced the
  Designathon screens the build follows.
- Decided what to build and in what order, and gave Claude Code its tasks.
- Reviewed its changes before merging, with pull requests and branch
  ownership as set out in [CONVENTIONS.md](CONVENTIONS.md).
- Tested the product by hand in the browser, following
  [qa/testing-walkthrough.md](qa/testing-walkthrough.md), and on the deployed
  server.
- Owns every line in the repository, whoever or whatever typed it.

## How its output was checked

The same gates apply to AI-written and hand-written code:

- `pnpm typecheck && pnpm lint && pnpm test` in CI ([.github/workflows/ci.yml](../.github/workflows/ci.yml)).
- `pnpm contract:lint` and `pnpm gen:check`: the OpenAPI contract must be
  valid, and the generated client must match it.
- The API validates every request against the contract, so a handler cannot
  accept a field the contract does not declare.
- `pnpm demo:reset --yes && pnpm demo:smoke` walks the whole order-to-receipt
  flow over HTTP and fails on any break.
- A manual walkthrough of each role before submission.

## Data

The confidential competition dataset was not committed and was not pasted
into prompts as files. The committed fixture in
`apps/api/prisma/seed/fixture/` is synthetic.

## Where the record is

Every commit Claude Code helped write ends with a `Co-Authored-By: Claude …`
trailer. When this page was written, that was 90 of the 95 commits on `main`.
To count them yourself:

```bash
git log --format=%B | grep -ci "co-authored-by: claude"
```
