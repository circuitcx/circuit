# Quickstart

Get Circuit running in about 5 minutes. Pick the path that matches how you use Claude.

## Path A — Claude with the Gmail connector (easiest)

No Google Cloud setup. Best if you use Claude Desktop or Claude Code with the built-in Gmail connector.

1. **Enable the Gmail connector** in Claude → see [connect-gmail.md → Path A](./connect-gmail.md#path-a--claude-gmail-connector).
2. **Install the skill** → see [install-skill.md](./install-skill.md). Fastest:
   ```bash
   claude plugin marketplace add circuitcx/circuit
   claude plugin install circuit@circuit
   ```
3. **Run it:**
   ```
   /circuit
   ```
   Circuit scans your last 30 days, finds active two-way conversations, and prints a classified table with deadlines and action items.

## Path B — Self-hosted MCP server (most portable)

Runs Circuit's deterministic engine locally and works with any MCP client. Requires a one-time Google OAuth setup.

1. **Create Google OAuth credentials** → [connect-gmail.md → Path B](./connect-gmail.md#path-b--self-hosted-mcp-server-byo-google-oauth).
2. **Add the server** to your client config (`examples/claude-desktop-config.json` or `examples/claude-code-mcp.json`), filling in your client ID/secret.
3. **Authorize once:**
   ```bash
   export CIRCUIT_GOOGLE_CLIENT_ID=...      # from step 1
   export CIRCUIT_GOOGLE_CLIENT_SECRET=...
   npx -y circuit-mcp auth
   ```
   A browser opens, you grant read-only Gmail access, and a token is cached at `~/.circuit/token.json`.
4. **Install the skill** ([install-skill.md](./install-skill.md)) and run `/circuit`. With the MCP server present, the skill calls `circuit_scan_active_conversations` and is markedly faster.

## What you get

A table of every active two-way conversation, grouped by **Waiting on me / Active / Waiting on them / Stalled**, classified by relationship type (investor, customer, partner, vendor, …), plus extracted **deadlines** and **action items**. See [examples/sample-output.md](../examples/sample-output.md).

## Privacy

On both paths your mail is read with **read-only** scope and processed in your own client / on your own machine. Circuit's open-source tier has no server that receives your email. See [faq.md](./faq.md).
