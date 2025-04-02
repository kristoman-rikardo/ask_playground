
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
      
      const newHeight = Math.max(
        300, 
        Math.min(600, currentHeight)
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
      className="w-full mx-auto bg-transparent shadow-none rounded-2xl overflow-hidden transition-all font-sans"
      style={{ height: 'auto' }}
    >
      <div className="flex flex-col h-full">
        <div 
          ref={messagesContainerRef}
          className="flex-1 flex flex-col overflow-hidden overflow-y-auto transition-all duration-300"
          style={{ 
            height: conversationStarted ? `${messagesHeight}px` : '0px', 
            minHeight: conversationStarted ? '300px' : '0px', 
            maxHeight: '600px',
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
        
        {/* Always show input field regardless of conversation state */}
        <ChatInputArea onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatInterface;
