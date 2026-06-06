// Deterministic email validation, noise filtering, and name/company helpers.
// These are pure functions (no I/O) and are the unit-tested core of Circuit.
// Lifted from the Circuit Cloud sync engine and kept dependency-free.

export const AUTOMATED_PATTERNS = [
  "noreply",
  "no-reply",
  "donotreply",
  "do-not-reply",
  "notifications",
  "automated",
  "mailer-daemon",
  "postmaster",
];

export const AUTOMATED_DOMAINS = [
  "substack.com",
  "mailchimp.com",
  "beehiiv.com",
  "hubspot.com",
  "sendgrid.net",
  "constantcontact.com",
  "medium.com",
  "notion.so",
  "stripe.com",
];

export const PERSONAL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
];

/** Pull the bare address out of a raw header value like `"Jane Doe" <jane@x.com>`. */
export function extractEmail(field: string): string {
  const match = field.match(/<(.+?)>/);
  return (match ? match[1] : field).toLowerCase().trim();
}

/** True if the address looks like a real human, not an automated sender. */
export function isValidEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const lower = email.toLowerCase();
  for (const p of AUTOMATED_PATTERNS) {
    if (lower.includes(p)) return false;
  }
  const domain = lower.split("@")[1];
  if (AUTOMATED_DOMAINS.includes(domain)) return false;
  return true;
}

interface Header {
  name: string;
  value: string;
}

/**
 * True if this counterpart should be excluded from results:
 * automated sender, list/newsletter (List-Unsubscribe / List-Id), or
 * an internal same-domain address (when the user is on a company domain).
 */
export function shouldExcludeEmail(
  email: string,
  headers: Header[],
  userDomain: string,
): boolean {
  const lower = email.toLowerCase();
  if (AUTOMATED_PATTERNS.some((p) => lower.includes(p))) return true;

  const hasUnsubscribe = headers.some(
    (h) =>
      h.name.toLowerCase() === "list-unsubscribe" ||
      h.name.toLowerCase() === "list-id",
  );
  if (hasUnsubscribe) return true;

  if (
    userDomain &&
    email.endsWith(`@${userDomain}`) &&
    !PERSONAL_DOMAINS.includes(userDomain)
  ) {
    return true;
  }

  return false;
}

/** Normalize a display name; fall back to a Title-Cased local-part of the email. */
export function formatName(name: string, email: string): string {
  let clean = name.trim().replace(/"/g, "").replace(/\s+/g, " ");
  if (
    !clean ||
    clean.length < 2 ||
    clean.includes("@") ||
    clean.includes(".com") ||
    clean.length > 50
  ) {
    const prefix = email.split("@")[0];
    clean = prefix
      .replace(/[._-]/g, " ")
      .split(" ")
      .filter((w) => w.length > 1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return clean
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Guess a company name from a domain, or null for personal-email domains. */
export function extractCompanyFromDomain(domain: string): string | null {
  if (!domain || PERSONAL_DOMAINS.includes(domain.toLowerCase())) return null;
  const clean = domain.replace(/^(mail|email|smtp|webmail|www)\./i, "");
  const parts = clean.split(".");
  if (parts.length === 0) return null;
  return parts[0]
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Extract and normalize a display name directly from a raw header value. */
export function extractNameFromField(field: string, email: string): string {
  const rawName = field.replace(/<.+?>/, "").trim().replace(/"/g, "");
  return formatName(rawName || email.split("@")[0], email);
}
