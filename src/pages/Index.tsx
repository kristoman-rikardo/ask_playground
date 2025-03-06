
import React from 'react';
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl animate-scale-in transform transition-all">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Index;
