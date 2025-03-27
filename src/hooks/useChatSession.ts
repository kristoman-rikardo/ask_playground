import { useState, useEffect, useRef } from 'react';
import { vfSendLaunch, vfSendMessage, vfSendAction } from '@/lib/voiceflow';

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
  const lastUpdateTimeRef = useRef<number>(0);
  const streamThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const receivedFirstTraceRef = useRef<boolean>(false);

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
      addAgentMessage('Sorry, I encountered an error starting our conversation. Please try refreshing the page.');
    } finally {
      if (!receivedFirstTraceRef.current) {
        setIsTyping(false);
      }
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

  // Throttled update for smoother streaming experience - reduced to 5ms for even faster streaming
  const updatePartialMessage = (messageId: string, text: string, isPartial = true) => {
    const now = Date.now();
    
    // Throttle updates to ensure smooth rendering (5ms = 200fps for extremely fast streaming)
    if (now - lastUpdateTimeRef.current < 5) {
      if (streamThrottleRef.current) {
        clearTimeout(streamThrottleRef.current);
      }
      
      streamThrottleRef.current = setTimeout(() => {
        updatePartialMessage(messageId, text, isPartial);
      }, 5);
      
      return;
    }
    
    lastUpdateTimeRef.current = now;
    
    setMessages(prev => {
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
  };

  const addAgentMessage = (text: string, isPartial = false, existingId?: string) => {
    const messageId = existingId || Date.now().toString();
    
    console.log(`${isPartial ? 'Partial' : 'Final'} agent message:`, { 
      messageId, 
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''), 
      isPartial 
    });
    
    updatePartialMessage(messageId, text, isPartial);

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
    receivedFirstTraceRef.current = false;

    try {
      await vfSendMessage(userMessage, handleTraceEvent);
    } catch (error) {
      console.error('Error sending message:', error);
      addAgentMessage('Sorry, I encountered an error processing your message. Please try again.');
    } finally {
      if (!receivedFirstTraceRef.current) {
        setIsTyping(false);
      }
    }
  };

  const handleButtonClick = async (button: Button) => {
    console.log('Button clicked:', button.name);
    addUserMessage(button.name);
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(true);
    receivedFirstTraceRef.current = false;

    try {
      await vfSendAction(button.request, handleTraceEvent);
    } catch (error) {
      console.error('Error processing button action:', error);
      addAgentMessage('Sorry, I encountered an error processing your selection. Please try again.');
    } finally {
      if (!receivedFirstTraceRef.current) {
        setIsTyping(false);
      }
    }
  };

  const handleTraceEvent = (trace: any) => {
    console.log('Trace event received:', trace.type, trace);
    
    // Set the receivedFirstTraceRef to true for any trace received
    // This helps us keep the typing indicator until we receive traces
    receivedFirstTraceRef.current = true;
    
    switch (trace.type) {
      case 'speak':
      case 'text': {
        if (trace.payload && trace.payload.message) {
          console.log('Text/Speak message received:', trace.payload.message);
          
          // Create a new message ID for this text/speak event
          const msgId = `text-${Date.now()}`;
          
          // Start with empty message and stream it character by character
          let currentText = '';
          const fullText = trace.payload.message;
          
          // Start streaming immediately for the first several characters - increased chunk size
          const initialChunk = fullText.substring(0, 15);
          currentText = initialChunk;
          
          partialMessageIdRef.current = msgId;
          addAgentMessage(currentText, true, msgId);
          
          // Then, stream the rest character by character with faster delays
          let index = initialChunk.length;
          
          function streamNextChar() {
            if (index < fullText.length) {
              // Stream even more characters at once for faster display (5-8 chars)
              const charsToAdd = Math.min(
                Math.floor(Math.random() * 3) + 5, 
                fullText.length - index
              );
              
              currentText += fullText.substring(index, index + charsToAdd);
              addAgentMessage(currentText, true, msgId);
              index += charsToAdd;
              
              // Ultra-fast streaming speed (2-5ms)
              const randomDelay = Math.floor(Math.random() * 3) + 2;
              setTimeout(streamNextChar, randomDelay);
            } else {
              // Finalize message when done
              addAgentMessage(fullText, false, msgId);
            }
          }
          
          // Start streaming immediately
          setTimeout(streamNextChar, 2);
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
    console.log('Completion event:', state, content ? content.substring(0, 50) : '');
    
    if (state === 'start') {
      console.log('Completion started');
      // Generate a unique ID for this streaming session
      const msgId = `completion-${Date.now()}`;
      partialMessageIdRef.current = msgId;
      currentCompletionContentRef.current = '';
      
      // Initialize message immediately
      addAgentMessage('', true, msgId);
      setIsTyping(true);
    } 
    else if (state === 'content') {
      if (!content) return;
      
      // Immediately add the content to the current streaming message
      currentCompletionContentRef.current += content;
      
      if (partialMessageIdRef.current) {
        // Update message with current content immediately
        updatePartialMessage(
          partialMessageIdRef.current, 
          currentCompletionContentRef.current, 
          true
        );
      }
    }
    else if (state === 'end') {
      console.log('Completion ended');
      
      // Finalize the message
      if (partialMessageIdRef.current) {
        addAgentMessage(currentCompletionContentRef.current, false, partialMessageIdRef.current);
        partialMessageIdRef.current = null;
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
