import { describe, expect, it, afterEach } from "vitest";
import { isAdminEmail } from "./is-admin";

describe("isAdminEmail", () => {
  const originalEnv = process.env.ADMIN_EMAILS;

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalEnv;
  });

  it("fails closed (denies everyone) when ADMIN_EMAILS is not set", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail("anyone@example.com")).toBe(false);
  });

  it("denies a null or undefined email", () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("allows an email in the allowlist", () => {
    process.env.ADMIN_EMAILS = "admin@example.com, other@example.com";
    expect(isAdminEmail("admin@example.com")).toBe(true);
  });

  it("denies an email not in the allowlist", () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    expect(isAdminEmail("stranger@example.com")).toBe(false);
  });

  it("is case-insensitive", () => {
    process.env.ADMIN_EMAILS = "Admin@Example.com";
    expect(isAdminEmail("admin@example.com")).toBe(true);
  });
});
