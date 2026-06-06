---
name: circuit
description: >
  Show active two-way email conversations from the last 30 days — threads where the user either replied to an incoming email OR sent an email that got a reply. Filters out newsletters, cold outreach, and automated messages. Outputs a classified table grouped by relationship type (investor, partner, vendor, accelerator, etc.) with status, deadlines, and action items. Works with the Circuit MCP server (faster) or any Gmail connector. ALWAYS use this skill when the user types /circuit, asks to see their active conversations, wants to review who they've been emailing back and forth with, wants a relationship activity map from email, asks about deadlines or action items from email, or asks who they need to follow up with.
---

# Circuit — Active Conversation Tracker

Surfaces every real two-way email conversation from the last 30 days, classifies each by relationship type, extracts deadlines and action items, and shows what needs the user's attention right now.

## Step 0 — Choose your backend (capability detection)

Circuit runs on top of email tools. Check which are available **in this order**:

1. **Circuit MCP server** — if a tool named `circuit_scan_active_conversations` is available, use it. It does all of the deterministic work for you (two-way detection, automated-sender filtering, thread assembly) in code and returns structured conversations. **Call it once, then skip straight to [Classification](#classification).** Use `circuit_get_profile` for the user's identity. This is the fast path.

2. **A Gmail connector** — otherwise, use whatever Gmail search/thread tools are exposed. Tool names vary by client:
   - Claude (first-party Gmail connector): `mcp__claude_ai_Gmail__search_threads`, `mcp__claude_ai_Gmail__get_thread`
   - Other connectors: `gmail_search_messages` / `gmail_read_thread`, etc.

   With a plain Gmail connector you must do the scanning and filtering yourself — follow the [Manual Execution Strategy](#manual-execution-strategy) below.

If neither is available, tell the user to either install the Circuit MCP server (`npx -y circuitcx`, see the repo's `docs/install-mcp-server.md`) or enable their client's Gmail connector, then try again.

### Fast path — using the Circuit MCP server

1. Call `circuit_scan_active_conversations({ days: 30, maxThreads: 50 })`.
2. It returns `{ userEmail, userDomain, conversations: [...] }` where each conversation already has `contactName`, `contactEmail`, `company`, `messages` (with `direction`, `subject`, `snippet`, `date`), `lastMessageDate`, and `lastMessageBy`. Automated senders, newsletters, and one-way blasts are already removed.
3. The server does **not** classify — go to [Classification](#classification) and do the type/status/deadline/action-item work on the returned `conversations`.

## Detecting the user's identity

Every step depends on knowing which messages are the user's (sent) vs. other people's (received). Never hardcode an email address.

- **MCP server:** `userEmail` / `userDomain` come back in the scan result (or call `circuit_get_profile`).
- **Gmail connector:** there is usually no profile tool. Infer identity by searching `in:sent newer_than:30d`, reading one sent message, and taking the `From` address as `USER_EMAIL`. Extract the domain (everything after `@`) as `USER_DOMAIN`.

## Manual Execution Strategy

*(Only needed on the Gmail-connector path. The MCP server already does all of this.)*

The goal is to find threads where both the user and at least one other real human exchanged messages in the last 30 days. The user's sent mail is the anchor — if they sent something, they're engaged.

### Step 1 — Pull the user's sent messages

1. Search `in:sent newer_than:30d` (first batch).
2. Paginate until you have at least 100 sent messages or exhaust 3 pages.
3. Collect all unique `threadId` values — these are threads the user actively participated in.

### Step 2 — Read threads to confirm a two-way exchange

For each unique threadId, read the thread. It qualifies as **two-way** if it has:

- at least one message the user sent (a `SENT` label, or a `From` matching `USER_EMAIL`), **and**
- at least one message from a non-user, non-automated sender (someone real replied or initiated).

Read threads in batches, most recent first. Aim for at least 15–20 thread reads before drawing conclusions.

### Step 3 — Catch inbound-initiated threads

Some two-way threads won't appear in the sent search if the user's reply is older. Run a supplementary search:

1. `in:inbox newer_than:30d -category:promotions -category:updates -category:social`
2. For thread IDs not already captured, read the thread and check for user participation.
3. Add any new two-way threads found.

### Filtering out noise

Skip these entirely — they aren't real conversations:

**Automated sender signals:**
- Local-parts: `noreply@`, `no-reply@`, `notifications@`, `mailer-daemon@`, `postmaster@`, `automated@`
- Domains that are almost always automated: substack.com, mailchimp.com, beehiiv.com, hubspot.com, sendgrid.net, constantcontact.com, medium.com, notion.so, stripe.com
- Subject patterns: "Newsletter", "Digest", "Issue #", "Weekly roundup", "Unsubscribe"
- Messages carrying `List-Unsubscribe` / `List-Id` headers, or `CATEGORY_PROMOTIONS` / `CATEGORY_UPDATES` labels with no personal reply from the user

**Important nuance:** Don't over-filter. Real humans at large companies (AWS, Google, etc.) have real conversations. The filter targets automated *senders*, not whole company domains. A personal back-and-forth with someone@amazon.com is a real thread.

## Classification

For each qualifying two-way thread, assign exactly one **Type** based on the subject, sender domain, message content, and snippets:

| Type | Signals |
|------|---------|
| **Investor** | VCs, angels, family offices, funding discussions, term sheets, cap table, "raise", "round", "invest", "due diligence", SAFE/convertible notes |
| **Accelerator** | Programs, cohorts, startup challenges, incubators (YC, Techstars, Plug & Play, 500 Global, SOSV, HAX, etc.), demo day, batch |
| **Partner** | Business partnerships, integrations, distribution deals, MOUs, APIs, co-marketing, pilots with other companies |
| **Customer** | Active or prospective customers, "demo", "trial", "order", "deploy", "onboarding", "pilot", pricing |
| **Vendor** | SaaS tools, service providers, contractors, cloud credits (AWS, GCP), software being evaluated, invoices, SOWs |
| **Recruit** | Candidates, recruiters, hiring conversations, "role", "position", "hiring pipeline", interviews, offers |
| **Advisor** | Board members, mentors, strategic advisors, advisory agreements |
| **Internal** | Same-domain emails (matches `USER_DOMAIN`), cofounders, team members |
| **Legal/Finance** | Lawyers, accountants, compliance, banking, investment banking, contracts, IP filings, tax |
| **Press/Media** | Journalists, podcasters, conference organizers, PR firms, speaking invitations |
| **Other** | Real human conversation that doesn't fit above |

When in doubt, classify by the primary purpose of the thread, not the person's title. A VC who's also advising → Investor. An accelerator PM discussing a pilot → Accelerator.

## Status Determination

Look at the **last message** in the thread (`lastMessageBy` from the MCP server, or the final message on the connector path) and when it was sent:

| Status | Condition |
|--------|-----------|
| **Waiting on me** | They sent the last message, user hasn't replied |
| **Waiting on them** | User sent the last message, no reply yet |
| **Active** | Back-and-forth within the last 3 days, no clear pending action |
| **Stalled** | Last exchange was 14+ days ago |

## Deadline & Action Item Extraction

This is what makes Circuit useful beyond a list of names. Scan message snippets and bodies for:

**Deadlines:**
- Explicit dates: "by Friday", "deadline is April 15", "due next week", "before the board meeting"
- Meeting commitments: "call on Thursday at 2pm", "let's meet next Tuesday"
- Time-sensitive context: "ASAP", "end of week", "this week", "urgent"
- Convert relative dates to absolute dates based on the message timestamp.

**Action items for the user** (things they need to do):
- Direct requests in "Waiting on me" threads — what did the other party ask for?
- Commitments the user made: "I'll send", "let me check", "will share", "I'll loop in", "let me regroup"
- Open questions directed at the user that haven't been answered

**Action items for others** (things the user is waiting on):
- Things the user explicitly asked for: "can you send", "please share", "let me know", "could you check"
- Commitments others made: "I'll get back to you", "will send over", "let me check with my team"

## Output Format

Present results in four sections.

### Section 1 — Conversations Table

```
## Circuit — Active Conversations (Last 30 Days)
*Scanned [date] · [N] sent threads · [T] two-way confirmed*

| # | Contact | Company | Type | Topic | Last Activity | Status |
|---|---------|---------|------|-------|---------------|--------|
```

Sort by **Waiting on me** first (these need action), then **Active**, then **Waiting on them**, then **Stalled**. Within each group, newest first. Keep the topic column to ~5 words.

### Section 2 — Upcoming Deadlines

```
## Upcoming Deadlines
| Date | Thread | Contact | What's Due |
|------|--------|---------|------------|
```

Sorted chronologically. Bold anything past due or due today. If none found, say so briefly.

### Section 3 — Action Items

```
## Your Action Items
- [ ] [What to do] — [Contact name] re: [thread topic]

## Waiting on Others
- [ ] [What they owe] — [Contact name] re: [thread topic] (last nudge: [date])
```

### Section 4 — Summary Line

```
**Summary:** X active · Y waiting on them · Z waiting on me · W stalled
**Top priorities:** [2–3 most urgent — deadlines + relationship importance]
```

## Performance & Coverage

- Note your coverage: how many sent threads scanned, how many threads read.
- On the connector path, read at least 15 threads before concluding.
- If the same contact has multiple active threads, list each separately.
- Keep the main table to ~25 rows; if more, show the most recent and note "N more not shown".
- Thread reading is the bottleneck — prioritize threads with recent activity and multiple messages.
- Everything runs locally against the user's own mailbox; conversation content never leaves their machine.
