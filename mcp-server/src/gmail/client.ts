// Minimal Gmail REST client (no SDK dependency — uses global fetch, Node 18+).

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export interface GmailMessageRef {
  id: string;
  threadId: string;
}

async function gmailFetch(path: string, token: string): Promise<any> {
  const res = await fetch(`${GMAIL_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gmail API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

export async function getProfile(token: string): Promise<{ emailAddress: string }> {
  return gmailFetch("/profile", token);
}

/** List message refs (id + threadId) matching a Gmail search query, paginating. */
export async function fetchAllMessages(
  query: string,
  token: string,
  maxPages = 10,
): Promise<GmailMessageRef[]> {
  const all: GmailMessageRef[] = [];
  let pageToken: string | undefined;
  let page = 0;

  do {
    const params = new URLSearchParams({ maxResults: "500", q: query });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await gmailFetch(`/messages?${params.toString()}`, token);
    for (const m of data.messages || []) {
      all.push({ id: m.id, threadId: m.threadId });
    }
    pageToken = data.nextPageToken;
    page++;
  } while (pageToken && page < maxPages);

  return all;
}

/** Fetch a thread with metadata-only messages (headers + snippet + labelIds). */
export async function getThread(threadId: string, token: string): Promise<any> {
  const params = new URLSearchParams({ format: "metadata" });
  for (const h of ["From", "To", "Subject", "Date"]) {
    params.append("metadataHeaders", h);
  }
  return gmailFetch(`/threads/${threadId}?${params.toString()}`, token);
}
