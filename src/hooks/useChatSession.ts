import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [stepsTotal, setStepsTotal] = useState(1);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [carouselData, setCarouselData] = useState<any | null>(null);
  
  // Initialize message streaming
  const [messages, setMessages] = useState<Message[]>([]);
  const streaming = useMessageStreaming(setMessages);
  
  // Reset message source tracker function
  const resetMessageSourceTracker = useCallback(() => {
    streaming.messageSourceTracker.current = {};
  }, [streaming]);
  
  // Initialize trace event handler
  const { handleTraceEvent, receivedFirstTraceRef, textStreamingStartedRef } = useTraceEventHandler(
    streaming,
    setIsTyping,
    setButtons,
    setIsButtonsLoading,
    setStepsTotal,
    setCurrentStepIndex,
    setCarouselData
  );
  
  // Initialize message interaction
  const messageInteraction = useMessageInteraction(
    handleTraceEvent,
    setIsTyping,
    setButtons, 
    setIsButtonsLoading,
    resetMessageSourceTracker,
    setMessages
  );

  useEffect(() => {
    // Start the chat session automatically when the component mounts
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
    
    // Basic variables for the conversation
    const variables = {
      pageSlug: 'faq-page',
      productName: 'faq'
    };
    
    try {
      await vfSendLaunch(variables, handleTraceEvent);
    } catch (error) {
      console.error('Error starting chat session:', error);
      streaming.addAgentMessage('Sorry, I encountered an error starting our conversation. Please try refreshing the page.');
    } finally {
      if (!receivedFirstTraceRef.current) {
        setIsTyping(false);
      }
    }
  };

  const resetSession = useCallback(() => {
    // Clear messages
    setMessages([]);
    
    // Reset UI states
    setButtons([]);
    setIsTyping(false);
    setIsButtonsLoading(false);
    setStepsTotal(1);
    setCurrentStepIndex(0);
    setCarouselData(null);
    
    // Reset trackers
    resetMessageSourceTracker();
    receivedFirstTraceRef.current = false;
    textStreamingStartedRef.current = false;
    
    // Clear any pending timeouts or effects
    streaming.clearAllTimeouts();
    
    // Start a new session after a brief delay to ensure cleanup is complete
    setTimeout(() => {
      startChatSession();
    }, 100);
  }, [resetMessageSourceTracker, textStreamingStartedRef, streaming]);

  return {
    messages,
    isTyping,
    buttons,
    isButtonsLoading,
    sendUserMessage: messageInteraction.sendUserMessage,
    handleButtonClick: messageInteraction.handleButtonClick,
    stepsTotal,
    currentStepIndex,
    textStreamingStarted: textStreamingStartedRef?.current,
    carouselData,
    resetSession
  };
}

