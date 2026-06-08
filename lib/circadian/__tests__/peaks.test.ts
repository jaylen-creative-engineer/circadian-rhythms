import { describe, it, expect } from "vitest";
import { computePeaks, type PeakWindow } from "../peaks";
import { computeHrvAdjustment } from "../adjustments";
import { addMinutes } from "date-fns";

const wake = new Date("2025-06-01T07:00:00Z");
const groggy = { start: wake, end: addMinutes(wake, 30), durationMin: 30 };
const neutralHrv = computeHrvAdjustment(50, 50);

function peakDurations(peaks: PeakWindow[]) {
  return peaks.map(
    (p) => (p.end.getTime() - p.start.getTime()) / 60_000
  );
}

describe("computePeaks — sleep quality scaling", () => {
  it("returns longer peaks for high sleep performance", () => {
    const highSleep = computePeaks(wake, groggy, neutralHrv, 95, 22);
    const avgSleep = computePeaks(wake, groggy, neutralHrv, 70, 18);

    const [h1, h2] = peakDurations(highSleep);
    const [a1, a2] = peakDurations(avgSleep);

    expect(h1).toBeGreaterThan(a1);
    expect(h2).toBeGreaterThan(a2);
  });

  it("returns shorter peaks for low sleep performance", () => {
    const lowSleep = computePeaks(wake, groggy, neutralHrv, 40, 12);
    const avgSleep = computePeaks(wake, groggy, neutralHrv, 70, 18);

    const [l1, l2] = peakDurations(lowSleep);
    const [a1, a2] = peakDurations(avgSleep);

    expect(l1).toBeLessThan(a1);
    expect(l2).toBeLessThan(a2);
  });

  it("uses base durations for average sleep (perf 70, deep 18%)", () => {
    const peaks = computePeaks(wake, groggy, neutralHrv, 70, 18);
    const [d1, d2] = peakDurations(peaks);

    expect(d1).toBe(105);
    expect(d2).toBe(90);
  });

  it("high deep sleep pct extends peaks", () => {
    const deepSleep = computePeaks(wake, groggy, neutralHrv, 70, 30);
    const normalDeep = computePeaks(wake, groggy, neutralHrv, 70, 18);

    const [d1] = peakDurations(deepSleep);
    const [n1] = peakDurations(normalDeep);

    expect(d1).toBeGreaterThan(n1);
  });

  it("never drops below minimum durations", () => {
    const terrible = computePeaks(wake, groggy, neutralHrv, 0, 0);
    const [d1, d2] = peakDurations(terrible);

    expect(d1).toBeGreaterThanOrEqual(60);
    expect(d2).toBeGreaterThanOrEqual(45);
  });

  it("marks quality 'high' when HRV ratio >= 0.92 and perf >= 75", () => {
    const goodHrv = computeHrvAdjustment(50, 52);
    const peaks = computePeaks(wake, groggy, goodHrv, 80, 20);
    expect(peaks[0].quality).toBe("high");
    expect(peaks[1].quality).toBe("high");
  });

  it("marks quality 'moderate' when sleep performance is low", () => {
    const goodHrv = computeHrvAdjustment(50, 52);
    const peaks = computePeaks(wake, groggy, goodHrv, 60, 20);
    expect(peaks[0].quality).toBe("moderate");
  });

  it("marks quality 'moderate' when HRV ratio is low", () => {
    const lowHrv = computeHrvAdjustment(40, 55);
    const peaks = computePeaks(wake, groggy, lowHrv, 90, 20);
    expect(peaks[0].quality).toBe("moderate");
  });

  it("preserves peak offset calibration", () => {
    const withOffset = computePeaks(wake, groggy, neutralHrv, 70, 18, 30);
    const without = computePeaks(wake, groggy, neutralHrv, 70, 18, 0);

    const shift = withOffset[1].start.getTime() - without[1].start.getTime();
    expect(shift).toBe(30 * 60_000);
  });
});
