
import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Move, X, ChevronDown, Palette } from 'lucide-react';

interface WidgetResizerProps {
  children: React.ReactNode;
}

const WidgetResizer: React.FC<WidgetResizerProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(100); // Percentage of container width
  const [height, setHeight] = useState(400); // Height in pixels
  const [colorPanel, setColorPanel] = useState(false);
  
  // Color customization
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [buttonBgColor, setButtonBgColor] = useState('#F1F1F1');
  const [buttonHoverColor, setButtonHoverColor] = useState('#E5E5E5');
  const [accentColor, setAccentColor] = useState('#333333');

  // Apply custom colors to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--widget-bg-color', bgColor);
    document.documentElement.style.setProperty('--faq-light', buttonBgColor);
    document.documentElement.style.setProperty('--faq-medium', buttonHoverColor);
    document.documentElement.style.setProperty('--widget-accent-color', accentColor);
  }, [bgColor, buttonBgColor, buttonHoverColor, accentColor]);

  // Predefined size options
  const sizeOptions = [
    { label: 'XS', value: 40 },
    { label: 'S', value: 60 },
    { label: 'M', value: 80 },
    { label: 'L', value: 100 },
  ];

  // Predefined height options
  const heightOptions = [
    { label: 'S', value: 300 },
    { label: 'M', value: 400 },
    { label: 'L', value: 500 },
    { label: 'XL', value: 600 },
  ];

  // Predefined color themes
  const colorThemes = [
    { name: 'Default', bg: '#FFFFFF', button: '#F1F1F1', hover: '#E5E5E5', accent: '#333333' },
    { name: 'Dark', bg: '#1A1F2C', button: '#2A3142', hover: '#3A4152', accent: '#9b87f5' },
    { name: 'Blue', bg: '#F0F7FF', button: '#D3E4FD', hover: '#B3D4FD', accent: '#0EA5E9' },
    { name: 'Green', bg: '#F2FCE2', button: '#E2FCE2', hover: '#D2ECB2', accent: '#22C55E' },
    { name: 'Soft', bg: '#F1F0FB', button: '#E5DEFF', hover: '#D5CEFF', accent: '#8B5CF6' },
  ];

  const applyColorTheme = (theme: typeof colorThemes[0]) => {
    setBgColor(theme.bg);
    setButtonBgColor(theme.button);
    setButtonHoverColor(theme.hover);
    setAccentColor(theme.accent);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Size control panel */}
      <div className="absolute top-0 right-0 z-10">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-800 text-white p-2 rounded-md hover:bg-gray-700 transition-colors"
          title="Resize Widget"
        >
          {isOpen ? <X size={16} /> : <Move size={16} />}
        </button>
        
        {isOpen && (
          <div className="absolute top-10 right-0 bg-white shadow-lg rounded-md p-3 border border-gray-200 w-[260px]">
            <div className="space-y-4">
              {/* Width control */}
              <div>
                <h3 className="font-medium mb-2 text-sm">Widget Width: {width}%</h3>
                <input
                  type="range"
                  min={25}
                  max={100}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full mb-3"
                />
                
                {/* Preset width buttons */}
                <div className="flex justify-between gap-2">
                  {sizeOptions.map((option) => (
                    <button 
                      key={option.label}
                      onClick={() => setWidth(option.value)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        width === option.value 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Height control */}
              <div>
                <h3 className="font-medium mb-2 text-sm">Widget Height: {height}px</h3>
                <input
                  type="range"
                  min={200}
                  max={700}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full mb-3"
                />
                
                {/* Preset height buttons */}
                <div className="flex justify-between gap-2">
                  {heightOptions.map((option) => (
                    <button 
                      key={option.label}
                      onClick={() => setHeight(option.value)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        height === option.value 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Color customization toggle */}
              <div>
                <button
                  onClick={() => setColorPanel(!colorPanel)}
                  className="flex items-center justify-between w-full px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Palette size={14} />
                    <span className="text-sm font-medium">Color Themes</span>
                  </span>
                  <ChevronDown size={14} className={`transition-transform ${colorPanel ? 'rotate-180' : ''}`} />
                </button>
                
                {colorPanel && (
                  <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      {colorThemes.map((theme) => (
                        <button
                          key={theme.name}
                          onClick={() => applyColorTheme(theme)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm"
                        >
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300" 
                            style={{ backgroundColor: theme.button }}
                          ></div>
                          {theme.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quick resize buttons */}
              <div className="flex justify-between">
                <button 
                  onClick={() => setWidth(Math.max(25, width - 10))}
                  className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                >
                  <Minimize2 size={14} /> Narrower
                </button>
                <button 
                  onClick={() => setWidth(Math.min(100, width + 10))}
                  className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                >
                  <Maximize2 size={14} /> Wider
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Resizable container for the widget */}
      <div 
        className="transition-all duration-300 mx-auto"
        style={{ 
          width: `${Math.max(width, 25)}%`,
        }}
      >
        <div style={{ minHeight: `${height}px` }} className="widget-container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default WidgetResizer;
