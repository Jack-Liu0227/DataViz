
import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Scatter,
  Area,
  Bar,
  ReferenceLine,
} from 'recharts';
import { ChartConfig, Dataset, ColumnRef } from '../types';
import { calculateMetrics, formatNumber } from '../utils/mathUtils';

interface ChartVisualizerProps {
  datasets: Dataset[];
  config: ChartConfig;
}

export const ChartVisualizer: React.FC<ChartVisualizerProps> = ({ datasets, config }) => {
  const hasRightAxis = config.yColumns.some(col => col.axis === 'right');
  const isDiagonal = config.type === 'diagonal';

  // Helper to get data array from a ColumnRef
  const getColumnData = (ref: ColumnRef): { values: number[], name: string } | null => {
    const ds = datasets.find(d => d.id === ref.fileId);
    if (!ds) return null;
    const values = ds.data.map(row => Number(row[ref.column]));
    return { values, name: ref.column };
  };

  // 1. Calculate Metrics
  const metricsData = useMemo(() => {
    if (!config.showMetrics) return [];
    
    return config.yColumns.map(yCol => {
      const xRef = yCol.xColRef || config.xColRef;
      const yRef = yCol.colRef;

      const xData = getColumnData(xRef);
      const yData = getColumnData(yRef);

      if (!xData || !yData) return null;

      const ds = datasets.find(d => d.id === yRef.fileId);
      const seriesName = yCol.label || `${yData.name} (${ds?.name || 'Unknown'})`;

      const metrics = calculateMetrics(xData.values, yData.values, seriesName, xData.name);
      if (!metrics) return null;
      
      return {
        color: yCol.color,
        ...metrics
      };
    }).filter(Boolean);
  }, [datasets, config.xColRef, config.yColumns, config.showMetrics]);

  // 2. Calculate Domain (Min/Max) for X-Axis
  const xDomain = useMemo(() => {
    if (datasets.length === 0) return ['auto', 'auto'];

    let min = Infinity;
    let max = -Infinity;
    let hasValidNumber = false;

    // Identify all relevant X columns (Main X + Overrides)
    const activeXRefs = [config.xColRef];
    config.yColumns.forEach(col => {
      if (col.xColRef) activeXRefs.push(col.xColRef);
    });

    activeXRefs.forEach(ref => {
        const ds = datasets.find(d => d.id === ref.fileId);
        if (ds) {
            ds.data.forEach(row => {
                const val = Number(row[ref.column]);
                if (!isNaN(val)) {
                    min = Math.min(min, val);
                    max = Math.max(max, val);
                    hasValidNumber = true;
                }
            });
        }
    });
      
    // For diagonal plots, Y values also contribute to domain size
    if (isDiagonal) {
      config.yColumns.forEach(col => {
         const ds = datasets.find(d => d.id === col.colRef.fileId);
         if (ds) {
             ds.data.forEach(row => {
                const val = Number(row[col.colRef.column]);
                if (!isNaN(val)) {
                    min = Math.min(min, val);
                    max = Math.max(max, val);
                    hasValidNumber = true;
                }
             });
         }
      });
    }

    if (!hasValidNumber) return ['auto', 'auto'];

    const padding = (max - min) * 0.05;
    if (min === max) {
        min -= 1;
        max += 1;
    }
    return [min - padding, max + padding];
  }, [datasets, config, isDiagonal]);


  if (datasets.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-400">No datasets loaded</div>;
  }

  return (
    <div className="relative w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
       <div className="mb-2 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide truncate pr-20">{config.title || "Untitled Chart"}</h2>
       </div>

       <div className="flex-1 w-full min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              
              <XAxis 
                type="number" 
                dataKey="x"
                domain={xDomain as any}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={{ stroke: '#cbd5e1' }}
                axisLine={{ stroke: '#cbd5e1' }}
                label={{ 
                  value: config.xColRef.column + (isDiagonal ? ' (True)' : ''), 
                  position: 'insideBottom', 
                  offset: -10, 
                  fill: '#475569', 
                  fontSize: 12 
                }}
                allowDuplicatedCategory={false}
              />

              <YAxis 
                yAxisId="left"
                type="number"
                domain={isDiagonal && xDomain ? xDomain : ['auto', 'auto']}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={{ stroke: '#cbd5e1' }}
                axisLine={{ stroke: '#cbd5e1' }}
                label={isDiagonal ? { 
                  value: 'Predicted', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: '#475569',
                  fontSize: 12
                } : undefined}
              />

              {hasRightAxis && !isDiagonal && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
              )}

              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                    // Deduplicate tooltip items if using scatter with customized points
                    const uniquePayload = Array.from(new Set(payload.map((p: any) => JSON.stringify(p)))).map((s: string) => JSON.parse(s));
                    
                    return (
                        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs">
                        {uniquePayload.map((entry: any, index: number) => (
                            <div key={index} className="mb-1" style={{ color: entry.color }}>
                            <span className="font-bold">{entry.name}:</span> {formatNumber(entry.value)}
                            <span className="text-slate-400 ml-2">(x: {formatNumber(entry.payload.x)})</span>
                            </div>
                        ))}
                        </div>
                    );
                    }
                    return null;
                }}
              />
              
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />

              {/* Diagonal Reference Line y=x */}
              {isDiagonal && xDomain && (
                <ReferenceLine 
                  yAxisId="left" 
                  segment={[{ x: xDomain[0], y: xDomain[0] }, { x: xDomain[1], y: xDomain[1] }]} 
                  stroke="#94a3b8" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  label={{ value: "y = x", position: "insideTopLeft", fill: "#94a3b8", fontSize: 10 }}
                  ifOverflow="extendDomain"
                />
              )}

              {config.yColumns.map((col) => {
                const type = isDiagonal ? 'scatter' : col.type;
                const activeXRef = col.xColRef || config.xColRef;
                
                // 1. Find Dataset for X
                const dsX = datasets.find(d => d.id === activeXRef.fileId);
                // 2. Find Dataset for Y
                const dsY = datasets.find(d => d.id === col.colRef.fileId);

                if (!dsX || !dsY) return null;

                // 3. Construct Series Data
                const len = Math.min(dsX.data.length, dsY.data.length);
                const seriesData = [];
                for (let i = 0; i < len; i++) {
                    const xVal = Number(dsX.data[i][activeXRef.column]);
                    const yVal = Number(dsY.data[i][col.colRef.column]);
                    if (!isNaN(xVal) && !isNaN(yVal)) {
                        seriesData.push({ x: xVal, y: yVal });
                    }
                }
                seriesData.sort((a, b) => a.x - b.x);

                const seriesName = col.label || `${col.colRef.column} (${dsY.name})`;

                if (type === 'line') {
                  return (
                    <Line
                      key={col.id}
                      yAxisId={col.axis}
                      type="monotone"
                      data={seriesData}
                      dataKey="y"
                      stroke={col.color}
                      strokeWidth={2}
                      dot={{ r: 2, fill: col.color }}
                      activeDot={{ r: 6 }}
                      name={seriesName}
                      isAnimationActive={false}
                    />
                  );
                } else if (type === 'area') {
                   return (
                    <Area
                      key={col.id}
                      yAxisId={col.axis}
                      type="monotone"
                      data={seriesData}
                      dataKey="y"
                      fill={col.color}
                      stroke={col.color}
                      fillOpacity={0.3}
                      name={seriesName}
                      isAnimationActive={false}
                    />
                  );
                } else if (type === 'bar') {
                  return (
                    <Bar
                      key={col.id}
                      yAxisId={col.axis}
                      data={seriesData}
                      dataKey="y"
                      fill={col.color}
                      name={seriesName}
                      isAnimationActive={false}
                    />
                  );
                } else {
                  return (
                    <Scatter
                      key={col.id}
                      yAxisId={col.axis}
                      data={seriesData}
                      dataKey="y"
                      fill={col.color}
                      name={seriesName}
                      isAnimationActive={false}
                    />
                  );
                }
              })}
            </ComposedChart>
          </ResponsiveContainer>

          {/* Metrics Overlay */}
          {metricsData.length > 0 && (
             <div className="absolute top-10 right-4 flex flex-col gap-2 z-10 pointer-events-none">
               {metricsData.map((m, idx) => (
                 <div key={idx} className="bg-white/90 backdrop-blur-sm border-l-4 shadow-md p-2 rounded-r text-xs min-w-[160px]" style={{ borderLeftColor: m?.color || '#ccc' }}>
                    <div className="font-bold text-slate-700 truncate mb-1 max-w-[140px]" title={m?.seriesName}>{m?.seriesName}</div>
                    <div className="text-[10px] text-slate-400 mb-1">vs {m?.xName}</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-600">
                       <span>RMSE:</span> <span className="font-mono text-right text-slate-900">{formatNumber(m!.rmse)}</span>
                       <span>MAE:</span> <span className="font-mono text-right text-slate-900">{formatNumber(m!.mae)}</span>
                       <span>R²:</span> <span className="font-mono text-right text-slate-900">{formatNumber(m!.r2)}</span>
                    </div>
                 </div>
               ))}
             </div>
          )}
       </div>
    </div>
  );
};
