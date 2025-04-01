
import React from 'react';
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

  return (
    <div 
      className="w-full mx-auto bg-white shadow-sm rounded-2xl overflow-hidden transition-all font-sans border border-gray-200"
      style={{ height: '100%' }}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col overflow-hidden min-h-[200px]">
          <ChatMessages 
            messages={messages} 
            isTyping={isTyping} 
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
  );
};

export default ChatInterface;
