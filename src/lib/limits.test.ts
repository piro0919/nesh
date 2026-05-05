import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FREE_TIER, startOfCurrentMonthUtc } from "./limits";

describe("FREE_TIER", () => {
  it("exposes the caps the rest of the codebase relies on", () => {
    expect(FREE_TIER).toEqual({
      PROJECTS_PER_USER: 1,
      SUBSCRIBERS_PER_PROJECT: 5_000,
      NOTIFICATIONS_PER_MONTH: 10_000,
    });
  });
});

describe("startOfCurrentMonthUtc", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rounds down to UTC midnight on the first of the current month", () => {
    vi.setSystemTime(new Date("2026-05-15T13:42:11.500Z"));
    expect(startOfCurrentMonthUtc().toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });

  it("ignores local timezone — uses UTC month even just before midnight UTC", () => {
    // 2026-04-30 23:59 UTC is still April in UTC, regardless of local tz.
    vi.setSystemTime(new Date("2026-04-30T23:59:00Z"));
    expect(startOfCurrentMonthUtc().toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("rolls into the next month exactly at UTC midnight on the 1st", () => {
    vi.setSystemTime(new Date("2026-05-01T00:00:00Z"));
    expect(startOfCurrentMonthUtc().toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });
});
