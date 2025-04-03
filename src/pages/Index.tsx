
import React from 'react';
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  return (
    <div className="min-h-screen bg-transparent overflow-hidden flex flex-col p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto mt-8">
        <div className="w-full">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};

export default Index;
