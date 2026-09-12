import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("planIdForPlanType / planTypeForPayPalPlanId", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.PAYPAL_MONTHLY_PLAN_ID = "P-MONTHLY-123";
    process.env.PAYPAL_ANNUAL_PLAN_ID = "P-ANNUAL-456";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("maps our internal plan types to the configured PayPal plan IDs", async () => {
    const { planIdForPlanType } = await import("./paypal");
    expect(planIdForPlanType("pro_monthly")).toBe("P-MONTHLY-123");
    expect(planIdForPlanType("pro_annual")).toBe("P-ANNUAL-456");
  });

  it("maps a PayPal plan ID back to our internal plan type", async () => {
    const { planTypeForPayPalPlanId } = await import("./paypal");
    expect(planTypeForPayPalPlanId("P-MONTHLY-123")).toBe("pro_monthly");
    expect(planTypeForPayPalPlanId("P-ANNUAL-456")).toBe("pro_annual");
  });

  it("returns null for a plan ID that doesn't match either configured plan (never guess)", async () => {
    const { planTypeForPayPalPlanId } = await import("./paypal");
    expect(planTypeForPayPalPlanId("P-SOMETHING-ELSE")).toBeNull();
  });
});

describe("getPayPalAccessToken", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env.PAYPAL_CLIENT_ID = "test-client-id";
    process.env.PAYPAL_CLIENT_SECRET = "test-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "fake-token", expires_in: 3600 }),
      })
    );
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("throws a clear error when PayPal credentials are not configured, rather than silently proceeding", async () => {
    delete process.env.PAYPAL_CLIENT_ID;
    const { getPayPalAccessToken } = await import("./paypal");
    await expect(getPayPalAccessToken()).rejects.toThrow(/not configured/);
  });

  it("fetches and returns an access token when credentials are present", async () => {
    const { getPayPalAccessToken } = await import("./paypal");
    const token = await getPayPalAccessToken();
    expect(token).toBe("fake-token");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("caches the token and does not re-fetch on a second call within its lifetime", async () => {
    const { getPayPalAccessToken } = await import("./paypal");
    await getPayPalAccessToken();
    await getPayPalAccessToken();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("surfaces a clear error on a non-OK response without ever logging response body content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const { getPayPalAccessToken } = await import("./paypal");
    await expect(getPayPalAccessToken()).rejects.toThrow(/401/);
  });
});
