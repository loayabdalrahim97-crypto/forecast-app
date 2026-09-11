import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock("./is-admin", () => ({ isAdminEmail: vi.fn() }));

import { prisma } from "@/lib/db";
import { isAdminEmail } from "./is-admin";
import { checkCurrentUserAdmin } from "./check-admin";

describe("checkCurrentUserAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails closed with no userId", async () => {
    const result = await checkCurrentUserAdmin(null);
    expect(result.isAdmin).toBe(false);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("fails closed if the user doesn't exist", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await checkCurrentUserAdmin("user-1");
    expect(result.isAdmin).toBe(false);
  });

  it("trusts the DB role directly when already 'admin' - no bootstrap check needed", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-1", email: "a@b.com", role: "admin" });
    const result = await checkCurrentUserAdmin("user-1");
    expect(result.isAdmin).toBe(true);
    expect(isAdminEmail).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("bootstraps role to admin exactly once when the email is on ADMIN_EMAILS and role is still 'user'", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-1", email: "owner@site.com", role: "user" });
    (isAdminEmail as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const result = await checkCurrentUserAdmin("user-1");
    expect(result.isAdmin).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { role: "admin" } });
  });

  it("denies a normal user not on the bootstrap list, without touching the DB role", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-2", email: "regular@site.com", role: "user" });
    (isAdminEmail as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const result = await checkCurrentUserAdmin("user-2");
    expect(result.isAdmin).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
