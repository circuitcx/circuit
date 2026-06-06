// Shared types for the Circuit MCP server.
// The server returns UNCLASSIFIED structured conversations — the AI client
// (e.g. Claude running the `circuit` skill) assigns type/status/deadlines.

export interface ConversationMessage {
  /** Direction relative to the authenticated user. */
  direction: "sent" | "received";
  from: string;
  to: string;
  subject: string;
  snippet: string;
  /** ISO 8601 timestamp. */
  date: string;
}

export interface Participant {
  email: string;
  name: string;
}

export interface ActiveConversation {
  threadId: string;
  /** Primary non-user participant (best guess: most recent counterpart). */
  contactName: string;
  contactEmail: string;
  /** Company guessed from the contact's email domain, or null for personal domains. */
  company: string | null;
  participants: Participant[];
  messageCount: number;
  /** Subject of the most recent message in the thread. */
  subject: string;
  /** ISO 8601 timestamp of the most recent message. */
  lastMessageDate: string;
  /** Who sent the most recent message. */
  lastMessageBy: "me" | "them";
  messages: ConversationMessage[];
}

export interface ScanResult {
  userEmail: string;
  userDomain: string;
  /** ISO 8601 timestamp of when the scan ran. */
  scannedAt: string;
  daysScanned: number;
  sentThreadCount: number;
  receivedThreadCount: number;
  twoWayThreadCount: number;
  threadsAnalyzed: number;
  conversations: ActiveConversation[];
}

export interface Profile {
  email: string;
  domain: string;
}
