
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
      await vfSendLaunch({ pageSlug: 'faq-page', productName: 'faq' }, handleStreamChunk);
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
      await vfSendMessage(userMessage, handleStreamChunk);
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
      await vfSendAction(button.request, handleStreamChunk);
    } catch (error) {
      console.error('Error processing button action:', error);
      addAgentMessage('Sorry, I encountered an error processing your selection. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleStreamChunk = (chunk: string) => {
    // Parse SSE message format
    const eventMatch = chunk.match(/^event: ([^\n]*)/m);
    const dataMatch = chunk.match(/^data: (.*)$/m);
    
    if (dataMatch && dataMatch[1]) {
      try {
        const data = JSON.parse(dataMatch[1].trim());
        console.log('Received trace:', data);
        
        if (data.type === 'completion') {
          handleCompletionEvent(data);
        }
        else if (data.type === 'text') {
          console.log('Text message received:', data.payload.message);
          // For non-streaming messages, create a complete message
          addAgentMessage(data.payload.message);
        }
        else if (data.type === 'choice') {
          console.log('Choices received:', data.payload.buttons);
          setButtons(data.payload.buttons);
          setIsButtonsLoading(false);
        }
        else if (data.type === 'end') {
          console.log('Session ended');
          setIsTyping(false);
          setIsButtonsLoading(false);
        }
      } catch (err) {
        console.warn('Error parsing SSE line:', err, dataMatch[1]);
      }
    }
  };

  const handleCompletionEvent = (data: any) => {
    const { state, content } = data.payload;
    
    if (state === 'start') {
      console.log('Completion started');
      // Generate a stable ID for this completion message
      const msgId = `completion-${Date.now().toString()}`;
      partialMessageIdRef.current = msgId;
      addAgentMessage('', true, msgId);
    } 
    else if (state === 'content' && partialMessageIdRef.current) {
      console.log('Completion content received:', content);
      setMessages(prev => {
        const currentMsg = prev.find(m => m.id === partialMessageIdRef.current);
        if (currentMsg) {
          return prev.map(msg => 
            msg.id === partialMessageIdRef.current 
              ? { ...msg, content: msg.content + content, isPartial: true } 
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
          return prev.map(msg => 
            msg.id === partialMessageIdRef.current 
              ? { ...msg, isPartial: false } 
              : msg
          );
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

// Helper function to stream messages with animation
// This is imported from the voiceflow library but used here
import { parseMarkdown, fakeStreamMessage } from '@/lib/voiceflow';
