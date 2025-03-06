
import React from 'react';
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl text-center mb-4 animate-fade-in">
        <h1 className="text-3xl font-medium text-gray-800 mb-2">FAQ Assistant</h1>
        <p className="text-gray-600 max-w-lg mx-auto">
          Ask your questions below and get instant, helpful answers.
        </p>
      </div>
      
      <div className="w-full max-w-5xl animate-scale-in transform transition-all">
        <ChatInterface />
      </div>
      
      <div className="w-full max-w-5xl text-center mt-4 text-sm text-gray-500 animate-fade-in">
        <p>Powered by Voiceflow Dialog Manager API</p>
      </div>
    </div>
  );
};

export default Index;
