
import React from 'react';
import { Plus, Trash2, Settings2, BarChart2, X, ArrowRightLeft, Database, FileSpreadsheet, Tag } from 'lucide-react';
import { ChartConfig, YColumnConfig, Dataset, ColumnRef } from '../types';
import { getNextColor } from '../utils/colorUtils';

interface ConfigPanelProps {
  datasets: Dataset[];
  charts: ChartConfig[];
  activeChartId: string | null;
  onUpdateChart: (id: string, newConfig: Partial<ChartConfig>) => void;
  onAddChart: () => void;
  onRemoveChart: (id: string) => void;
  onSelectChart: (id: string) => void;
  onRemoveDataset: (id: string) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  datasets,
  charts,
  activeChartId,
  onUpdateChart,
  onAddChart,
  onRemoveChart,
  onSelectChart,
  onRemoveDataset
}) => {
  
  const activeChart = charts.find(c => c.id === activeChartId);

  // Helper to serialize ColumnRef to string for select value
  const toSelectValue = (ref?: ColumnRef) => {
    if (!ref) return "";
    return `${ref.fileId}::${ref.column}`;
  };

  // Helper to parse string back to ColumnRef
  const fromSelectValue = (val: string): ColumnRef | undefined => {
    if (!val) return undefined;
    const [fileId, column] = val.split('::');
    return { fileId, column };
  };

  const addYColumn = () => {
    if (!activeChart || datasets.length === 0) return;
    const usedColors = activeChart.yColumns.map(c => c.color);
    
    // Default to the first available column different from X if possible
    const ds = datasets[0];
    const defaultYCol = ds.columns.find(c => c !== activeChart.xColRef.column) || ds.columns[0];

    const newY: YColumnConfig = {
      id: Date.now().toString(),
      colRef: { fileId: ds.id, column: defaultYCol },
      axis: 'left',
      color: getNextColor(usedColors),
      type: activeChart.type === 'diagonal' ? 'scatter' : 'line'
    };
    onUpdateChart(activeChart.id, { yColumns: [...activeChart.yColumns, newY] });
  };

  const removeYColumn = (yId: string) => {
    if (!activeChart) return;
    onUpdateChart(activeChart.id, { yColumns: activeChart.yColumns.filter(y => y.id !== yId) });
  };

  const updateYColumn = (yId: string, updates: Partial<YColumnConfig>) => {
    if (!activeChart) return;
    onUpdateChart(activeChart.id, {
      yColumns: activeChart.yColumns.map(y => y.id === yId ? { ...y, ...updates } : y)
    });
  };

  // Render the column options grouped by dataset
  const renderColumnOptions = () => (
    <>
      {datasets.map(ds => (
        <optgroup key={ds.id} label={ds.name}>
          {ds.columns.map(col => (
            <option key={`${ds.id}::${col}`} value={`${ds.id}::${col}`}>
              {col}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Settings2 className="w-4 h-4" /> Configuration
        </h2>
        <button 
          onClick={onAddChart}
          className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Chart
        </button>
      </div>

      {/* Dataset List */}
      <div className="p-3 border-b border-slate-100 bg-white">
         <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Database className="w-3 h-3" /> Loaded Datasets
         </h3>
         <div className="flex flex-wrap gap-2">
           {datasets.map(ds => (
             <div key={ds.id} className="flex items-center gap-2 text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
               <FileSpreadsheet className="w-3 h-3 text-slate-500" />
               <span className="max-w-[100px] truncate" title={ds.name}>{ds.name}</span>
               <button onClick={() => onRemoveDataset(ds.id)} className="text-slate-400 hover:text-red-500">
                 <X className="w-3 h-3" />
               </button>
             </div>
           ))}
         </div>
      </div>

      {/* Chart Selector Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-100 scrollbar-hide">
        {charts.map((chart, index) => (
           <div 
             key={chart.id}
             onClick={() => onSelectChart(chart.id)}
             className={`
                flex items-center gap-2 px-4 py-3 text-sm cursor-pointer border-r border-slate-100 min-w-fit hover:bg-slate-50 transition-colors
                ${activeChartId === chart.id ? 'bg-white border-b-2 border-b-blue-500 text-blue-700 font-medium' : 'text-slate-500 bg-slate-50'}
             `}
           >
             <BarChart2 className="w-3 h-3" />
             <span className="truncate max-w-[80px]">{chart.title || `Chart ${index + 1}`}</span>
             {charts.length > 1 && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onRemoveChart(chart.id); }}
                 className="opacity-50 hover:opacity-100 hover:text-red-500 ml-1"
               >
                 <X className="w-3 h-3" />
               </button>
             )}
           </div>
        ))}
      </div>

      {activeChart ? (
        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {/* General Settings */}
          <div>
             <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
               Chart Settings
             </label>
             <div className="space-y-3">
               <input 
                 type="text" 
                 value={activeChart.title}
                 onChange={(e) => onUpdateChart(activeChart.id, { title: e.target.value })}
                 placeholder="Chart Title"
                 className="w-full p-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
               />
               
               <select
                  value={activeChart.type}
                  onChange={(e) => onUpdateChart(activeChart.id, { type: e.target.value as any })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
               >
                 <option value="general">General (Lines, Bars, etc.)</option>
                 <option value="diagonal">Diagonal Plot (Pred vs True)</option>
               </select>

               <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="showMetrics"
                    checked={activeChart.showMetrics}
                    onChange={(e) => onUpdateChart(activeChart.id, { showMetrics: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="showMetrics" className="text-sm text-slate-700">
                    Show Metrics (MAE, RMSE, R²)
                  </label>
               </div>
             </div>
          </div>

          {/* Global X Axis Config */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {activeChart.type === 'diagonal' ? 'Default X Axis (True / Reference)' : 'Default X Axis'}
            </label>
            <select
              value={toSelectValue(activeChart.xColRef)}
              onChange={(e) => {
                  const ref = fromSelectValue(e.target.value);
                  if(ref) onUpdateChart(activeChart.id, { xColRef: ref });
              }}
              className="w-full p-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {renderColumnOptions()}
            </select>
          </div>

          {/* Y Axis Config */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Series
              </label>
              <button
                onClick={addYColumn}
                className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                title="Add Series"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {activeChart.yColumns.map((yCol) => (
                <div key={yCol.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50 relative group">
                  <button
                    onClick={() => removeYColumn(yCol.id)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Series Content */}
                  <div className="mb-3 pr-6">
                    <div className="text-xs text-slate-400 mb-1">Y Axis (Value)</div>
                    <select
                      value={toSelectValue(yCol.colRef)}
                      onChange={(e) => {
                        const ref = fromSelectValue(e.target.value);
                        if(ref) updateYColumn(yCol.id, { colRef: ref });
                      }}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded text-sm mb-2"
                    >
                      {renderColumnOptions()}
                    </select>

                    {/* Custom Legend Label */}
                    <div className="mb-2">
                        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Legend Label (Optional)
                        </div>
                        <input 
                            type="text" 
                            value={yCol.label || ''}
                            onChange={(e) => updateYColumn(yCol.id, { label: e.target.value })}
                            placeholder="Auto-generated name"
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-300"
                        />
                    </div>

                    {/* Individual X Override */}
                    <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <ArrowRightLeft className="w-3 h-3" /> Override X Axis (Optional)
                    </div>
                    <select
                      value={yCol.xColRef ? toSelectValue(yCol.xColRef) : ''}
                      onChange={(e) => {
                          const ref = fromSelectValue(e.target.value);
                          updateYColumn(yCol.id, { xColRef: ref || undefined });
                      }}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600"
                    >
                      <option value="">Use Default</option>
                      {renderColumnOptions()}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {activeChart.type === 'general' && (
                     <>
                       <select
                        value={yCol.type}
                        onChange={(e) => updateYColumn(yCol.id, { type: e.target.value as any })}
                        className="p-1 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="line">Line</option>
                        <option value="bar">Bar</option>
                        <option value="area">Area</option>
                        <option value="scatter">Scatter</option>
                      </select>
                      <select
                        value={yCol.axis}
                        onChange={(e) => updateYColumn(yCol.id, { axis: e.target.value as 'left'|'right' })}
                        className="p-1 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="left">Left Axis</option>
                        <option value="right">Right Axis</option>
                      </select>
                     </>
                    )}
                     
                     <div className="flex items-center gap-2 col-span-2">
                       <span className="text-xs text-slate-500">Color:</span>
                       <input
                        type="color"
                        value={yCol.color}
                        onChange={(e) => updateYColumn(yCol.id, { color: e.target.value })}
                        className="flex-1 h-6 rounded cursor-pointer border-0 p-0 overflow-hidden"
                      />
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm p-4 text-center">
          Select a chart to configure or add a new one.
        </div>
      )}
    </div>
  );
};
