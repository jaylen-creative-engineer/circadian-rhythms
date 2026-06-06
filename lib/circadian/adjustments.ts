export interface HrvAdjustment {
  peakShiftMin: number;
  dipExtendMin: number;
  groggyExtendMin: number;
  dipCompressMin: number;
  groggyShortenMin: number;
  ratio: number;
}

export function computeHrvAdjustment(
  hrvLastNight: number,
  hrvBaseline: number
): HrvAdjustment {
  const ratio = hrvBaseline > 0 ? hrvLastNight / hrvBaseline : 1;

  if (ratio < 0.85) {
    return {
      peakShiftMin: -30,
      dipExtendMin: 15,
      groggyExtendMin: 15,
      dipCompressMin: 0,
      groggyShortenMin: 0,
      ratio,
    };
  }

  if (ratio > 1.1) {
    return {
      peakShiftMin: 30,
      dipExtendMin: 0,
      groggyExtendMin: 0,
      dipCompressMin: 15,
      groggyShortenMin: 15,
      ratio,
    };
  }

  return {
    peakShiftMin: 0,
    dipExtendMin: 0,
    groggyExtendMin: 0,
    dipCompressMin: 0,
    groggyShortenMin: 0,
    ratio,
  };
}
