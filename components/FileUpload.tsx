import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileType, AlertCircle, Loader2 } from 'lucide-react';
import { DataRow } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: DataRow[], columns: string[], fileName: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
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
                // First try UTF-8 with fatal=true to catch invalid sequences
                const decoder = new TextDecoder('utf-8', { fatal: true });
                text = decoder.decode(data);
             } catch (utf8Error) {
                // If UTF-8 fails, try GBK (common for Chinese data)
                try {
                    const decoder = new TextDecoder('gbk', { fatal: true });
                    text = decoder.decode(data);
                } catch (gbkError) {
                    // Fallback to ISO-8859-1 (Latin1) which usually doesn't throw but might show wrong chars
                    const decoder = new TextDecoder('iso-8859-1');
                    text = decoder.decode(data);
                }
             }
             workbook = XLSX.read(text, { type: 'string' });
          } else {
             // Excel files are binary formats (xlsx, xls)
             workbook = XLSX.read(data, { type: 'array' });
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json<DataRow>(worksheet, { defval: null });
          
          if (jsonData.length === 0) {
            throw new Error("File appears to be empty.");
          }

          const columns = Object.keys(jsonData[0]);
          
          onDataLoaded(jsonData, columns, file.name);
        } catch (err) {
          console.error(err);
          setError("Failed to parse file. Please check the format or encoding.");
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Error reading file.");
        setLoading(false);
      };

      reader.readAsArrayBuffer(file);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div 
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-white'}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input 
          type="file" 
          id="fileInput" 
          className="hidden" 
          accept=".csv,.xlsx,.xls" 
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
              Drag & drop your file here or click to browse
            </p>
            <p className="text-xs text-slate-400">
              Auto-detects encoding (UTF-8, GBK, etc.)
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