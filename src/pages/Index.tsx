
import React from 'react';
import ChatInterface from '@/components/ChatInterface';
import WidgetResizer from '@/components/WidgetResizer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full animate-scale-in transform transition-all">
        <WidgetResizer>
          <ChatInterface />
        </WidgetResizer>
      </div>
    </div>
  );
};

export default Index;
