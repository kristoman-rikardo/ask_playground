
import { useState, useEffect } from 'react';
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
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

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
      setStreamingMessageId(newMessageId);
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
    setStreamingMessageId(null); // Reset streaming ID for new conversation

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
    setStreamingMessageId(null);

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
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const trace = JSON.parse(jsonStr);
          console.log('Received trace:', trace.type);

          // Handle completion events (streaming)
          if (trace.type === 'completion') {
            if (trace.payload.state === 'start') {
              console.log('Completion start');
              setIsTyping(true);
              // Create an empty message at the start of streaming
              const newMsgId = addAgentMessage('', true);
              setStreamingMessageId(newMsgId);
            } 
            else if (trace.payload.state === 'content') {
              // Update the existing streaming message with the new content
              if (streamingMessageId) {
                console.log('Streaming content update:', trace.payload.content);
                setMessages(prev => {
                  const newMessages = [...prev];
                  const streamingMsgIndex = newMessages.findIndex(msg => msg.id === streamingMessageId);
                  
                  if (streamingMsgIndex !== -1) {
                    // Append new content to existing content
                    newMessages[streamingMsgIndex] = {
                      ...newMessages[streamingMsgIndex],
                      content: newMessages[streamingMsgIndex].content + trace.payload.content,
                      isPartial: true
                    };
                  }
                  return newMessages;
                });
              } else {
                console.warn('Received content but no streaming message ID is set');
              }
            }
            else if (trace.payload.state === 'end') {
              console.log('Completion end');
              // Mark streaming message as complete
              if (streamingMessageId) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const streamingMsgIndex = newMessages.findIndex(msg => msg.id === streamingMessageId);
                  
                  if (streamingMsgIndex !== -1) {
                    newMessages[streamingMsgIndex] = {
                      ...newMessages[streamingMsgIndex],
                      isPartial: false
                    };
                  }
                  return newMessages;
                });
                
                setStreamingMessageId(null);
              }
              
              setIsTyping(false);
              setMessageInProgress(false);
            }
          }

          // Handle regular text messages (non-streaming)
          else if (trace.type === 'text') {
            console.log('Text message received');
            addAgentMessage(trace.payload.message, false);
            
            setIsTyping(false);
            setMessageInProgress(false);
          }

          // Handle choices (buttons)
          else if (trace.type === 'choice') {
            console.log('Choice received', trace.payload.buttons);
            setButtons(trace.payload.buttons);
            setIsButtonsLoading(false);
            
            if (!messageInProgress) {
              setIsTyping(false);
            }
          }

          // Handle end of interaction
          else if (trace.type === 'end') {
            console.log('End of interaction');
            setIsTyping(false);
            setIsButtonsLoading(false);
            setMessageInProgress(false);
            
            // Make sure to mark any streaming message as complete when the interaction ends
            if (streamingMessageId) {
              setMessages(prev => {
                const newMessages = [...prev];
                const streamingMsgIndex = newMessages.findIndex(msg => msg.id === streamingMessageId);
                
                if (streamingMsgIndex !== -1) {
                  newMessages[streamingMsgIndex] = {
                    ...newMessages[streamingMsgIndex],
                    isPartial: false
                  };
                }
                return newMessages;
              });
              setStreamingMessageId(null);
            }
          }

        } catch (err) {
          console.warn('Error parsing SSE line:', err);
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
