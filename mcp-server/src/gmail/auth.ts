// Google OAuth (installed-app / loopback flow) + token cache.
//
// One-time setup: the user runs `circuitcx-mcp auth`, which opens a browser,
// asks for read-only Gmail consent, and caches the refresh token at
// ~/.circuit/token.json (chmod 600). The MCP server then refreshes silently.
//
// Requires CIRCUIT_GOOGLE_CLIENT_ID and CIRCUIT_GOOGLE_CLIENT_SECRET in the env.
// See docs/connect-gmail.md (Path B) for how to create those.

import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { spawn } from "node:child_process";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_DIR = join(homedir(), ".circuit");
const TOKEN_PATH = join(TOKEN_DIR, "token.json");

interface StoredToken {
  access_token?: string;
  refresh_token: string;
  /** Epoch ms when the access token expires. */
  expiry?: number;
}

function clientCreds(): { client_id: string; client_secret: string } {
  const client_id = process.env.CIRCUIT_GOOGLE_CLIENT_ID;
  const client_secret = process.env.CIRCUIT_GOOGLE_CLIENT_SECRET;
  if (!client_id || !client_secret) {
    throw new Error(
      "Missing Google OAuth credentials. Set CIRCUIT_GOOGLE_CLIENT_ID and " +
        "CIRCUIT_GOOGLE_CLIENT_SECRET. See docs/connect-gmail.md (Path B).",
    );
  }
  return { client_id, client_secret };
}

async function loadToken(): Promise<StoredToken | null> {
  try {
    return JSON.parse(await readFile(TOKEN_PATH, "utf8")) as StoredToken;
  } catch {
    return null;
  }
}

async function saveToken(t: StoredToken): Promise<void> {
  await mkdir(TOKEN_DIR, { recursive: true });
  await writeFile(TOKEN_PATH, JSON.stringify(t, null, 2), { mode: 0o600 });
}

async function refresh(refresh_token: string): Promise<StoredToken> {
  const { client_id, client_secret } = clientCreds();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id,
      client_secret,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const token: StoredToken = {
    access_token: data.access_token,
    refresh_token,
    expiry: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  await saveToken(token);
  return token;
}

/** Returns a valid access token, refreshing if needed. Throws if not authenticated. */
export async function getAccessToken(): Promise<string> {
  const token = await loadToken();
  if (!token || !token.refresh_token) {
    throw new Error(
      "Not authenticated. Run `npx circuitcx-mcp auth` once to connect your Gmail account.",
    );
  }
  if (token.access_token && token.expiry && Date.now() < token.expiry - 60_000) {
    return token.access_token;
  }
  return (await refresh(token.refresh_token)).access_token!;
}

interface LoopbackHandle {
  port: number;
  redirectUri: string;
  codePromise: Promise<string>;
}

function startLoopbackServer(): Promise<LoopbackHandle> {
  return new Promise((resolve) => {
    let resolveCode!: (code: string) => void;
    let rejectCode!: (err: Error) => void;
    const codePromise = new Promise<string>((res, rej) => {
      resolveCode = res;
      rejectCode = rej;
    });

    const server = createServer((req, res) => {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html" });
      if (code) {
        res.end(
          "<html><body style='font-family:system-ui;background:#0a0a0a;color:#eee;text-align:center;padding-top:80px'>" +
            "<h2>&#10003; Circuit connected</h2><p>You can close this tab and return to your terminal.</p></body></html>",
        );
        server.close();
        resolveCode(code);
      } else {
        res.end(`<html><body>Authorization failed: ${error || "no code"}</body></html>`);
        server.close();
        rejectCode(new Error(error || "No authorization code returned"));
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({ port, redirectUri: `http://127.0.0.1:${port}`, codePromise });
    });
  });
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
  } catch {
    /* user can open the URL manually */
  }
}

/** Interactive one-time OAuth flow. Run via `circuitcx-mcp auth`. */
export async function runAuthFlow(): Promise<void> {
  const { client_id, client_secret } = clientCreds();
  const { redirectUri, codePromise } = await startLoopbackServer();

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", client_id);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES.join(" "));
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  process.stderr.write(
    `\nOpen this URL to authorize Circuit (read-only Gmail):\n\n${authUrl.toString()}\n\n`,
  );
  openBrowser(authUrl.toString());

  const code = await codePromise;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id,
      client_secret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  if (!data.refresh_token) {
    throw new Error(
      "No refresh token returned. Revoke prior access at " +
        "https://myaccount.google.com/permissions and run `circuitcx-mcp auth` again.",
    );
  }
  await saveToken({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry: Date.now() + (data.expires_in ?? 3600) * 1000,
  });
  process.stderr.write(`\n✓ Connected. Token cached at ${TOKEN_PATH}\n`);
}
