
import React from 'react';
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  return (
    <div className="h-full w-full bg-transparent overflow-hidden flex flex-col font-sans">
      <div className="h-full w-full mx-auto">
        <div className="h-full w-full">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};

export default Index;
