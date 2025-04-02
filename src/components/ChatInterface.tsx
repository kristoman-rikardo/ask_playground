
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
  // Track the height of the messages container
  const [messagesHeight, setMessagesHeight] = useState(0); // Start with 0 height (collapsed)
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastContentHeightRef = useRef<number>(300);
  const visibleContentHeightRef = useRef<number>(300);
  
  // Mark conversation as started when user sends first message or when we have any messages
  useEffect(() => {
    if (messages.length > 0 && !conversationStarted) {
      setConversationStarted(true);
    }
  }, [messages, conversationStarted]);
  
  // Update the height when messages change with improved calculation
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      // Get the current visible content height
      const currentHeight = messagesContainerRef.current.scrollHeight;
      
      // Store the height of visible content
      visibleContentHeightRef.current = currentHeight;
      
      // Use a more stable approach to determine height
      const newHeight = Math.max(
        300, // Minimum height
        Math.min(600, currentHeight) // Cap at maximum height
      );
      
      // Only update if significant change
      if (Math.abs(newHeight - lastContentHeightRef.current) > 20) {
        setMessagesHeight(newHeight);
        lastContentHeightRef.current = newHeight;
      }
    }
  }, [messages, isTyping, carouselData]);
  
  // Handler to start conversation and send message
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
            height: conversationStarted ? `${messagesHeight}px` : '0px', // Start with 0px height
            minHeight: conversationStarted ? '300px' : '0px', // Start with 0px min-height
            maxHeight: '600px',
            opacity: conversationStarted ? 1 : 0, // Hide content initially
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
        
        {/* Only show input area after conversation has started */}
        {conversationStarted && (
          <ChatInputArea onSendMessage={handleSendMessage} />
        )}
        
        {/* Show initial prompt if conversation hasn't started */}
        {!conversationStarted && (
          <div className="w-full bg-transparent p-4">
            <button
              onClick={() => handleSendMessage("Hei, kan du hjelpe meg?")}
              className="w-full px-4 py-2 font-light font-sans transition-all duration-300 rounded-2xl
                bg-gray-100/80 shadow-md hover:shadow-lg text-gray-500 hover:bg-gray-100/90 text-left"
              style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
            >
              Spør om produktet...
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
