import { describe, it, expect } from "vitest";
import { computeDip } from "../dip";
import { computeHrvAdjustment } from "../adjustments";

const wake = new Date("2025-06-01T07:00:00Z");
const neutralHrv = computeHrvAdjustment(50, 50);

function dipDuration(dip: { start: Date; end: Date }) {
  return (dip.end.getTime() - dip.start.getTime()) / 60_000;
}

describe("computeDip — sleep quality scaling", () => {
  it("produces shorter dip for high sleep performance", () => {
    const good = computeDip(wake, 95, neutralHrv);
    const avg = computeDip(wake, 70, neutralHrv);

    expect(dipDuration(good)).toBeLessThan(dipDuration(avg));
  });

  it("produces longer dip for low sleep performance", () => {
    const poor = computeDip(wake, 40, neutralHrv);
    const avg = computeDip(wake, 70, neutralHrv);

    expect(dipDuration(poor)).toBeGreaterThan(dipDuration(avg));
  });

  it("returns base duration for average sleep (perf 70)", () => {
    const dip = computeDip(wake, 70, neutralHrv);
    expect(dipDuration(dip)).toBe(75);
  });

  it("depth is 'mild' for high performance", () => {
    const dip = computeDip(wake, 85, neutralHrv);
    expect(dip.depth).toBe("mild");
  });

  it("depth is 'moderate' for mid performance", () => {
    const dip = computeDip(wake, 65, neutralHrv);
    expect(dip.depth).toBe("moderate");
  });

  it("depth is 'deep' for low performance", () => {
    const dip = computeDip(wake, 40, neutralHrv);
    expect(dip.depth).toBe("deep");
  });

  it("never drops below minimum dip duration", () => {
    const best = computeDip(wake, 100, computeHrvAdjustment(60, 50));
    expect(dipDuration(best)).toBeGreaterThanOrEqual(40);
  });

  it("never exceeds maximum dip duration", () => {
    const worst = computeDip(wake, 0, computeHrvAdjustment(30, 50));
    expect(dipDuration(worst)).toBeLessThanOrEqual(105);
  });

  it("HRV adjustments still apply alongside sleep scaling", () => {
    const lowHrv = computeHrvAdjustment(35, 50);
    const dip = computeDip(wake, 70, lowHrv);
    expect(dipDuration(dip)).toBeGreaterThan(75);
  });
});
