# How Circuit works

Circuit turns a noisy mailbox into a short, ranked list of relationships that need attention. It has two layers: a **deterministic engine** (code) and a **classification layer** (your AI client).

## 1. Find two-way conversations (deterministic)

A relationship that matters shows up as a **two-way** thread — one where you both sent and received real human mail.

1. **Identity** — resolve your own address and domain.
2. **Two searches** over the window (default 30 days): everything you sent (`from:me`) and everything you received (`-from:me`).
3. **Intersect by thread ID.** A thread present in both sets is two-way. One-way blasts, newsletters you never answered, and drafts fall away.
4. **Assemble** each thread: participants, per-message direction (sent/received), subjects, snippets, and the last-message timestamp + sender.

## 2. Filter the noise (deterministic)

Not every two-way thread is a real relationship. Circuit drops:

- **Automated senders** — local-parts like `noreply`, `no-reply`, `notifications`, `mailer-daemon`, `postmaster`, `automated`.
- **Newsletter/list mail** — messages carrying `List-Unsubscribe` or `List-Id` headers.
- **Known automated domains** — substack.com, mailchimp.com, beehiiv.com, hubspot.com, sendgrid.net, constantcontact.com, medium.com, notion.so, stripe.com.
- **Internal mail** — same-domain addresses when you're on a company domain (kept when you're on a personal domain like gmail.com).

The filter targets automated *senders*, not whole companies — a personal exchange with someone@bigco.com is kept.

## 3. Classify and triage (AI client)

The engine hands structured, **unclassified** conversations to your AI client (Claude, via the `circuit` skill). The skill then assigns:

**Relationship type** (10): investor, accelerator, partner, customer, vendor, recruit, advisor, internal, legal/finance, press/media, other — by the thread's primary purpose, not the person's title.

**Status:**

| Status | Condition |
|--------|-----------|
| Waiting on me | They sent last; you haven't replied |
| Waiting on them | You sent last; no reply yet |
| Active | Back-and-forth within the last 3 days |
| Stalled | Last exchange 14+ days ago |

**Deadlines** — explicit dates, meeting commitments, and time-sensitive phrasing, converted to absolute dates.

**Action items** — what you owe (requests in "waiting on me" threads, commitments you made) and what you're owed (things you asked for, commitments others made).

## 4. Output

A table sorted **Waiting on me → Active → Waiting on them → Stalled**, plus an upcoming-deadlines table and split action-item lists. See [examples/sample-output.md](../examples/sample-output.md).

## Why split the layers?

The deterministic engine is the genuinely reusable, testable part — and it's identical whether it runs in the MCP server or inside the skill on a Gmail connector. Classification is delegated to whatever model you already use, so the open-source tier needs no LLM key and costs nothing to run.
