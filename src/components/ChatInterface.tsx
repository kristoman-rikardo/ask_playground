
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messages.length > 0 && !conversationStarted) {
      setConversationStarted(true);
    }
  }, [messages, conversationStarted]);
  
  // Calculate available height for messages area, ensuring input and buttons are always visible
  useEffect(() => {
    if (chatContainerRef.current && messagesContainerRef.current) {
      const totalHeight = chatContainerRef.current.clientHeight;
      // Reserve 130px for input (60px) and buttons (70px)
      const reservedHeight = 130;
      const availableHeight = totalHeight - reservedHeight;
      
      // Set a minimum height for messages area
      const minMessageHeight = 200;
      const maxMessageHeight = 600; // Adjusted to ensure total stays under 800px with reserved space
      
      // Calculate desired message height based on content
      let contentHeight = messagesContainerRef.current.scrollHeight;
      if (messages.length === 0) {
        contentHeight = minMessageHeight;
      }
      
      // Set the messages area height
      const newHeight = Math.max(
        minMessageHeight, 
        Math.min(maxMessageHeight, Math.min(availableHeight, contentHeight))
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
      ref={chatContainerRef}
      className="w-full mx-auto bg-transparent shadow-none rounded-2xl overflow-hidden transition-all font-sans flex flex-col"
      style={{ 
        height: '100%', 
        maxHeight: '800px',
        minHeight: '400px'
      }}
    >
      <div className="flex flex-col h-full">
        <div 
          ref={messagesContainerRef}
          className="flex-1 flex flex-col overflow-hidden overflow-y-auto transition-all duration-300"
          style={{ 
            height: conversationStarted ? `${messagesHeight}px` : '0px',
            minHeight: conversationStarted ? '200px' : '0px',
            opacity: conversationStarted ? 1 : 0,
            flexShrink: 1,
            flexGrow: 1
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
        
        {/* Button panel with fixed height */}
        <div className="flex-shrink-0" style={{ minHeight: '70px' }}>
          <ButtonPanel 
            buttons={buttons} 
            isLoading={isButtonsLoading} 
            onButtonClick={handleButtonClick} 
          />
        </div>
        
        {/* Input area with fixed height */}
        <div className="flex-shrink-0" style={{ minHeight: '60px' }}>
          <ChatInputArea onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
