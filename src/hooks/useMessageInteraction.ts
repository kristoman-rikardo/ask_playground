import { useState } from 'react';
import { vfSendMessage, vfSendAction } from '@/lib/voiceflow';
import { Button, Message } from '@/types/chat';

export function useMessageInteraction(
  handleTraceEvent: (trace: any) => void,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  setButtons: React.Dispatch<React.SetStateAction<Button[]>>,
  setIsButtonsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  resetMessageSourceTracker: () => void,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) {
  const addUserMessage = (text: string) => {
    // Create a unique ID for the message
    const message: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: text
    };
    
    console.log('Adding user message:', message);
    
    // Add the message to the chat
    setMessages(prev => [...prev, message]);
  };

  const sendUserMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    console.log('Sending user message:', userMessage);
    
    // Add the user's message to the chat before sending
    addUserMessage(userMessage);
    
    // Clear buttons and show typing indicator
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(true);
    
    // Don't reset message tracking here - that would cause carousels to be lost
    // Instead, only reset the message source tracking to preserve carousel data in the messages
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
    
    // Display the button's name as the user message
    addUserMessage(button.name);
    
    // Clear buttons and show typing indicator
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(true);
    
    // Don't reset message tracking here - that would cause carousels to be lost
    // Instead, only reset the message source tracking to preserve carousel data in the messages
    resetMessageSourceTracker();

    try {
      await vfSendAction(button.request, handleTraceEvent);
    } catch (error) {
      console.error('Error processing button action:', error);
      // Handle error case
    }
  };

  return {
    sendUserMessage,
    handleButtonClick
  };
}
