<div align="center">

# Circuit

**Relationship intelligence for founders — as an open-source Claude skill.**

Run `/circuit` in Claude and it scans your inbox for every active two-way conversation, classifies each by relationship type, and surfaces who you're waiting on, what's due, and what you owe.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![npm](https://img.shields.io/npm/v/circuitcx-mcp.svg)](https://www.npmjs.com/package/circuitcx-mcp)
[![CI](https://github.com/circuitcx/circuit/actions/workflows/ci.yml/badge.svg)](https://github.com/circuitcx/circuit/actions/workflows/ci.yml)

[Quickstart](./docs/quickstart.md) · [Connect Gmail](./docs/connect-gmail.md) · [How it works](./docs/how-it-works.md) · [Hosted version](https://circuit.cx)

</div>

---

Your inbox is your real CRM — it's just unreadable. Circuit reads it for you. It finds the threads where you and a real human are actually going back and forth, throws away the newsletters and no-reply noise, and tells you the only thing that matters: **what needs your attention right now.**

```
## Circuit — Active Conversations (Last 30 Days)
*Scanned Jun 7 · 64 sent threads · 22 two-way confirmed*

| # | Contact     | Company  | Type     | Topic                | Last  | Status            |
|---|-------------|----------|----------|----------------------|-------|-------------------|
| 1 | Sarah Chen  | Sequoia  | Investor | Series A term sheet  | Jun 6 | 🔴 Waiting on me  |
| 2 | Marcus Webb | Stripe   | Partner  | API integration call | Jun 6 | 🟢 Active         |
| 3 | Priya Patel | Notion   | Customer | Enterprise pilot     | Jun 5 | 🔴 Waiting on me  |

## Your Action Items
- [ ] Send the updated cap table — Sarah Chen re: Series A (due Fri)
- [ ] Reply with pilot timeline — Priya Patel re: Notion pilot
```

[See full sample output →](./examples/sample-output.md)

## Why Circuit

- **Two-way only.** It anchors on threads you actually replied to or that got a reply — not cold outreach, not blasts.
- **Ruthless noise filtering.** `noreply@`, newsletters (`List-Unsubscribe`), and automated domains are dropped in code.
- **Actually actionable.** Relationship type, status, deadlines, and action items — not just a list of names.
- **Private by default.** Read-only Gmail, processed in your own client / on your machine. No Circuit server sees your mail.
- **Free and open.** MIT. The skill and the engine cost nothing to run.

## Quickstart

**Skill (Claude Code):**
```bash
claude plugin marketplace add circuitcx/circuit
claude plugin install circuit@circuit
/circuit
```

**Optional local engine (any MCP client):**
```bash
export CIRCUIT_GOOGLE_CLIENT_ID=...  CIRCUIT_GOOGLE_CLIENT_SECRET=...
npx -y circuitcx-mcp auth      # one-time, read-only Gmail consent
```

Full setup — including the zero-Google-Cloud path via Claude's Gmail connector — is in **[docs/quickstart.md](./docs/quickstart.md)**.

## Two ways to run

| | Skill (`/circuit`) | + MCP server (`circuitcx-mcp`) |
|---|---|---|
| Install | plugin / copy to `~/.claude/skills` | `npx -y circuitcx-mcp` |
| Gmail access | Claude's Gmail connector | your own Google OAuth (read-only) |
| Google Cloud setup | none | ~10 min, one time |
| Speed | good | faster (engine runs in code) |
| Works in | Claude Desktop / Claude Code | any MCP client |

The skill auto-detects the MCP server and uses it when present; otherwise it falls back to the Gmail connector. See [install-skill.md](./docs/install-skill.md) and [install-mcp-server.md](./docs/install-mcp-server.md).

## Architecture

```
   /circuit  ── the skill (this repo, skills/circuit)
       │   classifies type + status, extracts deadlines & action items
       ▼
   Claude  (your AI client)
       │   calls a Gmail tool:
       ├──────────────►  circuitcx-mcp server  ──►  Gmail API (read-only)
       │                 deterministic engine (this repo, mcp-server/)
       └──────────────►  Claude Gmail connector  ──►  Gmail API (read-only)
```

The **deterministic engine** (two-way detection + noise filtering + thread assembly) is the reusable, unit-tested core. **Classification** is delegated to your AI client — so the open-source tier needs no LLM key and is free to run. [More →](./docs/how-it-works.md)

## Free vs Hosted

Circuit is open core. This repo is the free tier. The hosted app adds the convenience layer.

| | Free (this repo) | [Hosted](https://circuit.cx) |
|---|---|---|
| `/circuit` skill + local engine | ✅ | ✅ |
| Runs on demand in Claude | ✅ | ✅ |
| Always-on background sync | — | ✅ |
| Web dashboard + history | — | ✅ |
| Calendar enrichment | — | ✅ |
| Managed — no setup | — | ✅ |

## Project layout

```
circuit/
├── skills/circuit/SKILL.md   the /circuit skill (classification + output)
├── mcp-server/               circuitcx-mcp — deterministic Gmail engine (npm)
│   ├── src/core/             pure, unit-tested filters + two-way detection
│   └── src/gmail/            Gmail REST client + OAuth
├── docs/                     setup, connect-gmail, how-it-works, faq
└── examples/                 client config snippets + sample output
```

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). The pure engine in `mcp-server/src/core/` is the best place to start, and it's covered by tests (`npm test`).

## Security & privacy

Read-only scope; nothing leaves your machine on the open-source path. Report vulnerabilities per [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © Circuit
