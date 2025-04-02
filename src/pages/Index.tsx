
import React from 'react';
import ChatInterface from '@/components/ChatInterface';
import WidgetResizer from '@/components/WidgetResizer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center p-4 font-sans">
      <div className="w-full max-w-4xl py-16">
        <div className="w-full animate-scale-in transform transition-all">
          <WidgetResizer>
            <ChatInterface />
          </WidgetResizer>
        </div>
      </div>
      
      {/* Added extra content to ensure scrollability */}
      <div className="h-[800px] w-full flex items-center justify-center text-gray-400 text-lg">
        Scroll area to test widget behavior
      </div>
    </div>
  );
};

export default Index;
