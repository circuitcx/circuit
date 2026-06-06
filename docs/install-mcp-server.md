# Installing the Circuit MCP server

The MCP server (`circuitcx-mcp` on npm) runs Circuit's deterministic engine locally and exposes it to any MCP client. It's optional — the skill also works through Claude's Gmail connector — but it's faster and client-agnostic.

## Prerequisites

- Node.js 18+
- Google OAuth credentials (Client ID + secret) — see [connect-gmail.md → Path B](./connect-gmail.md#path-b--self-hosted-mcp-server-byo-google-oauth).

## 1. Authorize once

```bash
export CIRCUIT_GOOGLE_CLIENT_ID=...
export CIRCUIT_GOOGLE_CLIENT_SECRET=...
npx -y circuitcx-mcp auth
```

This opens a browser, asks for **read-only** Gmail consent, and caches a refresh token at `~/.circuit/token.json`.

## 2. Register the server

Add this to your client config (or copy from [`examples/`](../examples)):

```json
{
  "mcpServers": {
    "circuit": {
      "command": "npx",
      "args": ["-y", "circuitcx-mcp"],
      "env": {
        "CIRCUIT_GOOGLE_CLIENT_ID": "your-google-oauth-client-id",
        "CIRCUIT_GOOGLE_CLIENT_SECRET": "your-google-oauth-client-secret"
      }
    }
  }
}
```

- **Claude Desktop:** Settings → Developer → Edit Config (`claude_desktop_config.json`), then restart.
- **Claude Code:** save as `.mcp.json` in your project (or merge into an existing one).

## Tools exposed

| Tool | What it does |
|------|--------------|
| `circuit_scan_active_conversations` | Scans Gmail for active two-way threads in the last N days and returns structured, **unclassified** conversations (the AI client classifies + triages). Params: `days` (default 30), `maxThreads` (default 50). |
| `circuit_get_profile` | Returns the authenticated user's email + domain. |

## Design note

The server does **no** AI classification and holds **no** LLM key — it only does the deterministic, reusable work (two-way detection, automated-sender filtering, thread assembly). Your AI client (e.g. Claude via the `circuit` skill) does the classification. That keeps the server cheap, fast, and stateless.

## Local development

```bash
git clone https://github.com/circuitcx/circuit.git
cd circuit/mcp-server
npm install
npm test          # unit tests on the pure engine
npm run build
npm run dev       # run from source with tsx
```

## Troubleshooting

- **"Not authenticated"** → run `npx -y circuitcx-mcp auth`.
- **"Missing Google OAuth credentials"** → export the two env vars (also set them in the client config `env`).
- **`Gmail API 403`** → confirm the Gmail API is enabled and your account is a Test User on the OAuth consent screen.
- **Token issues** → delete `~/.circuit/token.json` and re-run `auth`.
