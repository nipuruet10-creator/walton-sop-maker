import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Square,
  MoveRight,
  Circle,
  PenTool,
  Type,
  Crop,
  Undo2,
  Redo2,
  Trash2,
  Check,
  X,
  Palette,
  Layers,
} from 'lucide-react';

interface PhotoAnnotatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  photoLabel: string;
  onSave: (annotatedBase64: string) => void;
  initialTool?: ToolType;
}

export type ToolType = 'box' | 'arrow' | 'circle' | 'pen' | 'text' | 'crop';

interface AnnotationAction {
  tool: ToolType;
  color: string;
  strokeWidth: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  points?: { x: number; y: number }[];
  text?: string;
}

const COLORS = [
  { name: 'Red', hex: '#dc2626' },
  { name: 'Walton Blue', hex: '#005697' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Black', hex: '#000000' },
];

const STROKE_WIDTHS = [2, 4, 6, 8];

export const PhotoAnnotatorModal: React.FC<PhotoAnnotatorModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  photoLabel,
  onSave,
  initialTool = 'box',
}) => {
  const [selectedTool, setSelectedTool] = useState<ToolType>(initialTool);
  const [currentColor, setCurrentColor] = useState<string>('#dc2626');
  const [currentWidth, setCurrentWidth] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // Crop Region state
  const [cropSelection, setCropSelection] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [imageUndoStack, setImageUndoStack] = useState<string[]>([]);

  const [history, setHistory] = useState<AnnotationAction[]>([]);
  const [redoList, setRedoList] = useState<AnnotationAction[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Set initial tool if passed
  useEffect(() => {
    if (initialTool) {
      setSelectedTool(initialTool);
    }
  }, [initialTool, isOpen]);

  // Load image onto canvas when modal opens
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      setHistory([]);
      setRedoList([]);
      setCropSelection(null);
      setImageUndoStack([]);
      redrawCanvas([]);
    };
  }, [isOpen, imageUrl]);

  // Redraw canvas with all completed annotations plus optional active drawing or crop selection
  const redrawCanvas = (
    currentHistory: AnnotationAction[],
    activeDrawing?: AnnotationAction | null,
    activeCrop?: { startX: number; startY: number; endX: number; endY: number } | null
  ) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match image intrinsic dimensions for crisp high-res output
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;
    }

    // Clear and draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw all committed annotations
    const actionsToDraw = [...currentHistory];
    if (activeDrawing) {
      actionsToDraw.push(activeDrawing);
    }

    actionsToDraw.forEach((action) => {
      ctx.save();
      ctx.strokeStyle = action.color;
      ctx.fillStyle = action.color;
      ctx.lineWidth = action.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (action.tool === 'box') {
        const x = Math.min(action.startX, action.endX);
        const y = Math.min(action.startY, action.endY);
        const w = Math.abs(action.endX - action.startX);
        const h = Math.abs(action.endY - action.startY);
        ctx.strokeRect(x, y, w, h);
      } else if (action.tool === 'circle') {
        const rx = Math.abs(action.endX - action.startX) / 2;
        const ry = Math.abs(action.endY - action.startY) / 2;
        const cx = Math.min(action.startX, action.endX) + rx;
        const cy = Math.min(action.startY, action.endY) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (action.tool === 'arrow') {
        drawArrow(ctx, action.startX, action.startY, action.endX, action.endY, action.strokeWidth);
      } else if (action.tool === 'pen' && action.points && action.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y);
        }
        ctx.stroke();
      } else if (action.tool === 'text' && action.text) {
        ctx.font = `bold ${action.strokeWidth * 6 + 14}px 'Nirmala UI', sans-serif`;
        // Background tag for readability
        const metrics = ctx.measureText(action.text);
        const textH = action.strokeWidth * 6 + 16;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(action.startX - 4, action.startY - textH + 4, metrics.width + 8, textH + 4);
        ctx.fillStyle = action.color;
        ctx.fillText(action.text, action.startX, action.startY);
      }

      ctx.restore();
    });

    // Draw active Crop Overlay if in crop mode or cropSelection exists
    const crop = activeCrop !== undefined ? activeCrop : cropSelection;
    if (crop) {
      const x = Math.min(crop.startX, crop.endX);
      const y = Math.min(crop.startY, crop.endY);
      const w = Math.abs(crop.endX - crop.startX);
      const h = Math.abs(crop.endY - crop.startY);

      if (w > 3 && h > 3) {
        ctx.save();
        // Dim region outside the crop rectangle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, canvas.width, y);
        ctx.fillRect(0, y + h, canvas.width, canvas.height - (y + h));
        ctx.fillRect(0, y, x, h);
        ctx.fillRect(x + w, y, canvas.width - (x + w), h);

        // Dashed border around crop region
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(x, y, w, h);

        // Rule of thirds subtle lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(x + w / 3, y);
        ctx.lineTo(x + w / 3, y + h);
        ctx.moveTo(x + (2 * w) / 3, y);
        ctx.lineTo(x + (2 * w) / 3, y + h);
        ctx.moveTo(x, y + h / 3);
        ctx.lineTo(x + w, y + h / 3);
        ctx.moveTo(x, y + (2 * h) / 3);
        ctx.lineTo(x + w, y + (2 * h) / 3);
        ctx.stroke();

        // High-contrast corner brackets
        ctx.setLineDash([]);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        const cLen = Math.min(20, w / 4, h / 4);
        ctx.beginPath();
        // Top-left
        ctx.moveTo(x, y + cLen); ctx.lineTo(x, y); ctx.lineTo(x + cLen, y);
        // Top-right
        ctx.moveTo(x + w - cLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cLen);
        // Bottom-left
        ctx.moveTo(x, y + h - cLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cLen, y + h);
        // Bottom-right
        ctx.moveTo(x + w - cLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cLen);
        ctx.stroke();

        // Size badge
        const sizeText = `${Math.round(w)} × ${Math.round(h)} px`;
        ctx.font = 'bold 12px sans-serif';
        const txtMetrics = ctx.measureText(sizeText);
        const badgeW = txtMetrics.width + 16;
        const badgeH = 22;
        const badgeX = x + Math.max(8, (w - badgeW) / 2);
        const badgeY = Math.max(8, y + 8);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
        ctx.fillStyle = '#fde047';
        ctx.fillText(sizeText, badgeX + 8, badgeY + 15);

        ctx.restore();
      }
    }
  };

  // Helper to draw clean directional arrows
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number
  ) => {
    const headLen = Math.max(16, width * 4.5);
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Main line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  // Calculate mouse coordinate relative to canvas resolution
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);

    if (selectedTool === 'crop') {
      const initCrop = { startX: coords.x, startY: coords.y, endX: coords.x, endY: coords.y };
      setCropSelection(initCrop);
      redrawCanvas(history, null, initCrop);
      return;
    }

    if (selectedTool === 'pen') {
      setCurrentPoints([coords]);
    } else if (selectedTool === 'text') {
      const textVal = prompt('টেক্সট বা লেবেল লিখুন (যেমন: ১, ২, বা সুইচ):');
      if (textVal) {
        const newAction: AnnotationAction = {
          tool: 'text',
          color: currentColor,
          strokeWidth: currentWidth,
          startX: coords.x,
          startY: coords.y,
          endX: coords.x,
          endY: coords.y,
          text: textVal,
        };
        const updated = [...history, newAction];
        setHistory(updated);
        setRedoList([]);
        redrawCanvas(updated);
      }
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const coords = getCanvasCoords(e);

    if (selectedTool === 'crop') {
      const activeCrop = { startX: startPos.x, startY: startPos.y, endX: coords.x, endY: coords.y };
      setCropSelection(activeCrop);
      redrawCanvas(history, null, activeCrop);
      return;
    }

    if (selectedTool === 'pen') {
      const updatedPts = [...currentPoints, coords];
      setCurrentPoints(updatedPts);
      const tempAction: AnnotationAction = {
        tool: 'pen',
        color: currentColor,
        strokeWidth: currentWidth,
        startX: startPos.x,
        startY: startPos.y,
        endX: coords.x,
        endY: coords.y,
        points: updatedPts,
      };
      redrawCanvas(history, tempAction);
    } else if (selectedTool === 'box' || selectedTool === 'arrow' || selectedTool === 'circle') {
      const tempAction: AnnotationAction = {
        tool: selectedTool,
        color: currentColor,
        strokeWidth: currentWidth,
        startX: startPos.x,
        startY: startPos.y,
        endX: coords.x,
        endY: coords.y,
      };
      redrawCanvas(history, tempAction);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const coords = getCanvasCoords(e);
    setIsDrawing(false);

    if (selectedTool === 'crop') {
      const finalCrop = { startX: startPos.x, startY: startPos.y, endX: coords.x, endY: coords.y };
      if (Math.abs(finalCrop.endX - finalCrop.startX) > 10 && Math.abs(finalCrop.endY - finalCrop.startY) > 10) {
        setCropSelection(finalCrop);
        redrawCanvas(history, null, finalCrop);
      } else {
        setCropSelection(null);
        redrawCanvas(history, null, null);
      }
      setStartPos(null);
      return;
    }

    let finalAction: AnnotationAction | null = null;
    if (selectedTool === 'pen' && currentPoints.length > 1) {
      finalAction = {
        tool: 'pen',
        color: currentColor,
        strokeWidth: currentWidth,
        startX: startPos.x,
        startY: startPos.y,
        endX: coords.x,
        endY: coords.y,
        points: currentPoints,
      };
    } else if (
      (selectedTool === 'box' || selectedTool === 'arrow' || selectedTool === 'circle') &&
      (Math.abs(coords.x - startPos.x) > 5 || Math.abs(coords.y - startPos.y) > 5)
    ) {
      finalAction = {
        tool: selectedTool,
        color: currentColor,
        strokeWidth: currentWidth,
        startX: startPos.x,
        startY: startPos.y,
        endX: coords.x,
        endY: coords.y,
      };
    }

    if (finalAction) {
      const updated = [...history, finalAction];
      setHistory(updated);
      setRedoList([]);
      redrawCanvas(updated);
    } else {
      redrawCanvas(history);
    }

    setCurrentPoints([]);
    setStartPos(null);
  };

  // Apply Crop and resize canvas
  const handleApplyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cropSelection) return;

    const x = Math.max(0, Math.min(cropSelection.startX, cropSelection.endX));
    const y = Math.max(0, Math.min(cropSelection.startY, cropSelection.endY));
    const w = Math.min(canvas.width - x, Math.abs(cropSelection.endX - cropSelection.startX));
    const h = Math.min(canvas.height - y, Math.abs(cropSelection.endY - cropSelection.startY));

    if (w < 15 || h < 15) {
      alert('ক্রপ করার জন্য অনুগ্রহ করে একটু বড় এরিয়া নির্বাচন করুন।');
      return;
    }

    // Capture clean image before crop to support Undo
    redrawCanvas(history, null, null);
    const prevBase64 = canvas.toDataURL('image/jpeg', 0.95);
    setImageUndoStack((prev) => [...prev, prevBase64]);

    // Create offscreen canvas for cropped portion
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = Math.round(w);
    cropCanvas.height = Math.round(h);
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    cropCtx.drawImage(
      canvas,
      Math.round(x),
      Math.round(y),
      Math.round(w),
      Math.round(h),
      0,
      0,
      Math.round(w),
      Math.round(h)
    );

    const croppedBase64 = cropCanvas.toDataURL('image/jpeg', 0.95);

    const newImg = new Image();
    newImg.crossOrigin = 'anonymous';
    newImg.src = croppedBase64;
    newImg.onload = () => {
      imageRef.current = newImg;
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      setHistory([]);
      setRedoList([]);
      setCropSelection(null);
      setSelectedTool('box');
      redrawCanvas([]);
    };
  };

  const handleCancelCrop = () => {
    setCropSelection(null);
    redrawCanvas(history, null, null);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const last = history[history.length - 1];
      const updated = history.slice(0, history.length - 1);
      setHistory(updated);
      setRedoList((prev) => [last, ...prev]);
      redrawCanvas(updated);
    } else if (imageUndoStack.length > 0) {
      // Undo image crop
      const prevImgUrl = imageUndoStack[imageUndoStack.length - 1];
      setImageUndoStack((prev) => prev.slice(0, prev.length - 1));
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = prevImgUrl;
      img.onload = () => {
        imageRef.current = img;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.naturalWidth || 800;
          canvas.height = img.naturalHeight || 600;
        }
        setCropSelection(null);
        redrawCanvas([]);
      };
    }
  };

  const handleRedo = () => {
    if (redoList.length === 0) return;
    const next = redoList[0];
    const updatedRedo = redoList.slice(1);
    const updatedHist = [...history, next];
    setHistory(updatedHist);
    setRedoList(updatedRedo);
    redrawCanvas(updatedHist);
  };

  const handleClear = () => {
    if (history.length === 0 && !cropSelection) return;
    if (confirm('আপনি কি সব মার্কিং ও ড্রয়িং মুছে ফেলতে চান?')) {
      setHistory([]);
      setRedoList([]);
      setCropSelection(null);
      redrawCanvas([]);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export high-quality image with annotations
    const annotatedBase64 = canvas.toDataURL('image/jpeg', 0.95);
    onSave(annotatedBase64);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>ছবিতে চিহ্নিতকরণ ও ড্রয়িং এডিটর</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                  {photoLabel}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                লাল বক্স, তীরচিহ্ন, বা বৃত্ত দিয়ে ছবির গুরুত্বপূর্ণ পার্টস বা বাটন হাইলাইট করুন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tool selector */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => {
                setSelectedTool('crop');
                setCropSelection(null);
                redrawCanvas(history);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedTool === 'crop'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-amber-400 hover:bg-slate-700/60'
              }`}
              title="Crop Image (ছবি ক্রপ করুন)"
            >
              <Crop className="w-4 h-4" />
              <span>ক্রপ (Crop)</span>
            </button>

            <div className="w-px h-5 bg-slate-700 mx-0.5" />

            <button
              type="button"
              onClick={() => {
                setSelectedTool('box');
                setCropSelection(null);
                redrawCanvas(history);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedTool === 'box'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-700/60'
              }`}
              title="Rectangle Box (বক্স)"
            >
              <Square className="w-4 h-4" />
              <span>বক্স (Box)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedTool('arrow');
                setCropSelection(null);
                redrawCanvas(history);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedTool === 'arrow'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-700/60'
              }`}
              title="Arrow (তীরচিহ্ন)"
            >
              <MoveRight className="w-4 h-4" />
              <span>তীর (Arrow)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedTool('circle');
                setCropSelection(null);
                redrawCanvas(history);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedTool === 'circle'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-700/60'
              }`}
              title="Circle (বৃত্ত)"
            >
              <Circle className="w-4 h-4" />
              <span>বৃত্ত (Circle)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedTool('pen');
                setCropSelection(null);
                redrawCanvas(history);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedTool === 'pen'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-700/60'
              }`}
              title="Freehand Pen (মার্কার / মুক্তহস্তে)"
            >
              <PenTool className="w-4 h-4" />
              <span>মার্কার (Pen)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedTool('text');
                setCropSelection(null);
                redrawCanvas(history);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedTool === 'text'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-700/60'
              }`}
              title="Text Callout (টেক্সট / লেবেল)"
            >
              <Type className="w-4 h-4" />
              <span>টেক্সট (Text)</span>
            </button>
          </div>

          {/* Color & Stroke Width selector (dimmed during crop) */}
          <div className={`flex items-center gap-3 transition ${selectedTool === 'crop' ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {/* Colors */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setCurrentColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                      currentColor === c.hex
                        ? 'border-white scale-125 shadow-md ring-2 ring-white/50'
                        : 'border-slate-600 hover:scale-110'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Stroke widths */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setCurrentWidth(w)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition cursor-pointer ${
                    currentWidth === w ? 'bg-slate-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title={`${w}px`}
                >
                  <span
                    style={{
                      width: `${w * 2}px`,
                      height: `${w * 2}px`,
                      borderRadius: '50%',
                      backgroundColor: currentColor,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* History Actions: Undo / Redo / Clear */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0 && imageUndoStack.length === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
              title="Undo (পূর্বাবস্থায় ফেরান / ক্রপ আনডু)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoList.length === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={history.length === 0 && !cropSelection}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 disabled:opacity-40 transition cursor-pointer"
              title="Clear All (সব মুছুন)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Crop Confirmation Bar */}
        {selectedTool === 'crop' && cropSelection && (
          <div className="px-5 py-2.5 bg-amber-950/95 border-b border-amber-600/60 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-200">
              <Crop className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                কাঙ্ক্ষিত ক্রপ সাইজ নির্বাচন করা হয়েছে: <strong className="text-amber-300 font-mono font-bold">{Math.round(Math.abs(cropSelection.endX - cropSelection.startX))} × {Math.round(Math.abs(cropSelection.endY - cropSelection.startY))} px</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelCrop}
                className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>✂️ ক্রপ প্রয়োগ করুন (Apply Crop)</span>
              </button>
            </div>
          </div>
        )}

        {selectedTool === 'crop' && !cropSelection && (
          <div className="px-5 py-2 bg-slate-950 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Crop className="w-4 h-4 text-amber-400" />
              <span>ছবির যে অংশটুকু রাখতে চান, মাউস দিয়ে সেটির চারদিকে ড্র্যাগ করে ক্রপ বক্স আঁকুন।</span>
            </div>
          </div>
        )}

        {/* Canvas Workspace (Scrollable/Centered) */}
        <div className="flex-1 bg-slate-950 p-4 overflow-auto flex items-center justify-center select-none relative min-h-[420px]">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-2xl border border-slate-700 cursor-crosshair bg-white"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/80">
          <div className="text-xs text-slate-400">
            {selectedTool === 'crop' ? (
              <span className="text-amber-400 font-medium">✂️ ক্রপ মোড সক্রিয়: ড্র্যাগ করে অংশ নির্বাচন করুন ও 'ক্রপ প্রয়োগ করুন' চাপুন।</span>
            ) : history.length > 0 ? (
              <span>{history.length} টি মার্কিং যুক্ত করা হয়েছে</span>
            ) : (
              <span>ছবিতে ড্র্যাগ করে বক্স বা তীরচিহ্ন আঁকুন</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>সংরক্ষণ করুন (Save & Apply)</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
