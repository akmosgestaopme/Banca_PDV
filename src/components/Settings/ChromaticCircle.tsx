import React, { useState, useRef, useEffect } from 'react';

interface ChromaticCircleProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  onRealTimeChange?: (color: string) => void;
}

const ChromaticCircle: React.FC<ChromaticCircleProps> = ({
  label,
  color,
  onChange,
  onRealTimeChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const size = 200;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 10;

  useEffect(() => {
    drawColorWheel();
  }, []);

  const drawColorWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= radius) {
          const angle = Math.atan2(dy, dx);
          const hue = (angle + Math.PI) / (2 * Math.PI) * 360;
          const saturation = Math.min(distance / radius, 1) * 100;
          const lightness = 50;
          
          const rgb = hslToRgb(hue, saturation, lightness);
          const index = (y * size + x) * 4;
          
          data[index] = rgb.r;     // Red
          data[index + 1] = rgb.g; // Green
          data[index + 2] = rgb.b; // Blue
          data[index + 3] = 255;   // Alpha
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const getColorAtPosition = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return color;

    const rect = canvas.getBoundingClientRect();
    const canvasX = (x - rect.left) * (size / rect.width);
    const canvasY = (y - rect.top) * (size / rect.height);

    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= radius) {
      const angle = Math.atan2(dy, dx);
      const hue = (angle + Math.PI) / (2 * Math.PI) * 360;
      const saturation = Math.min(distance / radius, 1) * 100;
      const lightness = 50;
      
      const rgb = hslToRgb(hue, saturation, lightness);
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    }

    return color;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const newColor = getColorAtPosition(e.clientX, e.clientY);
    onChange(newColor);
    onRealTimeChange?.(newColor);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newColor = getColorAtPosition(e.clientX, e.clientY);
    onChange(newColor);
    onRealTimeChange?.(newColor);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    const newColor = getColorAtPosition(touch.clientX, touch.clientY);
    onChange(newColor);
    onRealTimeChange?.(newColor);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newColor = getColorAtPosition(touch.clientX, touch.clientY);
    onChange(newColor);
    onRealTimeChange?.(newColor);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-lg font-semibold">{label}</label>
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg border-2 border-gray-300"
            style={{ backgroundColor: color }}
          />
          <input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 px-2 py-1 text-xs font-mono border rounded"
            placeholder="#000000"
          />
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex justify-center"
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-full cursor-crosshair shadow-lg border-2 border-gray-200"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            maxWidth: '200px', 
            maxHeight: '200px',
            touchAction: 'none'
          }}
        />
      </div>

      <div className="text-center">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-300"
        />
        <p className="text-xs text-gray-500 mt-2">
          Clique no círculo ou use o seletor acima
        </p>
      </div>
    </div>
  );
};

export default ChromaticCircle;