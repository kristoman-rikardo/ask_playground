
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
  const [messageInProgress, setMessageInProgress] = useState(false);
  // Use a ref to track the currently streaming message ID
  const streamingMessageIdRef = useRef<string | null>(null);

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
      addAgentMessage('Beklager, jeg møtte en feil ved start av samtalen. Vennligst last siden på nytt.');
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

  const addAgentMessage = (text: string, isPartial = false) => {
    const newMessageId = Date.now().toString();
    
    if (isPartial) {
      streamingMessageIdRef.current = newMessageId;
      console.log('Creating new streaming message with ID:', newMessageId);
    }
    
    setMessages(prev => [...prev, {
      id: newMessageId,
      type: 'agent',
      content: text,
      isPartial
    }]);
    
    return newMessageId;
  };

  const updateAgentMessage = (messageId: string, content: string, isPartial = true) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const msgIndex = newMessages.findIndex(msg => msg.id === messageId);
      
      if (msgIndex !== -1) {
        newMessages[msgIndex] = {
          ...newMessages[msgIndex],
          content,
          isPartial
        };
      }
      return newMessages;
    });
  };

  const sendUserMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    addUserMessage(userMessage);
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(false);
    setMessageInProgress(true);
    streamingMessageIdRef.current = null; // Reset streaming ID for new conversation

    try {
      await vfSendMessage(userMessage, handleStreamChunk);
    } catch (error) {
      console.error('Error sending message:', error);
      addAgentMessage('Beklager, jeg møtte en feil. Vennligst prøv igjen.');
    } finally {
      setIsTyping(false);
      setMessageInProgress(false);
      
      if (buttons.length === 0) {
        setIsButtonsLoading(true);
      }
    }
  };

  const handleButtonClick = async (button: Button) => {
    addUserMessage(button.name);
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(false);
    setMessageInProgress(true);
    streamingMessageIdRef.current = null;

    try {
      await vfSendAction(button.request, handleStreamChunk);
    } catch (error) {
      console.error('Error processing button action:', error);
      addAgentMessage('Beklager, jeg møtte en feil. Vennligst prøv igjen.');
    } finally {
      setIsTyping(false);
      setMessageInProgress(false);
      
      if (buttons.length === 0) {
        setIsButtonsLoading(true);
      }
    }
  };

  const handleStreamChunk = (chunk: string) => {
    console.log('Raw chunk received:', chunk);
    
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const trace = JSON.parse(jsonStr);
          console.log('Received trace:', trace.type, trace);

          // Handle completion events (streaming)
          if (trace.type === 'completion') {
            // Start of a streaming message
            if (trace.payload.state === 'start') {
              console.log('Completion start event received');
              setIsTyping(true);
              setMessageInProgress(true);
              // Create an empty message at the start of streaming
              const newMsgId = addAgentMessage('', true);
              streamingMessageIdRef.current = newMsgId;
              console.log('Created new streaming message with ID:', newMsgId);
            } 
            // Content chunks of a streaming message
            else if (trace.payload.state === 'content') {
              const currentStreamingId = streamingMessageIdRef.current;
              const contentChunk = trace.payload.content || '';
              
              console.log('Content chunk received:', contentChunk);
              
              // Update the existing streaming message with the new content
              if (currentStreamingId) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const msgIndex = newMessages.findIndex(msg => msg.id === currentStreamingId);
                  
                  if (msgIndex !== -1) {
                    // Append new content to existing content
                    const updatedContent = newMessages[msgIndex].content + contentChunk;
                    newMessages[msgIndex] = {
                      ...newMessages[msgIndex],
                      content: updatedContent,
                      isPartial: true
                    };
                  } else {
                    console.warn('Could not find streaming message with ID:', currentStreamingId);
                  }
                  return newMessages;
                });
              } else {
                console.warn('Received content but no streaming message ID is set');
                // If we somehow lost our streaming message ID, create a new one
                const newMsgId = addAgentMessage(contentChunk, true);
                streamingMessageIdRef.current = newMsgId;
              }
            }
            // End of a streaming message
            else if (trace.payload.state === 'end') {
              console.log('Completion end event received');
              const currentStreamingId = streamingMessageIdRef.current;
              
              // Mark streaming message as complete
              if (currentStreamingId) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const msgIndex = newMessages.findIndex(msg => msg.id === currentStreamingId);
                  
                  if (msgIndex !== -1) {
                    newMessages[msgIndex] = {
                      ...newMessages[msgIndex],
                      isPartial: false
                    };
                  }
                  return newMessages;
                });
                
                console.log('Completed streaming message with ID:', currentStreamingId);
              }
              
              setIsTyping(false);
              setMessageInProgress(false);
            }
          }

          // Handle regular text messages (non-streaming)
          else if (trace.type === 'text') {
            console.log('Text message received:', trace.payload.message);
            addAgentMessage(trace.payload.message, false);
            
            setIsTyping(false);
            setMessageInProgress(false);
          }

          // Handle choices (buttons)
          else if (trace.type === 'choice') {
            console.log('Choice buttons received:', trace.payload.buttons);
            setButtons(trace.payload.buttons);
            setIsButtonsLoading(false);
            
            if (!messageInProgress) {
              setIsTyping(false);
            }
          }

          // Handle end of interaction
          else if (trace.type === 'end') {
            console.log('End of interaction event received');
            const currentStreamingId = streamingMessageIdRef.current;
            
            // Make sure to mark any streaming message as complete when the interaction ends
            if (currentStreamingId) {
              setMessages(prev => {
                const newMessages = [...prev];
                const msgIndex = newMessages.findIndex(msg => msg.id === currentStreamingId);
                
                if (msgIndex !== -1) {
                  newMessages[msgIndex] = {
                    ...newMessages[msgIndex],
                    isPartial: false
                  };
                }
                return newMessages;
              });
              
              // Clear the streaming message ID reference
              streamingMessageIdRef.current = null;
            }
            
            setIsTyping(false);
            setIsButtonsLoading(false);
            setMessageInProgress(false);
          }

        } catch (err) {
          console.warn('Error parsing SSE line:', err, jsonStr);
        }
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
