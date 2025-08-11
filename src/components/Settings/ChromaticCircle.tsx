import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Palette, Copy, Check, RotateCcw, Pipette } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

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
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brightnessRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isBrightnessDragging, setIsBrightnessDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hsv, setHsv] = useState({ h: 0, s: 100, v: 100 });
  const [wheelPosition, setWheelPosition] = useState({ x: 0, y: 0 });

  // Converter hex para HSV
  const hexToHsv = useCallback((hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    let s = max === 0 ? 0 : diff / max;
    let v = max;
    
    if (diff !== 0) {
      switch (max) {
        case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
        case g: h = (b - r) / diff + 2; break;
        case b: h = (r - g) / diff + 4; break;
      }
      h /= 6;
    }
    
    return { h: h * 360, s: s * 100, v: v * 100 };
  }, []);

  // Converter HSV para hex
  const hsvToHex = useCallback((h: number, s: number, v: number) => {
    h = h % 360;
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));
    
    h /= 360;
    s /= 100;
    v /= 100;
    
    const c = v * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = v - c;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 1/6) { r = c; g = x; b = 0; }
    else if (h >= 1/6 && h < 2/6) { r = x; g = c; b = 0; }
    else if (h >= 2/6 && h < 3/6) { r = 0; g = c; b = x; }
    else if (h >= 3/6 && h < 4/6) { r = 0; g = x; b = c; }
    else if (h >= 4/6 && h < 5/6) { r = x; g = 0; b = c; }
    else if (h >= 5/6 && h < 1) { r = c; g = 0; b = x; }
    
    const red = Math.round((r + m) * 255);
    const green = Math.round((g + m) * 255);
    const blue = Math.round((b + m) * 255);
    
    return "#" + ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);
  }, []);

  // Desenhar o círculo cromático
  const drawChromaticCircle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 20;
    const innerRadius = outerRadius * 0.3;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar o círculo cromático com gradiente radial
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance >= innerRadius && distance <= outerRadius) {
          // Calcular ângulo (hue)
          let angle = Math.atan2(dy, dx) * 180 / Math.PI;
          if (angle < 0) angle += 360;
          
          // Calcular saturação baseada na distância
          const saturation = ((distance - innerRadius) / (outerRadius - innerRadius)) * 100;
          
          // Converter HSV para RGB
          const h = angle / 360;
          const s = saturation / 100;
          const v = 1; // Brilho máximo no círculo
          
          const c = v * s;
          const hPrime = h * 6;
          const xVal = c * (1 - Math.abs((hPrime % 2) - 1));
          const m = v - c;
          
          let r = 0, g = 0, b = 0;
          
          if (hPrime >= 0 && hPrime < 1) { r = c; g = xVal; b = 0; }
          else if (hPrime >= 1 && hPrime < 2) { r = xVal; g = c; b = 0; }
          else if (hPrime >= 2 && hPrime < 3) { r = 0; g = c; b = xVal; }
          else if (hPrime >= 3 && hPrime < 4) { r = 0; g = xVal; b = c; }
          else if (hPrime >= 4 && hPrime < 5) { r = xVal; g = 0; b = c; }
          else if (hPrime >= 5 && hPrime < 6) { r = c; g = 0; b = xVal; }
          
          const red = Math.round((r + m) * 255);
          const green = Math.round((g + m) * 255);
          const blue = Math.round((b + m) * 255);
          
          const index = (y * canvas.width + x) * 4;
          data[index] = red;
          data[index + 1] = green;
          data[index + 2] = blue;
          data[index + 3] = 255;
        } else {
          // Área transparente
          const index = (y * canvas.width + x) * 4;
          data[index + 3] = 0;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Desenhar bordas do círculo
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = theme === 'dark' ? '#374151' : '#d1d5db';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = theme === 'dark' ? '#374151' : '#d1d5db';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Desenhar indicador de posição atual
    const angle = (hsv.h * Math.PI) / 180;
    const distance = innerRadius + (hsv.s / 100) * (outerRadius - innerRadius);
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    // Círculo exterior branco
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Círculo interior com a cor atual
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = hsvToHex(hsv.h, hsv.s, 100);
    ctx.fill();

    setWheelPosition({ x, y });
  }, [hsv.h, hsv.s, theme, hsvToHex]);

  // Desenhar barra de brilho
  const drawBrightnessBar = useCallback(() => {
    const canvas = brightnessRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Criar gradiente de brilho
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#000000');
    gradient.addColorStop(1, hsvToHex(hsv.h, hsv.s, 100));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Adicionar bordas arredondadas
    ctx.strokeStyle = theme === 'dark' ? '#374151' : '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Indicador de posição
    const x = (hsv.v / 100) * canvas.width;
    
    // Sombra do indicador
    ctx.beginPath();
    ctx.arc(x, canvas.height / 2, 12, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // Indicador principal
    ctx.beginPath();
    ctx.arc(x, canvas.height / 2, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Centro do indicador com a cor atual
    ctx.beginPath();
    ctx.arc(x, canvas.height / 2, 6, 0, 2 * Math.PI);
    ctx.fillStyle = hsvToHex(hsv.h, hsv.s, hsv.v);
    ctx.fill();
  }, [hsv, hsvToHex, theme]);

  // Inicializar com a cor atual
  useEffect(() => {
    const hsvColor = hexToHsv(color);
    setHsv(hsvColor);
  }, [color, hexToHsv]);

  // Redesenhar quando HSV mudar
  useEffect(() => {
    drawChromaticCircle();
    drawBrightnessBar();
  }, [hsv, drawChromaticCircle, drawBrightnessBar]);

  // Lidar com clique no círculo cromático
  const handleWheelClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 20;
    const innerRadius = outerRadius * 0.3;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance >= innerRadius && distance <= outerRadius) {
      let angle = Math.atan2(dy, dx) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      
      const saturation = ((distance - innerRadius) / (outerRadius - innerRadius)) * 100;
      
      const newHsv = { ...hsv, h: angle, s: saturation };
      setHsv(newHsv);
      
      const newColor = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
      if (onRealTimeChange) {
        onRealTimeChange(newColor);
      }
      onChange(newColor);
    }
  }, [hsv, hsvToHex, onChange, onRealTimeChange]);

  // Lidar com clique na barra de brilho
  const handleBrightnessClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = brightnessRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const brightness = Math.max(0, Math.min(100, (x / canvas.width) * 100));
    
    const newHsv = { ...hsv, v: brightness };
    setHsv(newHsv);
    
    const newColor = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    if (onRealTimeChange) {
      onRealTimeChange(newColor);
    }
    onChange(newColor);
  }, [hsv, hsvToHex, onChange, onRealTimeChange]);

  // Copiar cor para clipboard
  const copyColor = async () => {
    const hexColor = hsvToHex(hsv.h, hsv.s, hsv.v);
    try {
      await navigator.clipboard.writeText(hexColor);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar cor:', err);
    }
  };

  // Resetar para cor padrão
  const resetColor = () => {
    const defaultHsv = { h: 220, s: 85, v: 31 }; // #0d214f
    setHsv(defaultHsv);
    const defaultColor = hsvToHex(defaultHsv.h, defaultHsv.s, defaultHsv.v);
    onChange(defaultColor);
    if (onRealTimeChange) {
      onRealTimeChange(defaultColor);
    }
  };

  // Cores cromáticas predefinidas
  const chromaticColors = [
    '#FF0000', '#FF4000', '#FF8000', '#FFBF00', '#FFFF00', '#BFFF00',
    '#80FF00', '#40FF00', '#00FF00', '#00FF40', '#00FF80', '#00FFBF',
    '#00FFFF', '#00BFFF', '#0080FF', '#0040FF', '#0000FF', '#4000FF',
    '#8000FF', '#BF00FF', '#FF00FF', '#FF00BF', '#FF0080', '#FF0040'
  ];

  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);

  return (
    <div className={`p-8 rounded-2xl shadow-2xl border ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: currentHex }}
          >
            <Palette size={20} className="text-white" />
          </div>
          {label}
        </h3>
        
        <div className="flex items-center gap-4">
          {/* Preview da cor atual */}
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-20 h-20 rounded-2xl border-4 border-white shadow-2xl cursor-pointer transition-all hover:scale-110 hover:rotate-3"
              style={{ 
                backgroundColor: currentHex,
                boxShadow: `0 10px 30px ${currentHex}40`
              }}
              onClick={copyColor}
              title="Clique para copiar"
            />
            <span className="text-xs font-mono font-bold">{currentHex}</span>
          </div>
          
          {/* Botões de ação */}
          <div className="flex flex-col gap-3">
            <button
              onClick={copyColor}
              className={`p-3 rounded-xl transition-all transform hover:scale-110 ${
                copied 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              title="Copiar código hex"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
            <button
              onClick={resetColor}
              className={`p-3 rounded-xl transition-all transform hover:scale-110 ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              title="Resetar cor"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Círculo Cromático */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-6">
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="cursor-crosshair rounded-full shadow-2xl transition-all hover:scale-105"
            onClick={handleWheelClick}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={(e) => {
              if (isDragging) {
                handleWheelClick(e);
              }
            }}
          />
          
          {/* Indicador central */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${
              theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
            }`}>
              <Pipette size={24} className="text-gray-500" />
            </div>
          </div>
        </div>
        
        {/* Barra de Brilho */}
        <div className="w-full max-w-sm">
          <label className="block text-sm font-bold mb-3 flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-black to-white"></div>
            Brilho ({Math.round(hsv.v)}%)
          </label>
          <div className="relative">
            <canvas
              ref={brightnessRef}
              width={320}
              height={32}
              className="w-full cursor-pointer rounded-xl shadow-lg transition-all hover:shadow-xl"
              onClick={handleBrightnessClick}
              onMouseDown={() => setIsBrightnessDragging(true)}
              onMouseUp={() => setIsBrightnessDragging(false)}
              onMouseLeave={() => setIsBrightnessDragging(false)}
              onMouseMove={(e) => {
                if (isBrightnessDragging) {
                  handleBrightnessClick(e);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Informações Detalhadas da Cor */}
      <div className={`p-6 rounded-xl mb-6 ${
        theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100/50'
      }`}>
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"></div>
          Informações da Cor
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg">{currentHex}</div>
            <div className="text-xs opacity-75">Hexadecimal</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{Math.round(hsv.h)}°</div>
            <div className="text-xs opacity-75">Matiz (Hue)</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{Math.round(hsv.s)}%</div>
            <div className="text-xs opacity-75">Saturação</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{Math.round(hsv.v)}%</div>
            <div className="text-xs opacity-75">Brilho</div>
          </div>
        </div>
      </div>

      {/* Input Hex Direto */}
      <div className="mb-6">
        <label className="block text-sm font-bold mb-3">Código Hexadecimal</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={currentHex}
            onChange={(e) => {
              const hex = e.target.value.toUpperCase();
              if (/^#[0-9A-F]{0,6}$/i.test(hex)) {
                if (hex.length === 7) {
                  const newHsv = hexToHsv(hex);
                  setHsv(newHsv);
                  if (onRealTimeChange) {
                    onRealTimeChange(hex);
                  }
                  onChange(hex);
                }
              }
            }}
            className={`flex-1 px-4 py-3 border-2 rounded-xl font-mono text-center text-xl font-bold transition-all focus:scale-105 ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' 
                : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'
            }`}
            placeholder="#000000"
            maxLength={7}
          />
          <button
            onClick={copyColor}
            className={`px-4 py-3 rounded-xl font-bold transition-all hover:scale-105 ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      {/* Paleta Cromática */}
      <div>
        <label className="block text-sm font-bold mb-4 flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"></div>
          Paleta Cromática
        </label>
        <div className="grid grid-cols-8 md:grid-cols-12 gap-2">
          {chromaticColors.map((chromaticColor, index) => (
            <button
              key={index}
              onClick={() => {
                const newHsv = hexToHsv(chromaticColor);
                setHsv(newHsv);
                onChange(chromaticColor);
                if (onRealTimeChange) {
                  onRealTimeChange(chromaticColor);
                }
              }}
              className={`aspect-square rounded-xl border-3 transition-all hover:scale-125 hover:rotate-12 hover:shadow-lg ${
                currentHex.toUpperCase() === chromaticColor.toUpperCase()
                  ? 'border-white shadow-lg scale-110'
                  : 'border-gray-300 hover:border-white'
              }`}
              style={{ 
                backgroundColor: chromaticColor,
                boxShadow: currentHex.toUpperCase() === chromaticColor.toUpperCase() 
                  ? `0 0 20px ${chromaticColor}80` 
                  : undefined
              }}
              title={chromaticColor}
            />
          ))}
        </div>
      </div>

      {/* Instruções de Uso */}
      <div className={`mt-8 p-4 rounded-xl border-l-4 border-blue-500 ${
        theme === 'dark' ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-800'
      }`}>
        <h5 className="font-bold mb-2 flex items-center gap-2">
          <Palette size={16} />
          Como usar o círculo cromático:
        </h5>
        <div className="text-sm space-y-1">
          <p>🎨 <strong>Círculo externo:</strong> Clique para escolher a matiz (cor base)</p>
          <p>🎯 <strong>Distância do centro:</strong> Controla a saturação da cor</p>
          <p>🌟 <strong>Barra inferior:</strong> Ajusta o brilho da cor selecionada</p>
          <p>📋 <strong>Clique na cor:</strong> Copia automaticamente o código hex</p>
          <p>⌨️ <strong>Digite hex:</strong> Insira códigos de cor diretamente</p>
        </div>
      </div>
    </div>
  );
};

export default ChromaticCircle;