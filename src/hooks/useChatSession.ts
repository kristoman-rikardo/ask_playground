
import { useState, useEffect, useCallback } from 'react';
import { vfSendLaunch } from '@/lib/voiceflow';
import { Message, Button } from '@/types/chat';
import { useMessageStreaming } from './useMessageStreaming';
import { useTraceEventHandler } from './useTraceEventHandler';
import { useMessageInteraction } from './useMessageInteraction';

export type { Message, Button };

export function useChatSession() {
  const [isTyping, setIsTyping] = useState(false);
  const [buttons, setButtons] = useState<Button[]>([]);
  const [isButtonsLoading, setIsButtonsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  // Initialize message streaming
  const [messages, setMessages] = useState<Message[]>([]);
  const streaming = useMessageStreaming(setMessages);
  
  // Reset message source tracker function
  const resetMessageSourceTracker = useCallback(() => {
    streaming.messageSourceTracker.current = {};
  }, [streaming]);
  
  // Initialize trace event handler
  const { handleTraceEvent, receivedFirstTraceRef, currentStep, totalSteps } = useTraceEventHandler(
    streaming,
    setIsTyping,
    setButtons,
    setIsButtonsLoading
  );
  
  // Initialize message interaction
  const messageInteraction = useMessageInteraction(
    handleTraceEvent,
    setIsTyping,
    setButtons, 
    setIsButtonsLoading,
    resetMessageSourceTracker,
    setMessages // Pass setMessages to useMessageInteraction
  );

  useEffect(() => {
    // Only start the chat session once when the component mounts
    if (!sessionStarted) {
      startChatSession();
      setSessionStarted(true);
    }
  }, [sessionStarted]);

  const startChatSession = async () => {
    console.log('Starting chat session...');
    setIsTyping(true);
    setIsButtonsLoading(true);
    receivedFirstTraceRef.current = false;
    try {
      await vfSendLaunch({ pageSlug: 'faq-page', productName: 'faq' }, handleTraceEvent);
    } catch (error) {
      console.error('Error starting chat session:', error);
      streaming.addAgentMessage('Sorry, I encountered an error starting our conversation. Please try refreshing the page.');
    } finally {
      if (!receivedFirstTraceRef.current) {
        setIsTyping(false);
      }
    }
  };

  return {
    messages,
    isTyping,
    buttons,
    isButtonsLoading,
    sendUserMessage: messageInteraction.sendUserMessage,
    handleButtonClick: messageInteraction.handleButtonClick,
    currentStep,
    totalSteps
  };
}
