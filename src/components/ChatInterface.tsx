
import React, { useState, useEffect, useRef } from 'react';
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
    handleButtonClick,
    stepsTotal,
    currentStepIndex,
    textStreamingStarted,
    carouselData
  } = useChatSession();
  
  // Track if user has started conversation
  const [conversationStarted, setConversationStarted] = useState(false);
  const [messagesHeight, setMessagesHeight] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastContentHeightRef = useRef<number>(300);
  const visibleContentHeightRef = useRef<number>(300);
  
  useEffect(() => {
    if (messages.length > 0 && !conversationStarted) {
      setConversationStarted(true);
    }
  }, [messages, conversationStarted]);
  
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const currentHeight = messagesContainerRef.current.scrollHeight;
      
      visibleContentHeightRef.current = currentHeight;
      
      // Calculate available height (viewport height minus input and padding)
      const viewportHeight = window.innerHeight;
      const inputHeight = 70; // Approximate height of input area
      const paddingSpace = 80; // Space for margins, padding, etc.
      const maxAvailableHeight = viewportHeight - inputHeight - paddingSpace;
      
      const newHeight = Math.max(
        250,
        Math.min(maxAvailableHeight, currentHeight)
      );
      
      if (Math.abs(newHeight - lastContentHeightRef.current) > 20) {
        setMessagesHeight(newHeight);
        lastContentHeightRef.current = newHeight;
      }
    }
  }, [messages, isTyping, carouselData]);
  
  const handleSendMessage = (message: string) => {
    setConversationStarted(true);
    sendUserMessage(message);
  };

  return (
    <div 
      className="w-full mx-auto bg-transparent shadow-none rounded-2xl overflow-hidden transition-all font-sans flex flex-col"
      style={{ height: '100%', maxHeight: '100vh' }}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <div 
          ref={messagesContainerRef}
          className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
          style={{ 
            height: conversationStarted ? `${messagesHeight}px` : '0px', 
            minHeight: conversationStarted ? '250px' : '0px',
            maxHeight: '70vh',
            opacity: conversationStarted ? 1 : 0, 
          }}
        >
          <ChatMessages 
            messages={messages} 
            isTyping={isTyping}
            stepsTotal={stepsTotal}
            currentStepIndex={currentStepIndex} 
            textStreamingStarted={textStreamingStarted}
            carouselData={carouselData}
            onButtonClick={handleButtonClick}
          />
        </div>
        
        <ButtonPanel 
          buttons={buttons} 
          isLoading={isButtonsLoading} 
          onButtonClick={handleButtonClick} 
        />
        
        <div className="mt-auto">
          <ChatInputArea onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
