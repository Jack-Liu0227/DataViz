
import React, { useCallback, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileType, AlertCircle, Loader2, Plus } from 'lucide-react';
import { DataRow } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: DataRow[], columns: string[], fileName: string) => void;
  compact?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const processFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result as ArrayBuffer;
          let workbook: XLSX.WorkBook;

          // Auto-detect encoding for CSV files
          if (file.name.toLowerCase().endsWith('.csv')) {
             let text: string;
             try {
                const decoder = new TextDecoder('utf-8', { fatal: true });
                text = decoder.decode(data);
             } catch (utf8Error) {
                try {
                    const decoder = new TextDecoder('gbk', { fatal: true });
                    text = decoder.decode(data);
                } catch (gbkError) {
                    const decoder = new TextDecoder('iso-8859-1');
                    text = decoder.decode(data);
                }
             }
             workbook = XLSX.read(text, { type: 'string' });
          } else {
             workbook = XLSX.read(data, { type: 'array' });
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<DataRow>(worksheet, { defval: null });
          
          if (jsonData.length === 0) {
            throw new Error(`File ${file.name} appears to be empty.`);
          }

          const columns = Object.keys(jsonData[0]);
          onDataLoaded(jsonData, columns, file.name);
        } catch (err) {
          console.error(err);
          setError(`Failed to parse ${file.name}.`);
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError(`Error reading ${file.name}.`);
        setLoading(false);
      };

      reader.readAsArrayBuffer(file);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }, [onDataLoaded]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Process all dropped files
      Array.from(e.dataTransfer.files).forEach(file => {
         processFile(file);
      });
    }
  }, [processFile]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        processFile(file);
      });
    }
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  if (compact) {
      return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
                relative rounded-lg transition-all duration-200 border-2 border-dashed
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-transparent'}
            `}
        >
            {isDragging ? (
                <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-200">
                    <Upload className="w-8 h-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-blue-700">Drop files to add</span>
                </div>
            ) : (
                <div className="p-1">
                    <button 
                        onClick={() => document.getElementById('fileInputCompact')?.click()}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors w-full justify-center text-sm font-medium"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add Another File
                    </button>
                    <div className="mt-2 text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">or drag & drop</p>
                    </div>
                    <input 
                        type="file" 
                        id="fileInputCompact" 
                        className="hidden" 
                        accept=".csv,.xlsx,.xls" 
                        multiple
                        onChange={onFileSelect} 
                    />
                    {error && <div className="text-red-500 text-xs mt-2 text-center">{error}</div>}
                </div>
            )}
        </div>
      )
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div 
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer relative
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-white'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input 
          type="file" 
          id="fileInput" 
          className="hidden" 
          accept=".csv,.xlsx,.xls" 
          multiple
          onChange={onFileSelect} 
        />
        
        {loading ? (
          <div className="flex flex-col items-center text-slate-500">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-600" />
            <p>Parsing your data...</p>
          </div>
        ) : (
          <>
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Upload CSV or Excel
            </h3>
            <p className="text-slate-500 mb-6">
              Drag & drop to add files
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="mt-6 flex justify-center gap-6 text-slate-400 text-sm">
        <div className="flex items-center gap-2">
           <FileType className="w-4 h-4" /> .csv
        </div>
        <div className="flex items-center gap-2">
           <FileType className="w-4 h-4" /> .xlsx
        </div>
        <div className="flex items-center gap-2">
           <FileType className="w-4 h-4" /> .xls
        </div>
      </div>
    </div>
  );
};
