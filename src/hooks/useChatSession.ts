
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
  const partialMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    startChatSession();
  }, []);

  const startChatSession = async () => {
    console.log('Starting chat session...');
    setIsTyping(true);
    setIsButtonsLoading(true);
    try {
      await vfSendLaunch({ pageSlug: 'faq-page', productName: 'faq' }, handleTraceEvent);
    } catch (error) {
      console.error('Error starting chat session:', error);
      addAgentMessage('Sorry, I encountered an error starting our conversation. Please try refreshing the page.');
    } finally {
      setIsTyping(false);
      setIsButtonsLoading(false);
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

  const handleTraceEvent = (trace: any) => {
    console.log('Trace event received:', trace.type, trace);
    
    switch (trace.type) {
      case 'speak':
      case 'text': {
        if (trace.payload && trace.payload.message) {
          console.log('Text/Speak message received:', trace.payload.message);
          addAgentMessage(trace.payload.message);
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
    console.log('Completion event:', state, content);
    
    if (state === 'start') {
      console.log('Completion started');
      const msgId = `completion-${Date.now()}`;
      addAgentMessage('', true, msgId);
      setIsTyping(true);
    } 
    else if (state === 'content') {
      console.log('Completion content:', content);
      addAgentMessage(content || '', true, partialMessageIdRef.current || undefined);
    }
    else if (state === 'end') {
      console.log('Completion ended');
      const currentPartialId = partialMessageIdRef.current;
      if (currentPartialId) {
        addAgentMessage(content || '', false, currentPartialId);
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

