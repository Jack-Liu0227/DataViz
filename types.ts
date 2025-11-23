
export interface DataRow {
  [key: string]: string | number | null;
}

export interface Dataset {
  id: string;
  name: string;
  data: DataRow[];
  columns: string[];
  color: string; // Assigned color for identification
}

export interface ColumnRef {
  fileId: string;
  column: string;
}

export type SeriesType = 'line' | 'scatter' | 'area' | 'bar';

export interface YColumnConfig {
  id: string; // unique id for React keys
  colRef: ColumnRef; // The Y column
  xColRef?: ColumnRef; // Optional: allow specific X column for this series
  axis: 'left' | 'right';
  color: string;
  type: SeriesType;
  label?: string; // Custom name for the legend
}

export type ChartType = 'general' | 'diagonal';

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  xColRef: ColumnRef; // Default X Axis
  yColumns: YColumnConfig[];
  showGrid: boolean;
  showLegend: boolean;
  showMetrics: boolean;
}

export interface CalculatedMetrics {
  seriesName: string;
  xName: string;
  mae: number;
  rmse: number;
  r2: number;
  n: number;
}
