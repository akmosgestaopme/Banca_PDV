import React, { useState } from 'react';
import { Sun, Moon, Palette, Upload, Download, Paintbrush, Eye, Save, RefreshCw, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useColors } from '../../hooks/useColors';
import ChromaticCircle from './ChromaticCircle';

const AppearanceScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor, resetColors } = useColors();
  
  const [tempColors, setTempColors] = useState({
    primary: primaryColor,
    secondary: secondaryColor
  });

  const [showRgbPicker, setShowRgbPicker] = useState(false);
  const [rgbValues, setRgbValues] = useState({
    primary: hexToRgb(primaryColor),
    secondary: hexToRgb(secondaryColor)
  });
  const [isApplying, setIsApplying] = useState(false);
  const [activeColorTab, setActiveColorTab] = useState<'primary' | 'secondary'>('primary');

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        localStorage.setItem('company_favicon', result);
        
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (link) {
          link.href = result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        localStorage.setItem('company_logo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (colorType: 'primary' | 'secondary', color: string) => {
    setTempColors(prev => ({ ...prev, [colorType]: color }));
    
    // Atualizar valores RGB
    setRgbValues(prev => ({
      ...prev,
      [colorType]: hexToRgb(color)
    }));
  };

  const handleRgbChange = (colorType: 'primary' | 'secondary', channel: 'r' | 'g' | 'b', value: number) => {
    const newRgbValues = {
      ...rgbValues,
      [colorType]: {
        ...rgbValues[colorType],
        [channel]: value
      }
    };
    
    setRgbValues(newRgbValues);
    
    // Converter RGB para Hex
    const newHex = rgbToHex(
      newRgbValues[colorType].r,
      newRgbValues[colorType].g,
      newRgbValues[colorType].b
    );
    
    setTempColors(prev => ({ ...prev, [colorType]: newHex }));
  };

  const applyColors = () => {
    setIsApplying(true);
    
    // Simular um pequeno atraso para mostrar o efeito de carregamento
    setTimeout(() => {
      setPrimaryColor(tempColors.primary);
      setSecondaryColor(tempColors.secondary);
      setIsApplying(false);
      alert('Cores aplicadas com sucesso!');
    }, 800);
  };

  const handleResetColors = () => {
    resetColors();
    setTempColors({ primary: '#0d214f', secondary: '#ea580c' });
    setRgbValues({
      primary: hexToRgb('#0d214f'),
      secondary: hexToRgb('#ea580c')
    });
    alert('Cores restauradas para o padrão!');
  };

  const presetColors = [
    { name: 'Azul Corporativo', primary: '#0d214f', secondary: '#ea580c' },
    { name: 'Verde Natureza', primary: '#065f46', secondary: '#f59e0b' },
    { name: 'Roxo Moderno', primary: '#581c87', secondary: '#ec4899' },
    { name: 'Vermelho Energia', primary: '#991b1b', secondary: '#f97316' },
    { name: 'Azul Oceano', primary: '#0c4a6e', secondary: '#06b6d4' },
    { name: 'Verde Esmeralda', primary: '#064e3b', secondary: '#10b981' },
    { name: 'Roxo Real', primary: '#4c1d95', secondary: '#a855f7' },
    { name: 'Laranja Vibrante', primary: '#9a3412', secondary: '#eab308' },
    { name: 'Rosa Elegante', primary: '#be185d', secondary: '#f472b6' },
    { name: 'Azul Elétrico', primary: '#1e3a8a', secondary: '#3b82f6' },
    { name: 'Verde Menta', primary: '#047857', secondary: '#34d399' },
    { name: 'Dourado Luxo', primary: '#92400e', secondary: '#fbbf24' },
    { name: 'Violeta Místico', primary: '#6b21a8', secondary: '#c084fc' },
    { name: 'Turquesa Tropical', primary: '#155e75', secondary: '#22d3ee' },
    { name: 'Coral Sunset', primary: '#dc2626', secondary: '#fb7185' },
    { name: 'Índigo Profundo', primary: '#312e81', secondary: '#818cf8' }
  ];

  const companyLogo = localStorage.getItem('company_logo');
  const companyFavicon = localStorage.getItem('company_favicon');

  // Funções utilitárias para conversão de cores
  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function rgbToHex(r: number, g: number, b: number) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  return (
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-gray-800'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Palette size={32} className="text-primary" />
            Aparência e Personalização
          </h1>
          <p className={`${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'} mt-2`}>
            Customize a aparência do sistema • Powered by <span className="font-bold text-secondary">CYBERPIU</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tema */}
          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10">
                <Palette className="text-primary" size={28} />
              </div>
              <h2 className="text-2xl font-bold">Tema do Sistema</h2>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Modo Escuro</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                    Alterne entre tema claro e escuro
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div 
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${
                    theme === 'light' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-300 bg-slate-100'
                  }`}
                  onClick={() => theme === 'dark' && toggleTheme()}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Sun size={24} className="text-yellow-500" />
                    <span className="font-semibold text-gray-800">Tema Claro</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="h-3 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded"></div>
                  </div>
                </div>

                <div 
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${
                    theme === 'dark' 
                      ? 'border-blue-500 bg-blue-900' 
                      : 'border-slate-300 bg-slate-800'
                  }`}
                  onClick={() => theme === 'light' && toggleTheme()}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Moon size={24} className="text-blue-400" />
                    <span className="font-semibold text-white">Tema Escuro</span>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3 shadow-sm">
                    <div className="h-3 bg-slate-600 rounded mb-2"></div>
                    <div className="h-3 bg-slate-500 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Identidade Visual */}
          <div className={`p-8 rounded-3xl shadow-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-secondary/10">
                <Upload className="text-secondary" size={28} />
              </div>
              <h2 className="text-2xl font-bold">Identidade Visual</h2>
            </div>

            <div className="space-y-8">
              {/* Logo */}
              <div>
                <label className="block text-lg font-semibold mb-4">Logo da Empresa</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-blue-300 flex items-center justify-center">
                    {companyLogo ? (
                      <img src={companyLogo} alt="Logo" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <ShoppingCart size={32} className="text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-xl hover:opacity-90 cursor-pointer font-medium text-white btn-primary"
                    >
                      <Upload size={20} />
                      Escolher Logo
                    </label>
                    <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                      PNG, JPG até 2MB. Recomendado: 200x200px
                    </p>
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div>
                <label className="block text-lg font-semibold mb-4">Favicon</label>
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center">
                    {companyFavicon ? (
                      <img src={companyFavicon} alt="Favicon" className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      <Upload size={20} className="text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*,.ico"
                      onChange={handleFaviconUpload}
                      className="hidden"
                      id="favicon-upload"
                    />
                    <label
                      htmlFor="favicon-upload"
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-xl hover:opacity-90 cursor-pointer font-medium text-white btn-secondary"
                    >
                      <Upload size={20} />
                      Escolher Favicon
                    </label>
                    <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-blue-300' : 'text-slate-600'}`}>
                      ICO, PNG até 1MB. Recomendado: 32x32px
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cores Personalizáveis */}
          <div className={`p-8 rounded-3xl shadow-xl lg:col-span-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-100">
                <Paintbrush className="text-purple-500" size={28} />
              </div>
              <h2 className="text-2xl font-bold">Cores Personalizáveis</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Seletor de Cores Avançado */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveColorTab('primary')}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        activeColorTab === 'primary'
                          ? 'bg-primary text-white'
                          : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Cor Primária
                    </button>
                    <button
                      onClick={() => setActiveColorTab('secondary')}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        activeColorTab === 'secondary'
                          ? 'bg-secondary text-white'
                          : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Cor Secundária
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowRgbPicker(!showRgbPicker)}
                    className={`p-2 rounded-lg transition-all ${
                      theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    title={showRgbPicker ? "Ocultar RGB" : "Mostrar RGB"}
                  >
                    <Eye size={20} />
                  </button>
                </div>

                {activeColorTab === 'primary' ? (
                  <ChromaticCircle 
                    label="Cor Primária"
                    color={tempColors.primary}
                    onChange={(color) => handleColorChange('primary', color)}
                    onRealTimeChange={(color) => handleColorChange('primary', color)}
                  />
                ) : (
                  <ChromaticCircle 
                    label="Cor Secundária"
                    color={tempColors.secondary}
                    onChange={(color) => handleColorChange('secondary', color)}
                    onRealTimeChange={(color) => handleColorChange('secondary', color)}
                  />
                )}

                {/* Seletor RGB */}
                {showRgbPicker && (
                  <div className={`mt-8 p-6 rounded-2xl ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 via-green-500 to-blue-500"></div>
                      Ajuste RGB Preciso
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Vermelho */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-sm font-medium flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            Vermelho (R)
                          </label>
                          <span className="text-sm font-mono">
                            {rgbValues[activeColorTab].r}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="255"
                          value={rgbValues[activeColorTab].r}
                          onChange={(e) => handleRgbChange(activeColorTab, 'r', parseInt(e.target.value))}
                          className="w-full rgb-slider-red"
                          style={{
                            background: `linear-gradient(to right, #000000, #ff0000)`
                          }}
                        />
                      </div>
                      
                      {/* Verde */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-sm font-medium flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Verde (G)
                          </label>
                          <span className="text-sm font-mono">
                            {rgbValues[activeColorTab].g}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="255"
                          value={rgbValues[activeColorTab].g}
                          onChange={(e) => handleRgbChange(activeColorTab, 'g', parseInt(e.target.value))}
                          className="w-full rgb-slider-green"
                          style={{
                            background: `linear-gradient(to right, #000000, #00ff00)`
                          }}
                        />
                      </div>
                      
                      {/* Azul */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-sm font-medium flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            Azul (B)
                          </label>
                          <span className="text-sm font-mono">
                            {rgbValues[activeColorTab].b}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="255"
                          value={rgbValues[activeColorTab].b}
                          onChange={(e) => handleRgbChange(activeColorTab, 'b', parseInt(e.target.value))}
                          className="w-full rgb-slider-blue"
                          style={{
                            background: `linear-gradient(to right, #000000, #0000ff)`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Presets de Cores e Preview */}
              <div className="space-y-8">
                {/* Presets de Cores */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Paletas Predefinidas</h3>
                  <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                    {presetColors.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setTempColors({ primary: preset.primary, secondary: preset.secondary });
                          setRgbValues({
                            primary: hexToRgb(preset.primary),
                            secondary: hexToRgb(preset.secondary)
                          });
                        }}
                        className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                          tempColors.primary === preset.primary && tempColors.secondary === preset.secondary
                            ? 'border-blue-500 bg-blue-50'
                            : theme === 'dark' 
                              ? 'border-slate-600 hover:border-slate-500' 
                              : 'border-blue-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2">
                            <div 
                              className="w-8 h-8 rounded-lg"
                              style={{ backgroundColor: preset.primary }}
                            ></div>
                            <div 
                              className="w-8 h-8 rounded-lg"
                              style={{ backgroundColor: preset.secondary }}
                            ></div>
                          </div>
                          <span className="font-medium text-left">{preset.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Eye size={20} />
                    Preview das Cores
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className="p-6 rounded-xl text-white"
                      style={{ backgroundColor: tempColors.primary }}
                    >
                      <h4 className="font-bold text-lg mb-2">Cor Primária</h4>
                      <p>Esta é a cor principal do sistema</p>
                      <button className="mt-3 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all">
                        Botão Exemplo
                      </button>
                    </div>
                    <div 
                      className="p-6 rounded-xl text-white"
                      style={{ backgroundColor: tempColors.secondary }}
                    >
                      <h4 className="font-bold text-lg mb-2">Cor Secundária</h4>
                      <p>Esta é a cor de destaque do sistema</p>
                      <button className="mt-3 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all">
                        Botão Exemplo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Exemplos de Componentes */}
                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className="font-bold mb-4">Exemplos de Componentes</h3>
                  
                  <div className="space-y-4">
                    {/* Botões */}
                    <div className="flex flex-wrap gap-3">
                      <button 
                        className="px-4 py-2 rounded-lg text-white"
                        style={{ backgroundColor: tempColors.primary }}
                      >
                        Botão Primário
                      </button>
                      <button 
                        className="px-4 py-2 rounded-lg text-white"
                        style={{ backgroundColor: tempColors.secondary }}
                      >
                        Botão Secundário
                      </button>
                      <button 
                        className="px-4 py-2 rounded-lg border-2"
                        style={{ 
                          borderColor: tempColors.primary,
                          color: tempColors.primary
                        }}
                      >
                        Botão Outline
                      </button>
                    </div>
                    
                    {/* Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: tempColors.primary }}
                          >
                            <TrendingUp size={16} />
                          </div>
                          <span className="font-medium">Card Primário</span>
                        </div>
                        <div className="text-xs">Exemplo de card com cor primária</div>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: tempColors.secondary }}
                          >
                            <Package size={16} />
                          </div>
                          <span className="font-medium">Card Secundário</span>
                        </div>
                        <div className="text-xs">Exemplo de card com cor secundária</div>
                      </div>
                    </div>
                    
                    {/* Badges */}
                    <div className="flex flex-wrap gap-3">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tempColors.primary }}
                      >
                        Badge Primário
                      </span>
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tempColors.secondary }}
                      >
                        Badge Secundário
                      </span>
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium border"
                        style={{ 
                          borderColor: tempColors.primary,
                          color: tempColors.primary
                        }}
                      >
                        Badge Outline
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-4">
                  <button
                    onClick={handleResetColors}
                    className={`flex-1 border-2 py-4 px-6 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 ${
                      theme === 'dark' 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <RefreshCw size={20} />
                    Restaurar Padrão
                  </button>
                  <button
                    onClick={applyColors}
                    disabled={isApplying}
                    className={`flex-1 bg-primary text-white py-4 px-6 rounded-xl font-bold hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center gap-2 ${
                      isApplying ? 'opacity-70 color-applying' : ''
                    }`}
                  >
                    {isApplying ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Aplicando...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Aplicar Cores
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Informações */}
          <div className={`p-8 rounded-3xl shadow-xl mt-8 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-6">Informações do Sistema</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs">Versão do Sistema:</span>
                  <span className="text-xs font-semibold">v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Tema Atual:</span>
                  <span className="text-xs font-semibold capitalize">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Última Atualização:</span>
                  <span className="text-xs font-semibold">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs">Cor Primária:</span>
                  <span className="text-xs font-mono">{primaryColor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Cor Secundária:</span>
                  <span className="text-xs font-mono">{secondaryColor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Logo Personalizada:</span>
                  <span className="text-xs font-semibold">{companyLogo ? 'Sim' : 'Não'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs">Desenvolvido por:</span>
                  <span className="text-xs font-bold text-secondary">CYBERPIU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Suporte:</span>
                  <span className="text-xs font-semibold">24/7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Licença:</span>
                  <span className="text-xs font-semibold">Comercial</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Créditos CYBERPIU */}
        <div className={`mt-8 p-4 text-center border-t ${
          theme === 'dark' ? 'border-slate-700 text-blue-300' : 'border-blue-200 text-slate-600'
        }`}>
          <p className="text-sm">
            Sistema de Aparência • Powered by <span className="font-bold text-secondary">CYBERPIU</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppearanceScreen;