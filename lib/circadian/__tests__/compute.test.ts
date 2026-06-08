import { describe, it, expect } from "vitest";
import { computeCircadianPrediction } from "../compute";
import type { CycleInput } from "../../types";

function makeInput(overrides: Partial<CycleInput> = {}): CycleInput {
  const wake = new Date("2025-06-01T07:00:00Z");
  return {
    wakeTime: wake,
    sleepStart: new Date("2025-05-31T23:00:00Z"),
    sleepEnd: wake,
    deepPct: 18,
    sleepPerformance: 70,
    hrvLastNight: 50,
    hrvBaseline: 50,
    date: "2025-06-01",
    lastSyncAt: new Date(),
    ...overrides,
  };
}

function parseDuration(start: string, end: string) {
  return (new Date(end).getTime() - new Date(start).getTime()) / 60_000;
}

describe("computeCircadianPrediction — end-to-end sleep quality scaling", () => {
  it("high sleep quality produces longer peaks and shorter dip than low quality", () => {
    const goodSleep = computeCircadianPrediction(
      makeInput({ sleepPerformance: 95, deepPct: 25 })
    );
    const poorSleep = computeCircadianPrediction(
      makeInput({ sleepPerformance: 40, deepPct: 10 })
    );

    const goodPeak1 = parseDuration(goodSleep.peaks[0].start, goodSleep.peaks[0].end);
    const poorPeak1 = parseDuration(poorSleep.peaks[0].start, poorSleep.peaks[0].end);
    expect(goodPeak1).toBeGreaterThan(poorPeak1);

    const goodDip = parseDuration(goodSleep.dip.start, goodSleep.dip.end);
    const poorDip = parseDuration(poorSleep.dip.start, poorSleep.dip.end);
    expect(goodDip).toBeLessThan(poorDip);
  });

  it("average inputs produce baseline durations", () => {
    const result = computeCircadianPrediction(makeInput());
    const peak1 = parseDuration(result.peaks[0].start, result.peaks[0].end);
    const peak2 = parseDuration(result.peaks[1].start, result.peaks[1].end);
    const dip = parseDuration(result.dip.start, result.dip.end);

    expect(peak1).toBe(105);
    expect(peak2).toBe(90);
    expect(dip).toBe(75);
  });
});
