
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

  // Character-by-character streaming update
  const updatePartialMessage = (messageId: string, text: string, isPartial = true) => {
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
    
    // Set the receivedFirstTraceRef to true for any content trace received
    if (trace.type === 'speak' || trace.type === 'text' || (trace.type === 'completion' && trace.payload?.state === 'content')) {
      receivedFirstTraceRef.current = true;
    }
    
    switch (trace.type) {
      case 'speak':
      case 'text': {
        if (trace.payload && trace.payload.message) {
          console.log('Text/Speak message received:', trace.payload.message);
          
          // Create a new message ID for this text/speak event
          const msgId = `text-${Date.now()}`;
          
          // Initialize the message with an empty string
          partialMessageIdRef.current = msgId;
          addAgentMessage('', true, msgId);
          
          // Stream the full text letter by letter
          let currentText = '';
          const fullText = trace.payload.message;
          
          // Character-by-character streaming - better performance
          const streamText = (index = 0) => {
            if (index < fullText.length) {
              currentText += fullText[index];
              updatePartialMessage(msgId, currentText, true);
              
              // Stream next character with a small random delay (5-10ms)
              setTimeout(() => streamText(index + 1), 5 + Math.random() * 5);
            } else {
              // Only finalize when entire message is displayed
              updatePartialMessage(msgId, fullText, false);
            }
          };
          
          // Start streaming immediately
          streamText();
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
        // Ensure any partial messages are complete before ending
        if (partialMessageIdRef.current && currentCompletionContentRef.current) {
          // Finalize any partial messages with their complete content
          updatePartialMessage(partialMessageIdRef.current, currentCompletionContentRef.current, false);
          partialMessageIdRef.current = null;
          currentCompletionContentRef.current = '';
        }
        
        // Only set typing to false after all messages are complete
        setTimeout(() => {
          setIsTyping(false);
          setIsButtonsLoading(false);
        }, 50);
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
      
      // Initialize message with empty content
      addAgentMessage('', true, msgId);
      receivedFirstTraceRef.current = true;
    } 
    else if (state === 'content') {
      if (!content) return;
      
      // Append new content to the current message
      currentCompletionContentRef.current += content;
      
      if (partialMessageIdRef.current) {
        // Stream text character by character
        const existingContent = currentCompletionContentRef.current;
        let currentDisplayedText = '';
        let charIndex = 0;
        
        // Immediately stream the first character, then continue character by character
        const streamChar = () => {
          if (charIndex < existingContent.length) {
            currentDisplayedText += existingContent[charIndex];
            updatePartialMessage(partialMessageIdRef.current!, currentDisplayedText, true);
            charIndex++;
            
            // Fast but natural pacing (5-10ms per character)
            setTimeout(streamChar, 5 + Math.random() * 5);
          }
        };
        
        // Start streaming
        streamChar();
      }
    }
    else if (state === 'end') {
      console.log('Completion ended');
      
      // Ensure the full content is displayed
      if (partialMessageIdRef.current) {
        updatePartialMessage(partialMessageIdRef.current, currentCompletionContentRef.current, false);
        partialMessageIdRef.current = null;
      }
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
