import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface ColorContextType {
  primaryColor: string;
  secondaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
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

const DEFAULT_PRIMARY = '#0d214f';
const DEFAULT_SECONDARY = '#ea580c';

export const useColorProvider = () => {
  const [primaryColor, setPrimaryColorState] = useState(DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColorState] = useState(DEFAULT_SECONDARY);

  useEffect(() => {
    const savedPrimary = localStorage.getItem('custom_primary_color') || DEFAULT_PRIMARY;
    const savedSecondary = localStorage.getItem('custom_secondary_color') || DEFAULT_SECONDARY;
    
    setPrimaryColorState(savedPrimary);
    setSecondaryColorState(savedSecondary);
    applyColorsToDOM(savedPrimary, savedSecondary);
  }, []);

  const applyColorsToDOM = (primary: string, secondary: string) => {
    document.documentElement.style.setProperty('--color-primary', primary);
    document.documentElement.style.setProperty('--color-secondary', secondary);
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

  const resetColors = () => {
    setPrimaryColorState(DEFAULT_PRIMARY);
    setSecondaryColorState(DEFAULT_SECONDARY);
    localStorage.setItem('custom_primary_color', DEFAULT_PRIMARY);
    localStorage.setItem('custom_secondary_color', DEFAULT_SECONDARY);
    applyColorsToDOM(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
  };

  return {
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    setSecondaryColor,
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