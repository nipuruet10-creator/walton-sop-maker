import React, { useState, useRef, useEffect } from 'react';
import type { SOPPhoto } from '../../types/sop';
import { toBengaliNumber } from '../../data/defaultSopData';
import { PhotoAnnotatorModal } from '../Modals/PhotoAnnotatorModal';
import {
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  LayoutGrid,
  Maximize,
  Layers,
  ClipboardPaste,
  Sparkles,
  Crop,
} from 'lucide-react';

interface ImageManagerProps {
  photos: SOPPhoto[];
  onChange: (photos: SOPPhoto[]) => void;
  imageFit?: 'contain' | 'cover';
  onUpdateFit?: (fit: 'contain' | 'cover') => void;
  gridCols?: number;
  onUpdateGridCols?: (cols: number) => void;
}

export const ImageManager: React.FC<ImageManagerProps> = ({
  photos,
  onChange,
  imageFit = 'contain',
  onUpdateFit,
  gridCols = 0,
  onUpdateGridCols,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetIndex = useRef<number | null>(null);

  // Annotation & Crop state
  const [annotatingIndex, setAnnotatingIndex] = useState<number | null>(null);
  const [modalInitialTool, setModalInitialTool] = useState<'box' | 'crop'>('box');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Re-index photo labels: চিত্র-১, চিত্র-২ ...
  const reindex = (list: SOPPhoto[]): SOPPhoto[] => {
    return list.map((p, idx) => ({
      ...p,
      label: `চিত্র-${toBengaliNumber(idx + 1)}`,
    }));
  };

  // Global Clipboard Paste listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        processNewFiles(imageFiles, 'Image successfully pasted from clipboard!');
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [photos]);

  const processNewFiles = (files: File[], successMsg: string) => {
    const remainingSlots = 9 - photos.length;
    if (remainingSlots <= 0) {
      alert('Maximum of 9 photos can be added to the SOP layout.');
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);
    const newPhotos: SOPPhoto[] = [];
    let processed = 0;

    filesToRead.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newPhotos.push({
          id: `photo-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
          url: event.target?.result as string,
          label: '',
          name: file.name || `Pasted Image ${photos.length + i + 1}`,
        });
        processed++;
        if (processed === filesToRead.length) {
          onChange(reindex([...photos, ...newPhotos]));
          showToast(successMsg);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processNewFiles(Array.from(files), 'Image uploaded successfully!');
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        processNewFiles(imageFiles, 'Drag-and-drop image added!');
      }
    }
  };

  const handleReplace = (index: number) => {
    replaceTargetIndex.current = index;
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replaceTargetIndex.current === null) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const updated = [...photos];
      updated[replaceTargetIndex.current!] = {
        ...updated[replaceTargetIndex.current!],
        url: event.target?.result as string,
        name: file.name,
      };
      onChange(reindex(updated));
      showToast('Image replaced successfully!');
      if (replaceInputRef.current) replaceInputRef.current.value = '';
      replaceTargetIndex.current = null;
    };
    reader.readAsDataURL(file);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= photos.length) return;

    const updated = [...photos];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange(reindex(updated));
  };

  const handleDelete = (index: number) => {
    if (photos.length <= 4) {
      if (!confirm('At least 4 photos are recommended for standard SOP layout. Are you sure you want to delete this photo?')) {
        return;
      }
    }
    const updated = photos.filter((_, i) => i !== index);
    onChange(reindex(updated));
  };

  const handleSaveAnnotatedPhoto = (annotatedBase64: string) => {
    if (annotatingIndex === null) return;
    const updated = [...photos];
    updated[annotatingIndex] = {
      ...updated[annotatingIndex],
      url: annotatedBase64,
    };
    onChange(reindex(updated));
    showToast('Photo annotations saved successfully!');
    setAnnotatingIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceFile}
        accept="image/*"
        className="hidden"
      />

      {/* Header Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-700" />
            <span className="font-semibold text-xs text-blue-900">
              Photographs ({photos.length} / 9)
            </span>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            {photos.length <= 4 && '2 × 2 Grid'}
            {(photos.length === 5 || photos.length === 6) && '3 × 2 Grid (Standard)'}
            {photos.length >= 7 && '3 × 3 Grid (Balanced)'}
          </span>
        </div>

        {/* Photo Aspect Ratio & Alignment Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/80 text-xs">
          <div>
            <label className="block text-[10.5px] font-semibold text-blue-950 mb-1 flex items-center gap-1">
              <Maximize className="w-3 h-3 text-blue-600" />
              <span>Aspect Ratio</span>
            </label>
            <div className="flex bg-white rounded-lg border border-blue-300 p-0.5">
              <button
                type="button"
                onClick={() => onUpdateFit?.('contain')}
                className={`flex-1 py-1 text-[11px] font-medium rounded transition cursor-pointer ${
                  imageFit === 'contain' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
                title="Fit image naturally without cropping"
              >
                Fit
              </button>
              <button
                type="button"
                onClick={() => onUpdateFit?.('cover')}
                className={`flex-1 py-1 text-[11px] font-medium rounded transition cursor-pointer ${
                  imageFit === 'cover' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
                title="Fill entire cell boundary"
              >
                Fill
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-semibold text-blue-950 mb-1 flex items-center gap-1">
              <LayoutGrid className="w-3 h-3 text-blue-600" />
              <span>Column Layout</span>
            </label>
            <select
              value={gridCols}
              onChange={(e) => onUpdateGridCols?.(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 text-[11px] text-slate-800 focus:outline-none"
            >
              <option value={0}>Auto (Optimal)</option>
              <option value={3}>3 Columns (Standard)</option>
              <option value={2}>2 Columns (Large)</option>
              <option value={4}>4 Columns (Compact)</option>
            </select>
          </div>
        </div>

        {/* Pro Tip on Paste & Annotate */}
        <div className="flex items-center gap-1.5 text-[11px] text-blue-800 bg-white/70 p-2 rounded-lg border border-blue-200/60">
          <ClipboardPaste className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            <strong>Tip:</strong> Copy any screenshot and press <strong>Ctrl+V</strong> to paste directly. Click <strong>"Annotate"</strong> to draw arrows and highlight boxes.
          </span>
        </div>
      </div>

      {photos.length < 4 && (
        <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-800 p-2.5 rounded-xl border border-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>At least 4 photos are recommended for standard SOP layout.</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      {photos.length < 9 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-1.5 border-2 border-dashed p-4 rounded-xl transition cursor-pointer group text-xs text-center ${
            isDragOver
              ? 'border-blue-600 bg-blue-100/60 scale-[1.01]'
              : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-700 group-hover:text-blue-700 font-semibold">
            <Upload className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
            <span>+ Upload Photo ({9 - photos.length} remaining)</span>
          </div>
          <p className="text-[10.5px] text-slate-500">
            Drag & drop images here or copy and press <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-[10px]">Ctrl+V</kbd> to paste
          </p>
        </div>
      )}

      {/* Photo List & Order Manager */}
      <div className="space-y-2">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200 hover:border-blue-300 shadow-xs transition"
          >
            {/* Thumbnail */}
            <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-300 flex items-center justify-center">
              <img
                src={photo.url}
                alt={photo.label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Label and Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-block bg-yellow-400 text-black text-[11px] font-bold px-2 py-0.5 rounded shadow-xs border border-yellow-500">
                  {photo.label}
                </span>
                <span className="text-xs font-medium text-slate-700 truncate">
                  {photo.name || `Photo ${index + 1}`}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Position #{index + 1}
              </span>
            </div>

            {/* Actions: Annotate, Crop, Move Up/Down, Replace, Delete */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Crop Button */}
              <button
                type="button"
                onClick={() => {
                  setModalInitialTool('crop');
                  setAnnotatingIndex(index);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                title="Crop & straighten image"
              >
                <Crop className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Crop</span>
              </button>

              {/* Annotate / Mark Button */}
              <button
                type="button"
                onClick={() => {
                  setModalInitialTool('box');
                  setAnnotatingIndex(index);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                title="Add red highlight box, arrows, and drawings"
              >
                <Layers className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">Annotate</span>
              </button>

              <button
                type="button"
                onClick={() => handleMove(index, 'up')}
                disabled={index === 0}
                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition cursor-pointer"
                title="Move Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMove(index, 'down')}
                disabled={index === photos.length - 1}
                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition cursor-pointer"
                title="Move Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleReplace(index)}
                className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Replace Image"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Delete Photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Annotator Canvas Modal */}
      {annotatingIndex !== null && photos[annotatingIndex] && (
        <PhotoAnnotatorModal
          isOpen={true}
          onClose={() => setAnnotatingIndex(null)}
          imageUrl={photos[annotatingIndex].url}
          photoLabel={photos[annotatingIndex].label}
          initialTool={modalInitialTool}
          onSave={handleSaveAnnotatedPhoto}
        />
      )}
    </div>
  );
};
