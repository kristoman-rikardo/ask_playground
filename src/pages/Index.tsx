import React from 'react';
import ChatInterface from '@/components/ChatInterface';

// Add interface for Index props
interface IndexProps {
  isEmbedded?: boolean;
}

const Index = ({ isEmbedded = false }: IndexProps) => {
  return (
    <div className={`bg-transparent overflow-hidden flex flex-col p-4 font-sans ${isEmbedded ? '' : 'min-h-screen'}`}>
      <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
        <div className="w-full flex-1 flex flex-col">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};

export default Index;
