import { describe, expect, it } from "vitest";
import {
  extractCompanyFromDomain,
  extractEmail,
  extractNameFromField,
  formatName,
  isValidEmail,
  shouldExcludeEmail,
} from "../src/core/filters";

describe("extractEmail", () => {
  it("pulls the address out of a display-name header", () => {
    expect(extractEmail('"Jane Doe" <jane@acme.com>')).toBe("jane@acme.com");
  });
  it("lowercases and trims a bare address", () => {
    expect(extractEmail("  Bob@Acme.COM ")).toBe("bob@acme.com");
  });
});

describe("isValidEmail", () => {
  it("accepts a normal human address", () => {
    expect(isValidEmail("jane@acme.com")).toBe(true);
  });
  it("rejects automated local-parts", () => {
    expect(isValidEmail("noreply@acme.com")).toBe(false);
    expect(isValidEmail("notifications@acme.com")).toBe(false);
    expect(isValidEmail("mailer-daemon@google.com")).toBe(false);
  });
  it("rejects known automated/newsletter domains", () => {
    expect(isValidEmail("digest@substack.com")).toBe(false);
    expect(isValidEmail("hi@mailchimp.com")).toBe(false);
  });
  it("rejects malformed input", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
  });
});

describe("shouldExcludeEmail", () => {
  it("excludes list/newsletter mail via List-Unsubscribe / List-Id", () => {
    expect(
      shouldExcludeEmail("news@acme.com", [{ name: "List-Unsubscribe", value: "<...>" }], "me.com"),
    ).toBe(true);
    expect(
      shouldExcludeEmail("news@acme.com", [{ name: "List-Id", value: "<...>" }], "me.com"),
    ).toBe(true);
  });
  it("excludes internal same-domain mail when on a company domain", () => {
    expect(shouldExcludeEmail("teammate@robomart.ai", [], "robomart.ai")).toBe(true);
  });
  it("does NOT exclude same-domain when the user is on a personal domain", () => {
    expect(shouldExcludeEmail("someone@gmail.com", [], "gmail.com")).toBe(false);
  });
  it("keeps a normal external human", () => {
    expect(shouldExcludeEmail("jane@acme.com", [], "robomart.ai")).toBe(false);
  });
});

describe("formatName", () => {
  it("title-cases a normal name", () => {
    expect(formatName("jane DOE", "jane@acme.com")).toBe("Jane Doe");
  });
  it("derives a name from the email when the name is junk", () => {
    expect(formatName("", "jane.doe@acme.com")).toBe("Jane Doe");
    expect(formatName("jane@acme.com", "jane.doe@acme.com")).toBe("Jane Doe");
  });
});

describe("extractCompanyFromDomain", () => {
  it("derives a company from a corporate domain", () => {
    expect(extractCompanyFromDomain("acme.com")).toBe("Acme");
    expect(extractCompanyFromDomain("mail.acme-corp.com")).toBe("Acme Corp");
  });
  it("returns null for personal domains", () => {
    expect(extractCompanyFromDomain("gmail.com")).toBeNull();
  });
});

describe("extractNameFromField", () => {
  it("uses the display name when present", () => {
    expect(extractNameFromField('"Jane Doe" <jane@acme.com>', "jane@acme.com")).toBe("Jane Doe");
  });
});
