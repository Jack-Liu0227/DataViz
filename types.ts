export interface DataRow {
  [key: string]: string | number | null;
}

export type SeriesType = 'line' | 'scatter' | 'area' | 'bar';

export interface YColumnConfig {
  id: string; // unique id for React keys
  column: string;
  xColumn?: string; // Optional: allow specific X column for this series
  axis: 'left' | 'right';
  color: string;
  type: SeriesType;
}

export type ChartType = 'general' | 'diagonal';

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  xColumn: string;
  yColumns: YColumnConfig[];
  showGrid: boolean;
  showLegend: boolean;
  showMetrics: boolean;
}

export interface CalculatedMetrics {
  seriesName: string;
  mae: number;
  rmse: number;
  r2: number;
  n: number;
}