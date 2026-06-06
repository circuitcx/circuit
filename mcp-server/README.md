# circuitcx

The MCP server for **[Circuit](https://github.com/circuitcx/circuit)** — a deterministic, LLM-free engine that scans Gmail for your active **two-way** conversations and hands them to your AI client to classify and triage.

It does the genuinely reusable work in code (two-way detection, automated-sender/newsletter filtering, thread assembly) and returns structured, *unclassified* conversations. Classification, deadlines, and action items are produced by your client (e.g. Claude running the [`/circuit` skill](https://github.com/circuitcx/circuit)). No LLM key lives in the server — it's free and stateless to run.

## Install & connect

Requires Node 18+ and your own Google OAuth credentials (read-only Gmail). See [Connect Gmail → Path B](https://github.com/circuitcx/circuit/blob/main/docs/connect-gmail.md).

```bash
export CIRCUIT_GOOGLE_CLIENT_ID=...
export CIRCUIT_GOOGLE_CLIENT_SECRET=...
npx -y circuitcx auth      # one-time browser consent, caches ~/.circuit/token.json
```

Register it with any MCP client:

```json
{
  "mcpServers": {
    "circuit": {
      "command": "npx",
      "args": ["-y", "circuitcx"],
      "env": {
        "CIRCUIT_GOOGLE_CLIENT_ID": "your-google-oauth-client-id",
        "CIRCUIT_GOOGLE_CLIENT_SECRET": "your-google-oauth-client-secret"
      }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `circuit_scan_active_conversations` | Scan Gmail for active two-way threads in the last `days` (default 30, `maxThreads` default 50). Returns structured, unclassified conversations. |
| `circuit_get_profile` | The authenticated user's email + domain. |

## Privacy

Read-only Gmail scope. Tokens are cached locally (`~/.circuit/token.json`, chmod 600) and mail is processed on your machine — nothing is sent to any Circuit server.

MIT © Circuit · [full docs & skill](https://github.com/circuitcx/circuit)
