
import { useState } from 'react';
import { vfSendMessage, vfSendAction } from '@/lib/voiceflow';
import { Button, Message } from '@/types/chat';

export function useMessageInteraction(
  handleTraceEvent: (trace: any) => void,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  setButtons: React.Dispatch<React.SetStateAction<Button[]>>,
  setIsButtonsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  resetMessageSourceTracker: () => void
) {
  const [messages, setMessages] = useState<Message[]>([]);

  const addUserMessage = (text: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text
    };
    console.log('Adding user message:', message);
    setMessages(prev => [...prev, message]);
  };

  const sendUserMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    console.log('Sending user message:', userMessage);
    addUserMessage(userMessage);
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(true);
    resetMessageSourceTracker();

    try {
      await vfSendMessage(userMessage, handleTraceEvent);
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error case
    }
  };

  const handleButtonClick = async (button: Button) => {
    console.log('Button clicked:', button.name);
    // Make sure to display the button's name as the user message
    addUserMessage(button.name);
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(true);
    resetMessageSourceTracker();

    try {
      await vfSendAction(button.request, handleTraceEvent);
    } catch (error) {
      console.error('Error processing button action:', error);
      // Handle error case
    }
  };

  return {
    messages,
    setMessages,
    sendUserMessage,
    handleButtonClick
  };
}
