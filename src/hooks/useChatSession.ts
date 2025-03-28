
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

// Flag to ensure we schedule only one update per animation frame
let updateScheduled = false;

export function useChatSession() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [buttons, setButtons] = useState<Button[]>([]);
  const [isButtonsLoading, setIsButtonsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const partialMessageIdRef = useRef<string | null>(null);
  const currentCompletionContentRef = useRef<string>('');
  const receivedFirstTraceRef = useRef<boolean>(false);
  const messageSourceTracker = useRef<Record<string, string>>({});

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

  // Throttles updates using requestAnimationFrame for smooth UI rendering
  const scheduleUpdate = (msgId: string) => {
    if (!updateScheduled) {
      updateScheduled = true;
      requestAnimationFrame(() => {
        // Update the partial message with the accumulated content buffer
        updatePartialMessage(msgId, currentCompletionContentRef.current, true);
        updateScheduled = false;
      });
    }
  };

  // Character-by-character streaming update with improved randomness
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
    messageSourceTracker.current = {}; // Reset the source tracker for new messages

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
    messageSourceTracker.current = {}; // Reset the source tracker for new messages

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
          const messageContent = trace.payload.message;
          const msgId = `text-${Date.now()}`;
          
          // Track that this message came from text/speak
          messageSourceTracker.current[msgId] = 'text';
          
          console.log('Text/Speak message received:', messageContent);
          
          // Initialize the message immediately
          partialMessageIdRef.current = msgId;
          addAgentMessage('', true, msgId);
          
          // Stream the message with more natural, random timing
          let currentText = '';
          let index = 0;
          
          const streamNextCharacter = () => {
            if (index < messageContent.length) {
              currentText += messageContent[index];
              
              // Use requestAnimationFrame to throttle updates
              requestAnimationFrame(() => {
                updatePartialMessage(msgId, currentText, true);
              });
              
              index++;
              
              // More random delays between characters (between 5-30ms)
              setTimeout(streamNextCharacter, 5 + Math.random() * 25);
            } else {
              // Mark as complete only when fully streamed
              updatePartialMessage(msgId, messageContent, false);
            }
          };
          
          // Start streaming immediately
          streamNextCharacter();
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
      // Create a unique ID for this completion
      const msgId = `completion-${Date.now()}`;
      
      // Check if we already have a text/speak message
      const hasTextMessage = Object.values(messageSourceTracker.current).includes('text');
      
      // Only create a new message if we don't already have a text/speak message
      if (!hasTextMessage) {
        partialMessageIdRef.current = msgId;
        currentCompletionContentRef.current = '';
        messageSourceTracker.current[msgId] = 'completion';
        
        // Initialize with empty content
        addAgentMessage('', true, msgId);
      } else {
        console.log('Skipping completion message as we already have a text message');
      }
      receivedFirstTraceRef.current = true;
    } 
    else if (state === 'content') {
      if (!content || !partialMessageIdRef.current) return;
      
      // Only update completion content if the current message is a completion message
      const currentMsgId = partialMessageIdRef.current;
      if (messageSourceTracker.current[currentMsgId] === 'completion') {
        // Append new content
        currentCompletionContentRef.current += content;
        
        // Schedule an update on the next animation frame
        scheduleUpdate(currentMsgId);
      }
    }
    else if (state === 'end') {
      console.log('Completion ended');
      
      // Only finalize if this is a completion message
      const currentMsgId = partialMessageIdRef.current;
      if (currentMsgId && messageSourceTracker.current[currentMsgId] === 'completion') {
        // Ensure the full content is displayed
        updatePartialMessage(currentMsgId, currentCompletionContentRef.current, false);
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
