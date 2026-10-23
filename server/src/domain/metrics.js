export const AlertState = {
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  NORMAL: 'NORMAL',
  WARNING: 'WARNING',
  BREACH: 'BREACH',
};

/**
 * Computes mortality, success rate, and alert state based on closed cases (MET-1 to MET-4).
 *
 * @param {Array} closedCases Array of patients with status 'DISCHARGED' or 'DECEASED'
 * @param {object} settings { mortalityBenchmark: 0.15, mortalityWarningRatio: 0.12, minClosedCasesForAlert: 20 }
 */
export function computeMortality(closedCases = [], settings = {}) {
  const benchmark = settings.mortalityBenchmark ?? 0.15;
  const warningRatio = settings.mortalityWarningRatio ?? 0.12;
  const minClosedCases = settings.minClosedCasesForAlert ?? 20;

  const deceased = closedCases.filter((p) => p.status === 'DECEASED').length;
  const discharged = closedCases.filter((p) => p.status === 'DISCHARGED').length;
  const closed = deceased + discharged;

  const rate = closed === 0 ? null : deceased / closed;
  const successRate = rate === null ? null : 1 - rate;

  let state = AlertState.INSUFFICIENT_DATA;

  if (closed >= minClosedCases && rate !== null) {
    if (rate > benchmark) {
      state = AlertState.BREACH;
    } else if (rate >= warningRatio) {
      state = AlertState.WARNING;
    } else {
      state = AlertState.NORMAL;
    }
  }

  return {
    deceased,
    discharged,
    closed,
    rate,
    ratePercent: rate !== null ? Math.round(rate * 1000) / 10 : null,
    successRate,
    successRatePercent: successRate !== null ? Math.round(successRate * 1000) / 10 : null,
    state,
    benchmarkPercent: Math.round(benchmark * 100),
    warningPercent: Math.round(warningRatio * 100),
    minClosedCases,
  };
}
