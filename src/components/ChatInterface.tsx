
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
  const [messagesHeight, setMessagesHeight] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Mark conversation as started when user sends first message or when we have any messages
  useEffect(() => {
    if (messages.length > 0 && !conversationStarted) {
      setConversationStarted(true);
    }
  }, [messages, conversationStarted]);
  
  // Update the height when messages change
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const height = messagesContainerRef.current.scrollHeight;
      // Only update if the new height is greater than the current one
      setMessagesHeight(prev => Math.max(prev, height));
    }
  }, [messages, isTyping]);
  
  // Handler to start conversation and send message
  const handleSendMessage = (message: string) => {
    setConversationStarted(true);
    sendUserMessage(message);
  };

  return (
    <div 
      className="w-full mx-auto bg-white shadow-sm rounded-2xl overflow-hidden transition-all font-sans border border-gray-200"
      style={{ height: '100%' }}
    >
      <div className="flex flex-col h-full">
        <div 
          ref={messagesContainerRef}
          className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
          style={{ 
            height: conversationStarted ? `${messagesHeight}px` : '0px',
            minHeight: conversationStarted ? '100px' : '0px',
            maxHeight: conversationStarted ? '600px' : '0px',
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
          <div className="w-full bg-transparent border-t border-gray-100 p-4">
            <button
              onClick={() => handleSendMessage("Hei, kan du hjelpe meg?")}
              className="w-full px-4 py-2 font-light font-sans transition-all duration-300 rounded-2xl
                bg-transparent border border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400/50 text-left"
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
