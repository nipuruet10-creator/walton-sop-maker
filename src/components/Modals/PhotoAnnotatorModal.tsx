import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Square,
  MoveRight,
  Circle,
  PenTool,
  Type,
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
}

type ToolType = 'box' | 'arrow' | 'circle' | 'pen' | 'text';

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
}) => {
  const [selectedTool, setSelectedTool] = useState<ToolType>('box');
  const [currentColor, setCurrentColor] = useState<string>('#dc2626');
  const [currentWidth, setCurrentWidth] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  const [history, setHistory] = useState<AnnotationAction[]>([]);
  const [redoList, setRedoList] = useState<AnnotationAction[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

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
      redrawCanvas([]);
    };
  }, [isOpen, imageUrl]);

  // Redraw canvas with all completed annotations plus optional active drawing
  const redrawCanvas = (
    currentHistory: AnnotationAction[],
    activeDrawing?: AnnotationAction | null
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

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const updated = history.slice(0, history.length - 1);
    setHistory(updated);
    setRedoList((prev) => [last, ...prev]);
    redrawCanvas(updated);
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
    if (history.length === 0) return;
    if (confirm('আপনি কি সব মার্কিং ও ড্রয়িং মুছে ফেলতে চান?')) {
      setHistory([]);
      setRedoList([]);
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
              onClick={() => setSelectedTool('box')}
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
              onClick={() => setSelectedTool('arrow')}
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
              onClick={() => setSelectedTool('circle')}
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
              onClick={() => setSelectedTool('pen')}
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
              onClick={() => setSelectedTool('text')}
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

          {/* Color & Stroke Width selector */}
          <div className="flex items-center gap-3">
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
              disabled={history.length === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
              title="Undo (পূর্বাবস্থায় ফেরান)"
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
              disabled={history.length === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 disabled:opacity-40 transition cursor-pointer"
              title="Clear All (সব মুছুন)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

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
            {history.length > 0 ? (
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
