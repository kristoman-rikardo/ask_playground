
import React, { useState, useEffect } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import ChatMessages from './chat/ChatMessages';
import ChatInputArea from './chat/ChatInputArea';
import ButtonPanel from './ButtonPanel';

const ChatInterface: React.FC = () => {
  const {
    messages,
    isTyping,
    buttons,
    isButtonsLoading,
    sendUserMessage,
    handleButtonClick
  } = useChatSession();
  
  // Debug timer state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  
  // Track when user sends a message and when buttons appear
  useEffect(() => {
    // If there's at least one user message and no response time recorded yet
    if (messages.some(m => m.type === 'user') && !startTime) {
      setStartTime(Date.now());
    }
    
    // If buttons appear after a user message was sent
    if (startTime && buttons.length > 0 && !responseTime) {
      setResponseTime(Date.now() - startTime);
    }
    
    // Reset timer if all messages are cleared
    if (messages.length === 0) {
      setStartTime(null);
      setResponseTime(null);
    }
  }, [messages, buttons, startTime, responseTime]);

  // Only show loading in chat when actual message is being typed, not when buttons are loading
  const showChatLoading = isTyping && !isButtonsLoading;

  return (
    <>
      {/* Debug timer display outside the widget */}
      {startTime && (
        <div className="fixed top-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-md text-xs font-mono z-50 shadow-sm">
          {responseTime 
            ? `Responstid: ${(responseTime / 1000).toFixed(2)}s` 
            : `Venter... ${((Date.now() - startTime) / 1000).toFixed(1)}s`}
        </div>
      )}
      
      <div 
        className="w-full mx-auto bg-[var(--widget-bg-color,white)] shadow-lg rounded-2xl overflow-hidden transition-all font-sans"
        style={{ height: '100%' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col overflow-hidden min-h-[200px]">
            <ChatMessages 
              messages={messages} 
              isTyping={showChatLoading} 
            />
          </div>
          
          <ButtonPanel 
            buttons={buttons} 
            isLoading={isButtonsLoading} 
            onButtonClick={handleButtonClick} 
          />
          
          <ChatInputArea onSendMessage={sendUserMessage} />
        </div>
      </div>
    </>
  );
};

export default ChatInterface;
