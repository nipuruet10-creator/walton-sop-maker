import React, { useRef } from 'react';
import type { SOPPhoto } from '../../types/sop';
import { toBengaliNumber } from '../../data/defaultSopData';
import { Upload, ArrowUp, ArrowDown, Trash2, RefreshCw, Image as ImageIcon, AlertCircle, LayoutGrid, Maximize } from 'lucide-react';

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

  // Re-index photo labels: চিত্র-১, চিত্র-২ ...
  const reindex = (list: SOPPhoto[]): SOPPhoto[] => {
    return list.map((p, idx) => ({
      ...p,
      label: `চিত্র-${toBengaliNumber(idx + 1)}`,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 9 - photos.length;
    if (remainingSlots <= 0) {
      alert('Maximum 9 photos are supported in the A4 SOP layout.');
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);
    const newPhotos: SOPPhoto[] = [];

    let processed = 0;
    filesToRead.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          url: event.target?.result as string,
          label: '',
          name: file.name,
        });
        processed++;
        if (processed === filesToRead.length) {
          onChange(reindex([...photos, ...newPhotos]));
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
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
      if (!confirm('The recommended layout requires at least 4 photos. Are you sure you want to remove this photo?')) {
        return;
      }
    }
    const updated = photos.filter((_, i) => i !== index);
    onChange(reindex(updated));
  };

  return (
    <div className="space-y-4">
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2.5">
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
            {(photos.length >= 7) && '3 × 3 Grid (Balanced)'}
          </span>
        </div>

        {/* Photo Aspect Ratio & Alignment Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/80 text-xs">
          <div>
            <label className="block text-[10.5px] font-semibold text-blue-950 mb-1 flex items-center gap-1">
              <Maximize className="w-3 h-3 text-blue-600" />
              <span>ছবি অ্যাডজাস্টমেন্ট (Aspect Ratio)</span>
            </label>
            <div className="flex bg-white rounded border border-blue-300 p-0.5">
              <button
                type="button"
                onClick={() => onUpdateFit?.('contain')}
                className={`flex-1 py-1 text-[11px] font-medium rounded transition cursor-pointer ${
                  imageFit === 'contain' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
                title="সম্পূর্ণ ছবি দেখাও, কোনো ছবি লম্বা বা চ্যাপ্টা হবে না"
              >
                Fit (ন্যাচারাল অনুপাত)
              </button>
              <button
                type="button"
                onClick={() => onUpdateFit?.('cover')}
                className={`flex-1 py-1 text-[11px] font-medium rounded transition cursor-pointer ${
                  imageFit === 'cover' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
                title="ঘর সম্পূর্ণ পূর্ণ করো"
              >
                Fill (ঘর পূর্ণ)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-semibold text-blue-950 mb-1 flex items-center gap-1">
              <LayoutGrid className="w-3 h-3 text-blue-600" />
              <span>কলাম লেআউট</span>
            </label>
            <select
              value={gridCols}
              onChange={(e) => onUpdateGridCols?.(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-[11px] text-slate-800 focus:outline-none"
            >
              <option value={0}>Auto (সঠিক আকার)</option>
              <option value={3}>3 Columns (ওয়ালটন স্ট্যান্ডার্ড)</option>
              <option value={2}>2 Columns (বড় ছবি)</option>
              <option value={4}>4 Columns (কমপ্যাক্ট)</option>
            </select>
          </div>
        </div>

        <p className="text-[10.5px] text-blue-800">
          ছবিগুলো স্বয়ংক্রিয়ভাবে সঠিক অনুপাতে ফ্রেমের ভেতরে বসবে। লম্বা বা বিকৃত হবে না এবং নিচে স্পষ্ট হলুদ নম্বরিং থাকবে।
        </p>
      </div>

      {photos.length < 4 && (
        <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-800 p-2.5 rounded border border-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>অনুকূল SOP ডিজাইনের জন্য কমপক্ষে ৪টি ছবি আপলোড করার পরামর্শ দেওয়া হচ্ছে।</span>
        </div>
      )}

      {/* Upload Drop Button */}
      {photos.length < 9 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 p-3.5 rounded-xl transition cursor-pointer group text-xs font-semibold"
        >
          <Upload className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
          <span>+ নতুন ছবি আপলোড করুন ({9 - photos.length} টি বাকি আছে)</span>
        </button>
      )}

      {/* Photo List & Order Manager */}
      <div className="space-y-2">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 hover:border-blue-300 shadow-xs transition"
          >
            {/* Thumbnail */}
            <div className="relative w-16 h-12 rounded overflow-hidden bg-slate-100 shrink-0 border border-slate-300 flex items-center justify-center">
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
                অবস্থান #{index + 1}
              </span>
            </div>

            {/* Actions: Move Up / Down, Replace, Delete */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleMove(index, 'up')}
                disabled={index === 0}
                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded disabled:opacity-30 transition cursor-pointer"
                title="উপরে নিন"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMove(index, 'down')}
                disabled={index === photos.length - 1}
                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded disabled:opacity-30 transition cursor-pointer"
                title="নিচে নিন"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleReplace(index)}
                className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded transition cursor-pointer"
                title="ছবি পরিবর্তন করুন"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                title="ছবি মুছুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
