// The deterministic Circuit engine: find active TWO-WAY conversations.
//
// "Two-way" = a thread where the user BOTH sent and received real human mail
// in the window. Automated senders, newsletters (List-Unsubscribe/List-Id),
// and internal same-domain mail are filtered out. Classification (type,
// status, deadlines, action items) is intentionally left to the AI client.

import { fetchAllMessages, getProfile, getThread } from "../gmail/client.js";
import {
  extractCompanyFromDomain,
  extractEmail,
  extractNameFromField,
  isValidEmail,
  shouldExcludeEmail,
} from "./filters.js";
import type {
  ActiveConversation,
  ConversationMessage,
  Profile,
  ScanResult,
} from "./types.js";

export async function getProfileInfo(token: string): Promise<Profile> {
  const p = await getProfile(token);
  const email = (p.emailAddress || "").toLowerCase();
  return { email, domain: email.split("@")[1] || "" };
}

export async function scanActiveConversations(
  token: string,
  opts: { days?: number; maxThreads?: number } = {},
): Promise<ScanResult> {
  const days = opts.days ?? 30;
  const maxThreads = opts.maxThreads ?? 50;

  const { email: userEmail, domain: userDomain } = await getProfileInfo(token);

  const sinceSec = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
  const base = `after:${sinceSec} -in:drafts -in:trash`;

  const [sent, received] = await Promise.all([
    fetchAllMessages(`from:me ${base}`, token, 10),
    fetchAllMessages(`-from:me ${base}`, token, 10),
  ]);

  // Preserve sent order (Gmail returns newest first) while de-duping thread ids.
  const sentThreadIds: string[] = [];
  const sentSet = new Set<string>();
  for (const m of sent) {
    if (!sentSet.has(m.threadId)) {
      sentSet.add(m.threadId);
      sentThreadIds.push(m.threadId);
    }
  }
  const receivedSet = new Set(received.map((m) => m.threadId));

  const twoWay = sentThreadIds.filter((id) => receivedSet.has(id));
  const candidates = twoWay.slice(0, maxThreads);

  const conversations: ActiveConversation[] = [];
  for (const threadId of candidates) {
    try {
      const conv = await buildConversation(threadId, token, userEmail, userDomain);
      if (conv) conversations.push(conv);
    } catch {
      // Skip threads that fail to fetch; one bad thread shouldn't kill the scan.
    }
  }

  conversations.sort(
    (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime(),
  );

  return {
    userEmail,
    userDomain,
    scannedAt: new Date().toISOString(),
    daysScanned: days,
    sentThreadCount: sentSet.size,
    receivedThreadCount: receivedSet.size,
    twoWayThreadCount: twoWay.length,
    threadsAnalyzed: conversations.length,
    conversations,
  };
}

async function buildConversation(
  threadId: string,
  token: string,
  userEmail: string,
  userDomain: string,
): Promise<ActiveConversation | null> {
  const thread = await getThread(threadId, token);
  const messages = thread.messages || [];

  const participants = new Map<string, string>(); // email -> display name
  const convMessages: ConversationMessage[] = [];
  let lastDate: Date | null = null;
  let lastBy: "me" | "them" = "them";
  let lastSubject = "";

  for (const message of messages) {
    const headers = message.payload?.headers || [];
    const get = (n: string): string =>
      headers.find((h: any) => h.name === n)?.value || "";

    const from = get("From");
    const to = get("To");
    const subject = get("Subject");
    const dateStr = get("Date");

    const fromEmail = extractEmail(from);
    const toEmail = extractEmail(to);
    const msgDate = new Date(dateStr || Number(message.internalDate));
    const isSentByMe = fromEmail === userEmail;
    const counterpartEmail = isSentByMe ? toEmail : fromEmail;
    const counterpartName = isSentByMe
      ? extractNameFromField(to, toEmail)
      : extractNameFromField(from, fromEmail);

    if (!isValidEmail(counterpartEmail)) continue;
    if (shouldExcludeEmail(counterpartEmail, headers, userDomain)) continue;

    if (!isSentByMe) participants.set(counterpartEmail, counterpartName);

    const iso = isNaN(msgDate.getTime()) ? "" : msgDate.toISOString();
    convMessages.push({
      direction: isSentByMe ? "sent" : "received",
      from: isSentByMe ? userEmail : counterpartEmail,
      to: isSentByMe ? counterpartEmail : userEmail,
      subject,
      snippet: (message.snippet || "").slice(0, 300),
      date: iso,
    });

    if (!isNaN(msgDate.getTime()) && (!lastDate || msgDate > lastDate)) {
      lastDate = msgDate;
      lastBy = isSentByMe ? "me" : "them";
      lastSubject = subject;
    }
  }

  if (participants.size === 0 || !lastDate) return null;

  // Primary contact = the most recent counterpart we received from, else the first participant.
  const lastReceived = [...convMessages].reverse().find((m) => m.direction === "received");
  const contactEmail = lastReceived ? lastReceived.from : [...participants.keys()][0];
  const contactName = participants.get(contactEmail) || contactEmail.split("@")[0];

  return {
    threadId,
    contactName,
    contactEmail,
    company: extractCompanyFromDomain(contactEmail.split("@")[1] || ""),
    participants: [...participants.entries()].map(([email, name]) => ({ email, name })),
    messageCount: convMessages.length,
    subject: lastSubject,
    lastMessageDate: lastDate.toISOString(),
    lastMessageBy: lastBy,
    messages: convMessages,
  };
}
