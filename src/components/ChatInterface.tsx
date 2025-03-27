
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

  const [showInput, setShowInput] = useState(false);

  // Show input field once first message arrives or user clicks a button
  useEffect(() => {
    if (messages.length > 0) {
      setShowInput(true);
    }
  }, [messages.length]);

  return (
    <div 
      className="w-full mx-auto bg-transparent shadow-none rounded-2xl overflow-hidden transition-all font-sans"
      style={{ height: '100%' }}
    >
      <div className="flex flex-col h-full">
        <div className={`flex-1 flex flex-col overflow-hidden min-h-[200px] transition-all duration-300 ${
          messages.length === 0 ? 'justify-end' : ''
        }`}>
          <ChatMessages 
            messages={messages} 
            isTyping={isTyping} 
          />
        </div>
        
        <ButtonPanel 
          buttons={buttons} 
          isLoading={isButtonsLoading} 
          onButtonClick={(button) => {
            handleButtonClick(button);
            setShowInput(true);
          }} 
        />
        
        <ChatInputArea 
          onSendMessage={sendUserMessage} 
          isCollapsed={!showInput && messages.length === 0}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
