// Circuit MCP server — stdio transport.
//
//   circuitcx-mcp auth   → one-time interactive Gmail OAuth
//   circuitcx-mcp        → run the MCP server (default)
//
// Tools are intentionally thin and deterministic. They return structured,
// UNCLASSIFIED conversations; the AI client classifies and triages.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getAccessToken, runAuthFlow } from "./gmail/auth.js";
import { getProfileInfo, scanActiveConversations } from "./core/twoWay.js";

function errorResult(label: string, err: unknown) {
  return {
    isError: true as const,
    content: [
      {
        type: "text" as const,
        text: `${label} failed: ${err instanceof Error ? err.message : String(err)}`,
      },
    ],
  };
}

async function main(): Promise<void> {
  if (process.argv[2] === "auth") {
    await runAuthFlow();
    process.exit(0);
  }

  const server = new McpServer({ name: "circuit", version: "0.1.0" });

  server.tool(
    "circuit_scan_active_conversations",
    "Scan Gmail for active TWO-WAY conversations from the last N days — threads where the user both sent and received real human messages. Automated senders, newsletters, and one-way blasts are filtered out. Returns structured, UNCLASSIFIED conversations; the caller should assign each a relationship type and status, and extract deadlines + action items.",
    {
      days: z
        .number()
        .int()
        .min(1)
        .max(365)
        .default(30)
        .describe("How many days back to scan."),
      maxThreads: z
        .number()
        .int()
        .min(1)
        .max(200)
        .default(50)
        .describe("Max two-way threads to analyze (most recent first)."),
    },
    async ({ days, maxThreads }) => {
      try {
        const token = await getAccessToken();
        const result = await scanActiveConversations(token, { days, maxThreads });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return errorResult("circuit_scan_active_conversations", err);
      }
    },
  );

  server.tool(
    "circuit_get_profile",
    "Return the authenticated user's email address and domain, so the caller can tell the user's own messages from everyone else's.",
    {},
    async () => {
      try {
        const token = await getAccessToken();
        return {
          content: [{ type: "text", text: JSON.stringify(await getProfileInfo(token), null, 2) }],
        };
      } catch (err) {
        return errorResult("circuit_get_profile", err);
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("circuitcx-mcp running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
