import { DataRow, CalculatedMetrics } from '../types';

export const calculateMetrics = (
  data: DataRow[],
  truthCol: string,
  predCol: string
): CalculatedMetrics | null => {
  if (!data || data.length === 0 || !truthCol || !predCol) return null;

  let sumAbsDiff = 0;
  let sumSqDiff = 0;
  let sumTruth = 0;
  let count = 0;
  
  const validPairs: { t: number; p: number }[] = [];

  // First pass: extract valid numbers and basic sums
  for (const row of data) {
    const t = Number(row[truthCol]);
    const p = Number(row[predCol]);

    if (!isNaN(t) && !isNaN(p)) {
      validPairs.push({ t, p });
      sumTruth += t;
      count++;
    }
  }

  if (count === 0) return null;

  const meanTruth = sumTruth / count;
  let sumSqTotal = 0; // Total Sum of Squares (for R2)

  for (const { t, p } of validPairs) {
    const diff = t - p;
    sumAbsDiff += Math.abs(diff);
    sumSqDiff += diff * diff;
    sumSqTotal += (t - meanTruth) * (t - meanTruth);
  }

  const mae = sumAbsDiff / count;
  const rmse = Math.sqrt(sumSqDiff / count);
  
  // R2 = 1 - (SS_res / SS_tot)
  // If SS_tot is 0 (all truth values are same), R2 is technically undefined or 0 depending on interpretation.
  const r2 = sumSqTotal === 0 ? 0 : 1 - (sumSqDiff / sumSqTotal);

  return {
    seriesName: predCol,
    mae,
    rmse,
    r2,
    n: count
  };
};

export const formatNumber = (num: number): string => {
  if (Math.abs(num) < 0.001 || Math.abs(num) > 10000) {
    return num.toExponential(3);
  }
  return num.toFixed(3);
};