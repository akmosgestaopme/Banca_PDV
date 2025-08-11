import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface ColorContextType {
  primaryColor: string;
  secondaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  applyColors: () => void;
  resetColors: () => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export const useColors = () => {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error('useColors deve ser usado dentro de ColorProvider');
  }
  return context;
};

export const useColorProvider = () => {
  const [primaryColor, setPrimaryColorState] = useState('#0d214f');
  const [secondaryColor, setSecondaryColorState] = useState('#ea580c');

  useEffect(() => {
    // Carregar cores salvas
    const savedPrimary = localStorage.getItem('custom_primary_color') || '#0d214f';
    const savedSecondary = localStorage.getItem('custom_secondary_color') || '#ea580c';
    
    setPrimaryColorState(savedPrimary);
    setSecondaryColorState(savedSecondary);
    
    // Aplicar cores imediatamente
    applyColorsToDOM(savedPrimary, savedSecondary);
  }, []);

  const applyColorsToDOM = (primary: string, secondary: string) => {
    // Aplicar CSS custom properties
    document.documentElement.style.setProperty('--color-primary', primary);
    document.documentElement.style.setProperty('--color-secondary', secondary);
    
    // Converter hex para RGB para usar em rgba()
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const primaryRgb = hexToRgb(primary);
    const secondaryRgb = hexToRgb(secondary);

    document.documentElement.style.setProperty('--color-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    document.documentElement.style.setProperty('--color-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
    
    // Aplicar cores em elementos específicos
    const style = document.getElementById('dynamic-colors') || document.createElement('style');
    style.id = 'dynamic-colors';
    
    style.textContent = `
      :root {
        --color-primary: ${primary};
        --color-secondary: ${secondary};
        --color-primary-rgb: ${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b};
        --color-secondary-rgb: ${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b};
      }
      
      /* Botões primários */
      .btn-primary {
        background-color: ${primary} !important;
      }
      
      .btn-primary:hover {
        background-color: ${adjustBrightness(primary, -20)} !important;
      }
      
      /* Botões secundários */
      .btn-secondary {
        background-color: ${secondary} !important;
      }
      
      .btn-secondary:hover {
        background-color: ${adjustBrightness(secondary, -20)} !important;
      }
      
      /* Textos com cores primárias */
      .text-primary {
        color: ${primary} !important;
      }
      
      .text-secondary {
        color: ${secondary} !important;
      }
      
      /* Bordas */
      .border-primary {
        border-color: ${primary} !important;
      }
      
      .border-secondary {
        border-color: ${secondary} !important;
      }
      
      /* Backgrounds */
      .bg-primary {
        background-color: ${primary} !important;
      }
      
      .bg-secondary {
        background-color: ${secondary} !important;
      }
      
      /* Focus states */
      .focus-primary:focus {
        border-color: ${primary} !important;
        box-shadow: 0 0 0 3px rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1) !important;
      }
      
      /* Gradientes */
      .gradient-primary {
        background: linear-gradient(135deg, ${primary} 0%, ${adjustBrightness(primary, 20)} 100%) !important;
      }
      
      .gradient-secondary {
        background: linear-gradient(135deg, ${secondary} 0%, ${adjustBrightness(secondary, 20)} 100%) !important;
      }
      
      /* Sidebar gradient */
      .sidebar-gradient {
        background: linear-gradient(180deg, ${primary} 0%, ${adjustBrightness(primary, 30)} 50%, ${adjustBrightness(primary, -10)} 100%) !important;
      }
      
      /* Hover states */
      .hover-primary:hover {
        background-color: rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1) !important;
        color: ${primary} !important;
      }
      
      .hover-secondary:hover {
        background-color: rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.1) !important;
        color: ${secondary} !important;
      }
      
      /* Ring colors for focus */
      .ring-primary {
        --tw-ring-color: rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.5) !important;
      }
      
      .ring-secondary {
        --tw-ring-color: rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.5) !important;
      }
      
      /* Scrollbar */
      ::-webkit-scrollbar-thumb {
        background-color: ${primary} !important;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background-color: ${adjustBrightness(primary, -20)} !important;
      }
      
      /* Range sliders personalizados */
      input[type="range"]::-webkit-slider-thumb {
        background: ${primary} !important;
        border: 2px solid ${primary} !important;
      }
      
      input[type="range"]::-moz-range-thumb {
        background: ${primary} !important;
        border: 2px solid ${primary} !important;
      }
      
      /* Elementos específicos do RGB picker */
      .rgb-slider-red::-webkit-slider-thumb {
        background: #ef4444 !important;
        border: 2px solid #ef4444 !important;
      }
      
      .rgb-slider-green::-webkit-slider-thumb {
        background: #10b981 !important;
        border: 2px solid #10b981 !important;
      }
      
      .rgb-slider-blue::-webkit-slider-thumb {
        background: #3b82f6 !important;
        border: 2px solid #3b82f6 !important;
      }
    `;
    
    if (!document.head.contains(style)) {
      document.head.appendChild(style);
    }
  };

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
    localStorage.setItem('custom_primary_color', color);
    applyColorsToDOM(color, secondaryColor);
  };

  const setSecondaryColor = (color: string) => {
    setSecondaryColorState(color);
    localStorage.setItem('custom_secondary_color', color);
    applyColorsToDOM(primaryColor, color);
  };

  const applyColors = () => {
    applyColorsToDOM(primaryColor, secondaryColor);
  };

  const resetColors = () => {
    const defaultPrimary = '#0d214f';
    const defaultSecondary = '#ea580c';
    
    setPrimaryColorState(defaultPrimary);
    setSecondaryColorState(defaultSecondary);
    localStorage.setItem('custom_primary_color', defaultPrimary);
    localStorage.setItem('custom_secondary_color', defaultSecondary);
    applyColorsToDOM(defaultPrimary, defaultSecondary);
  };

  return {
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    setSecondaryColor,
    applyColors,
    resetColors
  };
};

export const ColorProvider = ({ children }: { children: ReactNode }) => {
  const colors = useColorProvider();
  return (
    <ColorContext.Provider value={colors}>
      {children}
    </ColorContext.Provider>
  );
};

// Funções utilitárias
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}