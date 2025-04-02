
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
  const [externalContent, setExternalContent] = useState<string | null>(null);
  
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

  // Listen for postMessage events from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check origin for security
      if (event.data && typeof event.data === 'object' && event.data.type === 'PAGE_CONTENT') {
        console.log('Received page content via postMessage:', event.data.content.substring(0, 100) + '...');
        setExternalContent(event.data.content);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    // Only start the chat session once when the component mounts or when external content is received
    if (!sessionStarted && (externalContent !== null || !window.parent || window.parent === window)) {
      startChatSession();
      setSessionStarted(true);
    }
  }, [sessionStarted, externalContent]);

  const startChatSession = async () => {
    console.log('Starting chat session...');
    setIsTyping(true);
    setIsButtonsLoading(true);
    receivedFirstTraceRef.current = false;
    
    const variables = {
      pageSlug: 'faq-page',
      productName: 'faq'
    };
    
    // If we have external content, add it to the variables
    if (externalContent) {
      variables['pageContent'] = externalContent;
      console.log('Starting chat with page content:', externalContent.substring(0, 100) + '...');
    }
    
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
    carouselData
  };
}
