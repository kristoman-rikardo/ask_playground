
import React from 'react';
import { Message, Button } from '@/types/chat';
import ChatMessagesContainer from './ChatMessagesContainer';

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  stepsTotal?: number;
  currentStepIndex?: number;
  textStreamingStarted?: boolean;
  carouselData?: any | null;
  onButtonClick?: (button: Button) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping,
  textStreamingStarted = false,
  carouselData = null,
  onButtonClick
}) => {
  return (
    <ChatMessagesContainer
      messages={messages}
      isTyping={isTyping}
      textStreamingStarted={textStreamingStarted}
      carouselData={carouselData}
      onButtonClick={onButtonClick}
    />
  );
};

export default ChatMessages;
