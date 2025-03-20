
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
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: text
    }]);
  };

  const addAgentMessage = (text: string, isPartial = false, existingId?: string) => {
    const messageId = existingId || Date.now().toString();
    
    if (isPartial && partialMessageIdRef.current === messageId) {
      // Update existing partial message
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, content: text, isPartial: true } : msg
      ));
    } 
    else if (isPartial) {
      // Create new partial message
      partialMessageIdRef.current = messageId;
      setMessages(prev => [...prev, {
        id: messageId,
        type: 'agent',
        content: text,
        isPartial: true
      }]);
    } 
    else {
      // Create or finalize a complete message
      if (partialMessageIdRef.current === messageId) {
        // Finalize existing partial message
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, content: text, isPartial: false } : msg
        ));
        partialMessageIdRef.current = null;
      } else {
        // Create new complete message
        setMessages(prev => [...prev, {
          id: messageId,
          type: 'agent',
          content: text,
          isPartial: false
        }]);
      }
    }
  };

  const sendUserMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

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
    console.log('Received trace event:', trace);
    
    switch (trace.type) {
      case 'speak':
      case 'text':
        console.log('Text/Speak message received:', trace.payload.message);
        addAgentMessage(trace.payload.message || '');
        break;
      
      case 'completion':
        handleCompletionEvent(trace.payload);
        break;
      
      case 'choice':
        console.log('Choices received:', trace.payload.buttons);
        setButtons(trace.payload.buttons || []);
        setIsButtonsLoading(false);
        break;
      
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
    const { state, content } = payload;
    
    if (state === 'start') {
      console.log('Completion started');
      // Generate a stable ID for this completion message
      const msgId = `completion-${Date.now().toString()}`;
      partialMessageIdRef.current = msgId;
      addAgentMessage('', true, msgId);
    } 
    else if (state === 'content' && partialMessageIdRef.current) {
      console.log('Completion content received:', content);
      // Find the current message and append the new content to it
      setMessages(prev => {
        const currentMsg = prev.find(m => m.id === partialMessageIdRef.current);
        if (currentMsg) {
          const updatedContent = (currentMsg.content || '') + (content || '');
          return prev.map(msg => 
            msg.id === partialMessageIdRef.current 
              ? { ...msg, content: updatedContent, isPartial: true } 
              : msg
          );
        }
        return prev;
      });
    }
    else if (state === 'end') {
      console.log('Completion ended');
      // Finalize the message if we have one in progress
      if (partialMessageIdRef.current) {
        setMessages(prev => {
          const currentMsg = prev.find(m => m.id === partialMessageIdRef.current);
          if (currentMsg) {
            return prev.map(msg => 
              msg.id === partialMessageIdRef.current 
                ? { ...msg, isPartial: false } 
                : msg
            );
          }
          return prev;
        });
        partialMessageIdRef.current = null;
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
