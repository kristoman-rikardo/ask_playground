
import React from 'react';
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto mt-8">
        <div className="w-full">
          <ChatInterface />
        </div>
      </div>
      
      {/* Added extra content to ensure scrollability */}
      <div className="h-[800px] w-full flex items-center justify-center text-gray-400 text-lg mt-16">
        Scroll area to test widget behavior
      </div>
    </div>
  );
};

export default Index;
