
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { ConfigPanel } from './components/ConfigPanel';
import { ChartVisualizer } from './components/ChartVisualizer';
import { ChartConfig, DataRow, Dataset } from './types';
import { CHART_COLORS } from './utils/colorUtils';
import { LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  
  // State for multiple charts
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [activeChartId, setActiveChartId] = useState<string | null>(null);

  // Track if we have performed the initial chart setup
  const initializedRef = useRef(false);

  const createDefaultChart = (ds: Dataset, title: string): ChartConfig => {
    const cols = ds.columns;
    const xCol = cols.find(c => /date|time|index|id|year/i.test(c)) || cols[0];
    
    // Helper to find numeric columns
    const isNumeric = (col: string) => {
      const sample = ds.data.slice(0, 5);
      return sample.some(r => {
        const val = r[col];
        return typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null);
      });
    };

    const otherCols = cols.filter(c => c !== xCol);
    const defaultY = otherCols.find(c => isNumeric(c)) || otherCols[0] || cols[1];

    return {
      id: window.crypto?.randomUUID?.() || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
      title: title,
      type: 'general',
      xColRef: { fileId: ds.id, column: xCol },
      yColumns: defaultY ? [{
        id: 'y-1',
        colRef: { fileId: ds.id, column: defaultY },
        axis: 'left',
        color: ds.color, // Use dataset color by default
        type: 'line'
      }] : [],
      showGrid: true,
      showLegend: true,
      showMetrics: false
    };
  };

  const handleDataLoaded = useCallback((loadedData: DataRow[], loadedColumns: string[], name: string) => {
    setDatasets(prev => {
        // Ensure unique dataset name using the latest state (prev)
        // This handles concurrent uploads correctly
        let uniqueName = name;
        let counter = 1;
        
        // Function to check existence in the current pending state
        const exists = (n: string) => prev.some(ds => ds.name === n);

        while (exists(uniqueName)) {
            const lastDotIndex = name.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                const base = name.substring(0, lastDotIndex);
                const ext = name.substring(lastDotIndex);
                uniqueName = `${base} (${counter})${ext}`;
            } else {
                uniqueName = `${name} (${counter})`;
            }
            counter++;
        }

        const newDataset: Dataset = {
            id: window.crypto?.randomUUID?.() || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
            name: uniqueName,
            data: loadedData,
            columns: loadedColumns,
            color: CHART_COLORS[prev.length % CHART_COLORS.length]
        };

        return [...prev, newDataset];
    });
  }, []);

  // Effect to initialize the first chart when data is loaded
  // This is separate from data loading to handle batch uploads gracefully
  useEffect(() => {
    if (datasets.length === 0) {
        // Reset initialization state if all data is cleared
        initializedRef.current = false;
    } else if (!initializedRef.current) {
        // Create default chart only once when the first dataset(s) arrive
        const initialChart = createDefaultChart(datasets[0], 'Main Chart');
        initialChart.id = 'chart-1';
        setCharts([initialChart]);
        setActiveChartId(initialChart.id);
        initializedRef.current = true;
    }
  }, [datasets]);

  const removeDataset = (id: string) => {
      setDatasets(prev => prev.filter(d => d.id !== id));
  };

  const updateChart = (id: string, updates: Partial<ChartConfig>) => {
    setCharts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addChart = () => {
    if (datasets.length === 0) return;
    
    // Default to using the most recently added dataset
    const ds = datasets[datasets.length - 1];
    const newChart = createDefaultChart(ds, `Chart ${charts.length + 1}`);
    
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {datasets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
            
            {/* Sidebar Controls */}
            <div className="lg:w-80 flex-shrink-0 flex flex-col gap-4 h-full">
              {/* Add File Button Area */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Data Sources</h3>
                  <FileUpload onDataLoaded={handleDataLoaded} compact />
              </div>

              <ConfigPanel 
                datasets={datasets}
                charts={charts}
                activeChartId={activeChartId}
                onUpdateChart={updateChart}
                onAddChart={addChart}
                onRemoveChart={removeChart}
                onSelectChart={setActiveChartId}
                onRemoveDataset={removeDataset}
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
                        datasets={datasets}
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
