'use client';

import { Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  onExport: () => void;
  onImport: () => void;
}

export function ImportExportButtons({ onExport, onImport }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 text-sm transition-all"
      >
        <Download className="w-4 h-4" /> Export
      </button>
      <button
        onClick={onImport}
        className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 text-sm transition-all"
      >
        <Upload className="w-4 h-4" /> Import
      </button>
    </div>
  );
}

export function exportToXlsx<T>(data: T[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Données');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function importFromXlsx<T extends { id?: number }>(
  callback: (items: Omit<T, 'id'>[]) => Promise<void>
) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const items: T[] = XLSX.utils.sheet_to_json(ws);
      const cleaned = items.map(({ id: _discard, ...rest }) => { void _discard; return rest as Omit<T, 'id'>; });
      await callback(cleaned);
      window.location.reload();
    } catch {
      alert('Erreur lors de l\'import : fichier XLSX invalide');
    }
  };
  input.click();
}
