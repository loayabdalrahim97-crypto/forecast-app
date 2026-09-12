import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: { subscription: { findUnique: vi.fn() }, forecast: { count: vi.fn() } },
}));

import { prisma } from "@/lib/db";
import { getUsageStatus, assertUnderUsageLimit } from "./usage";

describe("getUsageStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats a user with no subscription row as Free (limit 3)", async () => {
    (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.forecast.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

    const status = await getUsageStatus("user-1");
    expect(status.plan).toBe("free");
    expect(status.limit).toBe(3);
    expect(status.used).toBe(2);
    expect(status.remaining).toBe(1);
    expect(status.allowed).toBe(true);
  });

  it("blocks the 4th Free forecast (used >= limit)", async () => {
    (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.forecast.count as ReturnType<typeof vi.fn>).mockResolvedValue(3);

    const status = await getUsageStatus("user-1");
    expect(status.allowed).toBe(false);
    expect(status.remaining).toBe(0);
  });

  it("gives an active Pro Monthly subscriber the 30/month limit", async () => {
    (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ plan: "pro_monthly", status: "active" });
    (prisma.forecast.count as ReturnType<typeof vi.fn>).mockResolvedValue(29);

    const status = await getUsageStatus("user-2");
    expect(status.plan).toBe("pro_monthly");
    expect(status.limit).toBe(30);
    expect(status.allowed).toBe(true);
  });

  it("treats a CANCELLED or SUSPENDED subscription as Free, not Pro (never trust a non-active row)", async () => {
    (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ plan: "pro_annual", status: "cancelled" });
    (prisma.forecast.count as ReturnType<typeof vi.fn>).mockResolvedValue(3);

    const status = await getUsageStatus("user-3");
    expect(status.plan).toBe("free");
    expect(status.limit).toBe(3);
    expect(status.allowed).toBe(false);
  });

  it("only counts forecasts within the current calendar month window", async () => {
    (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.forecast.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    await getUsageStatus("user-1");
    const callArgs = (prisma.forecast.count as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArgs.where.userId).toBe("user-1");
    expect(callArgs.where.createdAt.gte).toBeInstanceOf(Date);
    expect(callArgs.where.createdAt.lt).toBeInstanceOf(Date);
    expect(callArgs.where.createdAt.lt.getTime()).toBeGreaterThan(callArgs.where.createdAt.gte.getTime());
  });
});

describe("assertUnderUsageLimit (transaction-scoped check)", () => {
  it("uses the transaction client, not the global prisma client, for both queries", async () => {
    const tx = {
      subscription: { findUnique: vi.fn().mockResolvedValue(null) },
      forecast: { count: vi.fn().mockResolvedValue(1) },
      // Unused by this function but present on a real TransactionClient.
    } as never;

    const status = await assertUnderUsageLimit(tx, "user-1");
    expect(status.allowed).toBe(true);
    expect((tx as { subscription: { findUnique: ReturnType<typeof vi.fn> } }).subscription.findUnique).toHaveBeenCalled();
    expect((tx as { forecast: { count: ReturnType<typeof vi.fn> } }).forecast.count).toHaveBeenCalled();
  });
});
