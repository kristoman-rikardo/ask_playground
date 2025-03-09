
import React, { useState } from 'react';
import { Maximize2, Minimize2, Move, X } from 'lucide-react';

interface WidgetResizerProps {
  children: React.ReactNode;
}

const WidgetResizer: React.FC<WidgetResizerProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(100); // Percentage of container width

  // Predefined size options
  const sizeOptions = [
    { label: 'XS', value: 40 },
    { label: 'S', value: 60 },
    { label: 'M', value: 80 },
    { label: 'L', value: 100 },
  ];

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
          <div className="absolute top-10 right-0 bg-white shadow-lg rounded-md p-3 border border-gray-200 w-[220px]">
            <h3 className="font-medium mb-2 text-sm">Widget Width: {width}%</h3>
            
            {/* Slider control */}
            <input
              type="range"
              min={20}
              max={100}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full mb-3"
            />
            
            {/* Preset size buttons */}
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
            
            {/* Quick resize buttons */}
            <div className="flex justify-between mt-3">
              <button 
                onClick={() => setWidth(Math.max(20, width - 10))}
                className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
              >
                <Minimize2 size={14} /> Smaller
              </button>
              <button 
                onClick={() => setWidth(Math.min(100, width + 10))}
                className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
              >
                <Maximize2 size={14} /> Larger
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Resizable container for the widget */}
      <div 
        className="transition-all duration-300 mx-auto"
        style={{ width: `${width}%` }}
      >
        {children}
      </div>
    </div>
  );
};

export default WidgetResizer;
