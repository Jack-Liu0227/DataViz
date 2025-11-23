
import { CalculatedMetrics } from '../types';

export const calculateMetrics = (
  xValues: number[],
  yValues: number[],
  seriesName: string,
  xName: string
): CalculatedMetrics | null => {
  if (!xValues || !yValues || xValues.length === 0 || yValues.length === 0) return null;

  let sumAbsDiff = 0;
  let sumSqDiff = 0;
  let sumTruth = 0;
  let count = 0;
  
  // We assume index alignment for comparison (row 1 vs row 1)
  // Use the shorter length to avoid out of bounds
  const length = Math.min(xValues.length, yValues.length);

  for (let i = 0; i < length; i++) {
    const t = xValues[i]; // Truth (X)
    const p = yValues[i]; // Prediction (Y)

    if (!isNaN(t) && !isNaN(p)) {
      sumTruth += t;
      count++;
      
      const diff = t - p;
      sumAbsDiff += Math.abs(diff);
      sumSqDiff += diff * diff;
    }
  }

  if (count === 0) return null;

  const meanTruth = sumTruth / count;
  let sumSqTotal = 0; // Total Sum of Squares (for R2)

  // Second pass for R2
  for (let i = 0; i < length; i++) {
    const t = xValues[i];
    const p = yValues[i];
    
    if (!isNaN(t) && !isNaN(p)) {
       sumSqTotal += (t - meanTruth) * (t - meanTruth);
    }
  }

  const mae = sumAbsDiff / count;
  const rmse = Math.sqrt(sumSqDiff / count);
  
  // R2 = 1 - (SS_res / SS_tot)
  const r2 = sumSqTotal === 0 ? 0 : 1 - (sumSqDiff / sumSqTotal);

  return {
    seriesName,
    xName,
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
