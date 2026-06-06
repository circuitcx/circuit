# Contributing to Circuit

Thanks for helping out. Circuit is small on purpose — a skill plus a deterministic engine — so contributions are easy to reason about.

## Ways to contribute

- **Tune the noise filters.** False positives/negatives in two-way detection or automated-sender filtering are the highest-value fixes. They live in [`mcp-server/src/core/filters.ts`](./mcp-server/src/core/filters.ts) and are unit-tested.
- **Improve the skill.** Classification rubric, output format, and edge cases in [`skills/circuit/SKILL.md`](./skills/circuit/SKILL.md).
- **Docs.** Setup gotchas, client-specific notes, screenshots.
- **Bugs / features.** Open an issue first for anything non-trivial.

## Dev setup (MCP server)

```bash
git clone https://github.com/circuitcx/circuit.git
cd circuit/mcp-server
npm install
npm test          # vitest on the pure engine
npm run typecheck
npm run build
npm run dev       # run from source via tsx
```

Node 18+ required.

## Design boundaries (please keep these)

- **The MCP server stays deterministic and LLM-free.** No model API keys, no classification in the server. The engine returns structured, *unclassified* conversations; the AI client classifies. This is what keeps the free tier free and stateless — don't add an LLM dependency to `mcp-server/`.
- **`src/core/` is pure.** No network or filesystem I/O in `core/` — that lives in `gmail/`. Pure functions stay easy to test.
- **Read-only.** Circuit never sends, modifies, or deletes mail. Don't request write scopes.
- **No secrets in the repo.** Credentials come from env vars / the local token cache only.

## Pull requests

1. Branch from `main`.
2. Keep changes focused; match the surrounding style.
3. `npm test`, `npm run typecheck`, and `npm run build` must pass (CI runs them).
4. Add/adjust tests for engine changes.
5. Use clear commit messages; describe the "why" in the PR.

## Code style

TypeScript, ES modules, `strict` on. No formatter is enforced — match the existing two-space, comment-the-why style.

By contributing you agree your contributions are licensed under the [MIT License](./LICENSE).
