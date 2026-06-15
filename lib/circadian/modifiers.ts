import type { HrvAdjustment } from "./adjustments";

export interface CircadianModifiers {
  groggyExtendMin: number;
  groggyShortenMin: number;
  dipExtendMin: number;
  dipCompressMin: number;
  peakShiftMin: number;
  melatoninAdvanceMin: number;
  sleepTargetAdvanceMin: number;
  peakQualityDowngrade: boolean;
}

const NEUTRAL: CircadianModifiers = {
  groggyExtendMin: 0,
  groggyShortenMin: 0,
  dipExtendMin: 0,
  dipCompressMin: 0,
  peakShiftMin: 0,
  melatoninAdvanceMin: 0,
  sleepTargetAdvanceMin: 0,
  peakQualityDowngrade: false,
};

export function hrvToModifiers(adj: HrvAdjustment): CircadianModifiers {
  return {
    groggyExtendMin: adj.groggyExtendMin,
    groggyShortenMin: adj.groggyShortenMin,
    dipExtendMin: adj.dipExtendMin,
    dipCompressMin: adj.dipCompressMin,
    peakShiftMin: adj.peakShiftMin,
    melatoninAdvanceMin: 0,
    sleepTargetAdvanceMin: 0,
    peakQualityDowngrade: adj.ratio < 0.85,
  };
}

/** WHOOP recovery zones: red <34, yellow 34–66, green ≥67 */
export function computeRecoveryModifiers(recoveryScore: number): CircadianModifiers {
  const score = Math.max(0, Math.min(100, recoveryScore));

  if (score < 34) {
    return {
      groggyExtendMin: 12,
      groggyShortenMin: 0,
      dipExtendMin: 12,
      dipCompressMin: 0,
      peakShiftMin: -25,
      melatoninAdvanceMin: 15,
      sleepTargetAdvanceMin: 20,
      peakQualityDowngrade: true,
    };
  }

  if (score < 67) {
    return {
      groggyExtendMin: 5,
      groggyShortenMin: 0,
      dipExtendMin: 5,
      dipCompressMin: 0,
      peakShiftMin: -10,
      melatoninAdvanceMin: 5,
      sleepTargetAdvanceMin: 10,
      peakQualityDowngrade: false,
    };
  }

  return {
    groggyExtendMin: 0,
    groggyShortenMin: 10,
    dipExtendMin: 0,
    dipCompressMin: 10,
    peakShiftMin: 15,
    melatoninAdvanceMin: 0,
    sleepTargetAdvanceMin: 0,
    peakQualityDowngrade: false,
  };
}

/** Sleep debt from WHOOP sleep_needed.need_from_sleep_debt_milli */
export function computeSleepDebtModifiers(
  debtMillis: number,
  baselineMillis?: number | null
): CircadianModifiers {
  if (debtMillis <= 0) return NEUTRAL;

  const debtMin = debtMillis / 60_000;
  const baselineMin = baselineMillis ? baselineMillis / 60_000 : 480;
  const debtRatio = debtMin / baselineMin;

  const scale = Math.min(1.5, debtRatio * 2);

  return {
    groggyExtendMin: Math.round(Math.min(20, debtMin / 12) * scale),
    groggyShortenMin: 0,
    dipExtendMin: Math.round(Math.min(25, debtMin / 10) * scale),
    dipCompressMin: 0,
    peakShiftMin: -Math.round(Math.min(35, debtMin / 15) * scale),
    melatoninAdvanceMin: Math.round(Math.min(45, debtMin / 8) * scale),
    sleepTargetAdvanceMin: Math.round(Math.min(60, debtMin / 6) * scale),
    peakQualityDowngrade: debtMin >= 45,
  };
}

export function mergeModifiers(...parts: CircadianModifiers[]): CircadianModifiers {
  return parts.reduce(
    (acc, part) => ({
      groggyExtendMin: acc.groggyExtendMin + part.groggyExtendMin,
      groggyShortenMin: acc.groggyShortenMin + part.groggyShortenMin,
      dipExtendMin: acc.dipExtendMin + part.dipExtendMin,
      dipCompressMin: acc.dipCompressMin + part.dipCompressMin,
      peakShiftMin: acc.peakShiftMin + part.peakShiftMin,
      melatoninAdvanceMin: acc.melatoninAdvanceMin + part.melatoninAdvanceMin,
      sleepTargetAdvanceMin: acc.sleepTargetAdvanceMin + part.sleepTargetAdvanceMin,
      peakQualityDowngrade: acc.peakQualityDowngrade || part.peakQualityDowngrade,
    }),
    { ...NEUTRAL }
  );
}

export function millisToHours(millis: number | null | undefined): number | null {
  if (millis == null || millis <= 0) return null;
  return Math.round((millis / 3_600_000) * 10) / 10;
}
