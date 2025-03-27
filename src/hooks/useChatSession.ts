import { useState, useEffect, useRef } from 'react';
import { vfSendLaunch, vfSendMessage, vfSendAction, TraceHandler } from '@/lib/voiceflow';

export interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  isPartial?: boolean;
}

export interface Button {
  name: string;
  request: any;
}

export function useChatSession() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [buttons, setButtons] = useState<Button[]>([]);
  const [isButtonsLoading, setIsButtonsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const partialMessageIdRef = useRef<string | null>(null);
  const currentCompletionContentRef = useRef<string>('');
  const streamingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only start the chat session once when the component mounts
    if (!sessionStarted) {
      startChatSession();
      setSessionStarted(true);
    }

    // Clear any streaming timers on unmount
    return () => {
      if (streamingTimerRef.current) {
        clearTimeout(streamingTimerRef.current);
      }
    };
  }, [sessionStarted]);

  const startChatSession = async () => {
    console.log('Starting chat session...');
    setIsButtonsLoading(true);
    try {
      await vfSendLaunch({ pageSlug: 'faq-page', productName: 'faq' }, handleTraceEvent);
    } catch (error) {
      console.error('Error starting chat session:', error);
      addAgentMessage('Sorry, I encountered an error starting our conversation. Please try refreshing the page.');
    }
  };

  const addUserMessage = (text: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text
    };
    console.log('Adding user message:', message);
    setMessages(prev => [...prev, message]);
  };

  // Function to simulate natural typing for streaming effect - with increased speed
  const simulateTyping = (
    fullText: string, 
    existingId: string | null, 
    isPartial: boolean = true,
    currentIndex: number = 0
  ) => {
    if (streamingTimerRef.current) {
      clearTimeout(streamingTimerRef.current);
    }

    // If we've reached the end of the text and it's not marked as partial
    if (currentIndex >= fullText.length && !isPartial) {
      addAgentMessage(fullText, false, existingId);
      return;
    }
    
    // Calculate how many characters to reveal - faster streaming
    const charsToReveal = Math.min(
      currentIndex + Math.floor(Math.random() * 4) + 3, 
      fullText.length
    );
    
    // Get the partial text
    const partialText = fullText.substring(0, charsToReveal);
    
    // Update the message with the partial text
    addAgentMessage(partialText, true, existingId);
    
    // If we haven't reached the end, continue typing
    if (charsToReveal < fullText.length || isPartial) {
      // Faster delay between 5-20ms for smoother streaming
      const delay = Math.floor(Math.random() * 15) + 5;
      streamingTimerRef.current = setTimeout(() => {
        simulateTyping(fullText, existingId, isPartial, charsToReveal);
      }, delay);
    } else {
      // Final update to mark the message as complete
      addAgentMessage(fullText, false, existingId);
    }
  };

  const addAgentMessage = (text: string, isPartial = false, existingId?: string) => {
    const messageId = existingId || Date.now().toString();
    
    setMessages(prev => {
      // If updating an existing partial message
      const existingMessageIndex = prev.findIndex(msg => msg.id === messageId);
      
      if (existingMessageIndex !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[existingMessageIndex] = {
          ...updatedMessages[existingMessageIndex],
          content: text,
          isPartial
        };
        return updatedMessages;
      }
      
      // If creating a new message
      const newMessage: Message = {
        id: messageId,
        type: 'agent',
        content: text,
        isPartial
      };
      return [...prev, newMessage];
    });

    if (!isPartial) {
      partialMessageIdRef.current = null;
    } else {
      partialMessageIdRef.current = messageId;
    }
  };

  const sendUserMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    console.log('Sending user message:', userMessage);
    addUserMessage(userMessage);
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(true);

    try {
      await vfSendMessage(userMessage, handleTraceEvent);
    } catch (error) {
      console.error('Error sending message:', error);
      addAgentMessage('Sorry, I encountered an error processing your message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleButtonClick = async (button: Button) => {
    console.log('Button clicked:', button.name);
    addUserMessage(button.name);
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(true);

    try {
      await vfSendAction(button.request, handleTraceEvent);
    } catch (error) {
      console.error('Error processing button action:', error);
      addAgentMessage('Sorry, I encountered an error processing your selection. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleTraceEvent: TraceHandler = (trace) => {
    console.log('Trace event received:', trace.type, trace);
    
    switch (trace.type) {
      case 'speak':
      case 'text': {
        if (trace.payload && trace.payload.message) {
          console.log('Text/Speak message received:', trace.payload.message);
          // Use the streaming effect for regular messages
          const msgId = `message-${Date.now()}`;
          partialMessageIdRef.current = msgId;
          simulateTyping(trace.payload.message, msgId, false);
          setIsTyping(false);
        }
        break;
      }
      
      case 'completion':
        handleCompletionEvent(trace.payload);
        break;
      
      case 'choice': {
        if (trace.payload && trace.payload.buttons) {
          console.log('Choices received:', trace.payload.buttons);
          setButtons(trace.payload.buttons || []);
          setIsButtonsLoading(false);
        }
        break;
      }
      
      case 'end':
        console.log('Session ended');
        setIsTyping(false);
        setIsButtonsLoading(false);
        
        // Ensure any partial message is finalized
        if (partialMessageIdRef.current && currentCompletionContentRef.current) {
          addAgentMessage(currentCompletionContentRef.current, false, partialMessageIdRef.current);
          partialMessageIdRef.current = null;
          currentCompletionContentRef.current = '';
        }
        break;
      
      default:
        console.log('Unhandled trace type:', trace.type);
    }
  };

  const handleCompletionEvent = (payload: any) => {
    if (!payload) {
      console.warn('Empty completion payload received');
      return;
    }
    
    const { state, content } = payload;
    
    if (state === 'start') {
      console.log('Completion started');
      // Generate a unique ID for this streaming session
      const msgId = `completion-${Date.now()}`;
      partialMessageIdRef.current = msgId;
      currentCompletionContentRef.current = '';
      setIsTyping(true);
    } 
    else if (state === 'content') {
      if (!content) return;
      
      // Accumulate content in the ref
      currentCompletionContentRef.current += content;
      
      // Stream the accumulated content character by character
      if (partialMessageIdRef.current) {
        simulateTyping(
          currentCompletionContentRef.current, 
          partialMessageIdRef.current, 
          true
        );
      }
    }
    else if (state === 'end') {
      console.log('Completion ended');
      
      // Finalize the message with one last smooth streaming update
      if (partialMessageIdRef.current) {
        simulateTyping(
          currentCompletionContentRef.current, 
          partialMessageIdRef.current, 
          false
        );
        currentCompletionContentRef.current = '';
      }
      
      setIsTyping(false);
    }
  };

  return {
    messages,
    isTyping,
    buttons,
    isButtonsLoading,
    sendUserMessage,
    handleButtonClick
  };
}
