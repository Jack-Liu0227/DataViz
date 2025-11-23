import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ConfigPanel } from './components/ConfigPanel';
import { ChartVisualizer } from './components/ChartVisualizer';
import { ChartConfig, DataRow, YColumnConfig } from './types';
import { CHART_COLORS } from './utils/colorUtils';
import { LayoutDashboard, Table } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  
  // State for multiple charts
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [activeChartId, setActiveChartId] = useState<string | null>(null);

  const createDefaultChart = (cols: string[], title: string, loadedData?: DataRow[]): ChartConfig => {
    const xCol = cols.find(c => /date|time|index|id|year/i.test(c)) || cols[0];
    
    // Helper to find numeric columns
    const isNumeric = (col: string) => {
      const sample = loadedData && loadedData.length > 0 ? loadedData.slice(0, 5) : [];
      return sample.some(r => {
        const val = r[col];
        return typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null);
      });
    };

    const otherCols = cols.filter(c => c !== xCol);
    const defaultY = otherCols.find(c => isNumeric(c)) || otherCols[0] || cols[1];

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: title,
      type: 'general',
      xColumn: xCol,
      yColumns: defaultY ? [{
        id: 'y-1',
        column: defaultY,
        axis: 'left',
        color: CHART_COLORS[0],
        type: 'line'
      }] : [],
      showGrid: true,
      showLegend: true,
      showMetrics: false
    };
  };

  const handleDataLoaded = (loadedData: DataRow[], loadedColumns: string[], name: string) => {
    setData(loadedData);
    setColumns(loadedColumns);
    setFileName(name);

    // Create initial chart
    const initialChart = createDefaultChart(loadedColumns, 'Main Chart', loadedData);
    initialChart.id = 'chart-1'; // Fixed ID for first chart

    setCharts([initialChart]);
    setActiveChartId(initialChart.id);
  };

  const updateChart = (id: string, updates: Partial<ChartConfig>) => {
    setCharts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addChart = () => {
    const newChart = createDefaultChart(columns, `Chart ${charts.length + 1}`, data);
    
    // Adjust color for new chart to be different
    if (newChart.yColumns.length > 0) {
       newChart.yColumns[0].color = CHART_COLORS[charts.length % CHART_COLORS.length];
    }

    setCharts(prev => [...prev, newChart]);
    setActiveChartId(newChart.id);
  };

  const removeChart = (id: string) => {
    const newCharts = charts.filter(c => c.id !== id);
    setCharts(newCharts);
    if (activeChartId === id && newCharts.length > 0) {
      setActiveChartId(newCharts[0].id);
    } else if (newCharts.length === 0) {
      setActiveChartId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg text-white">
               <LayoutDashboard size={20} />
             </div>
             <div>
               <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                 DataViz Pro
               </h1>
             </div>
          </div>
          {fileName && (
             <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-2">
               <Table size={14} />
               {fileName}
               <span className="text-slate-400 border-l border-slate-300 pl-2 ml-1">{data.length} rows</span>
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
            
            {/* Sidebar Controls */}
            <div className="lg:w-80 flex-shrink-0 h-full">
              <ConfigPanel 
                columns={columns}
                charts={charts}
                activeChartId={activeChartId}
                onUpdateChart={updateChart}
                onAddChart={addChart}
                onRemoveChart={removeChart}
                onSelectChart={setActiveChartId}
              />
            </div>

            {/* Main Chart Area (Grid) */}
            <div className="flex-1 overflow-y-auto pr-2">
              {charts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300">
                   <p>No charts created.</p>
                   <button onClick={addChart} className="mt-2 text-blue-600 font-semibold hover:underline">Create one</button>
                </div>
              ) : (
                <div className={`grid gap-4 ${charts.length > 1 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 h-full'}`}>
                  {charts.map(chart => (
                    <div 
                      key={chart.id} 
                      className={`
                        ${charts.length === 1 ? 'h-full' : 'h-[450px]'} 
                        ${activeChartId === chart.id ? 'ring-2 ring-blue-500 ring-offset-2 rounded-xl' : ''}
                        transition-all duration-200
                      `}
                      onClick={() => setActiveChartId(chart.id)}
                    >
                      <ChartVisualizer 
                        data={data}
                        config={chart}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
