# FAQ

### Is my email sent to a Circuit server?
No. The open-source skill and MCP server read your mailbox with **read-only** scope and process it inside your own AI client / on your own machine. There is no Circuit server in this path. (The separate hosted product at [circuit.cx](https://circuit.cx) is opt-in and clearly distinct.)

### What access does Circuit need?
Read-only Gmail (`gmail.readonly`). It never sends, deletes, or modifies mail.

### Skill vs MCP server — what's the difference?
- The **skill** is the `/circuit` command. It works with any Gmail backend.
- The **MCP server** is an optional local engine. When it's installed, the skill uses it (`circuit_scan_active_conversations`) and runs faster because two-way detection and filtering happen in code instead of the model paging through Gmail.

You can run the skill alone (via Claude's Gmail connector) or skill + MCP server.

### Do I need a Google Cloud project?
Only for the self-hosted MCP server (Path B). The Claude Gmail connector (Path A) needs no Google Cloud setup.

### Why does the MCP server not classify conversations itself?
By design. The server only does the deterministic work and holds no LLM key, so it's free and stateless to run. Your AI client does the classification with the model you already have.

### How far back does it scan?
30 days by default. With the MCP server you can pass `days` (1–365) and `maxThreads`.

### Does it read calendar events?
The open-source tier focuses on email. Calendar enrichment is part of the hosted product.

### It missed / misclassified a conversation.
Classification is the model's judgment on snippets, so it isn't perfect. The engine also filters aggressively (automated senders, lists, internal mail) — if a real contact is on an automated-looking address or a list domain, it may be dropped. Open an issue with the (redacted) pattern and we'll tune the filters.

### Is it really free?
Yes — MIT licensed. The hosted app (managed sync, dashboard, scheduled refresh, calendar) is the paid tier; the skill and MCP server are free forever.

### How do I uninstall / revoke?
- Skill: `claude plugin uninstall circuit@circuit`, or delete `~/.claude/skills/circuit`.
- MCP server: remove the `circuit` block from your client config; delete `~/.circuit/token.json`.
- Revoke Google access: <https://myaccount.google.com/permissions>.
