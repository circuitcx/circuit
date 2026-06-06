# Connecting Gmail

Circuit needs **read-only** access to your Gmail to find active conversations. There are two ways to provide it. Path A is the easiest; Path B is the most portable.

---

## Path A — Claude Gmail connector

Use this if you run Claude Desktop or Claude Code and can enable the built-in Gmail connector. **No Google Cloud project required.**

1. In Claude, open **Settings → Connectors** (Claude Desktop) or your Claude Code connector settings.
2. Enable the **Gmail** connector and complete Google's consent screen (read-only access).
3. Install the Circuit skill ([install-skill.md](./install-skill.md)).
4. Run `/circuit`.

On this path, the skill drives Gmail through Claude's connector tools (e.g. `mcp__claude_ai_Gmail__search_threads` / `mcp__claude_ai_Gmail__get_thread`) and does the two-way detection itself. There is no separate profile tool, so the skill infers your address from your sent mail automatically.

That's it — skip the rest of this page unless you want the self-hosted server.

---

## Path B — Self-hosted MCP server (BYO Google OAuth)

Use this to run Circuit's engine locally in any MCP client. It needs your own Google OAuth credentials. This takes ~10 minutes once.

### 1. Create a Google Cloud project
- Go to <https://console.cloud.google.com/> and create a new project (e.g. "Circuit").

### 2. Enable the Gmail API
- **APIs & Services → Library** → search **Gmail API** → **Enable**.

### 3. Configure the OAuth consent screen
- **APIs & Services → OAuth consent screen**.
- User type: **External**.
- Fill app name, your support email, and developer email.
- **Scopes:** add `.../auth/gmail.readonly`.
- **Test users:** add your own Google account.
- **Leave the app in "Testing" mode.** That avoids Google's verification/CASA review. Testing mode is fine for personal use — only the test users you list can authorize, and that's exactly what you want for a self-hosted tool.

> ⚠️ **Restricted scope note.** `gmail.readonly` is a restricted scope. Publishing the app to "Production" for other people would require Google verification plus a third-party security (CASA) assessment — slow and costly, and not the intended use of the OSS server. Keep it in Testing and authorize your own account.

### 4. Create an OAuth client
- **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
- Application type: **Desktop app**.
- Copy the **Client ID** and **Client secret**.

### 5. Provide the credentials and authorize
```bash
export CIRCUIT_GOOGLE_CLIENT_ID=<your client id>
export CIRCUIT_GOOGLE_CLIENT_SECRET=<your client secret>
npx -y circuitcx-mcp auth
```
A browser window opens on a localhost loopback URL. Grant read-only Gmail access. The refresh token is cached at `~/.circuit/token.json` (chmod 600). You won't need to repeat this unless you revoke access.

### 6. Register the server with your client
Add the `circuit` server block from [`examples/claude-desktop-config.json`](../examples/claude-desktop-config.json) or [`examples/claude-code-mcp.json`](../examples/claude-code-mcp.json), with the same two env values. Restart the client.

### Re-authorizing / revoking
- Revoke at any time: <https://myaccount.google.com/permissions>.
- To switch accounts: delete `~/.circuit/token.json` and run `npx -y circuitcx-mcp auth` again.
- "No refresh token returned" usually means a stale prior grant — revoke as above and re-run.

---

## Which path should I use?

| | Path A (connector) | Path B (MCP server) |
|---|---|---|
| Google Cloud setup | None | ~10 min, one time |
| Works in | Claude Desktop / Claude Code | Any MCP client |
| Speed | Good | Faster (engine in code) |
| Where mail is processed | Your Claude client | Your machine |

Both are read-only and keep your conversation content off any Circuit server.
