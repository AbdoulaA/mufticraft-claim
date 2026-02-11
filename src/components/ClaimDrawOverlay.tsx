import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Undo2, Trash2, Save, X } from "lucide-react";

export type PointN = { x: number; y: number }; // normalized 0..1

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function dist(a: PointN, b: PointN) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function ClaimDrawOverlay({
  onSave,
}: {
  onSave?: (points: PointN[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [points, setPoints] = useState<PointN[]>([]);
  const [isClosed, setIsClosed] = useState(false);

  const canClose = points.length >= 3 && !isClosed;

  const polygonPointsPx = useMemo(() => {
    const el = containerRef.current;
    if (!el) return "";
    const r = el.getBoundingClientRect();
    return points.map((p) => `${p.x * r.width},${p.y * r.height}`).join(" ");
  }, [points]);

  const handleClick = (e: React.MouseEvent) => {
    if (!drawMode) return;
    if (!containerRef.current) return;

    const r = containerRef.current.getBoundingClientRect();
    const x = clamp01((e.clientX - r.left) / r.width);
    const y = clamp01((e.clientY - r.top) / r.height);

    // click near first point to close
    if (canClose) {
      const first = points[0];
      const p = { x, y };
      if (dist(first, p) < 0.02) {
        setIsClosed(true);
        return;
      }
    }

    if (isClosed) return;
    setPoints((prev) => [...prev, { x, y }]);
  };

  const undo = () => {
    if (isClosed) setIsClosed(false);
    setPoints((prev) => prev.slice(0, -1));
  };

  const clear = () => {
    setIsClosed(false);
    setPoints([]);
  };

  const close = () => {
    if (points.length >= 3) setIsClosed(true);
  };

  const save = () => {
    if (points.length < 3) return;
    onSave?.(points);
    setIsClosed(true);
    setDrawMode(false);
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setDrawMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Toolbar */}
      <div className="pointer-events-auto absolute top-4 left-4 right-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setDrawMode((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
              drawMode ? "bg-yellow-400 text-blue-900" : "bg-white/10 text-white border border-white/20"
            }`}
          >
            <Pencil className="w-4 h-4" />
            {drawMode ? "Drawing…" : "Draw Claim"}
          </button>

          <button
            onClick={undo}
            disabled={points.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 disabled:opacity-40"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </button>

          <button
            onClick={clear}
            disabled={points.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>

          <button
            onClick={close}
            disabled={points.length < 3 || isClosed}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 disabled:opacity-40"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>

        <button
          onClick={save}
          disabled={points.length < 3}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold disabled:opacity-40"
        >
          <Save className="w-4 h-4" />
          Save Claim Shape
        </button>
      </div>

      {/* Click layer + SVG */}
      <div
        ref={containerRef}
        onClick={handleClick}
        className={`absolute inset-0 ${drawMode ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"}`}
      >
        <svg className="absolute inset-0 w-full h-full">
          {points.length >= 3 && (isClosed || drawMode) && (
            <polygon
              points={polygonPointsPx}
              fill="rgba(250, 204, 21, 0.18)"
              stroke="rgba(250, 204, 21, 0.95)"
              strokeWidth="2"
            />
          )}

          {!isClosed && points.length >= 2 && (
            <polyline
              points={polygonPointsPx}
              fill="none"
              stroke="rgba(250, 204, 21, 0.95)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          )}

          {points.map((p, i) => (
            <circle
              key={i}
              cx={`${p.x * 100}%`}
              cy={`${p.y * 100}%`}
              r="5"
              fill={i === 0 ? "rgba(59, 130, 246, 1)" : "rgba(250, 204, 21, 1)"}
              stroke="rgba(15, 23, 42, 0.8)"
              strokeWidth="2"
            />
          ))}
        </svg>

        {drawMode && (
          <div className="pointer-events-none absolute bottom-4 left-4 bg-black/40 text-white text-sm px-3 py-2 rounded-lg border border-white/10">
            Click to place points. Click near the <span className="font-semibold">blue</span> first point to close.
          </div>
        )}
      </div>
    </div>
  );
}
