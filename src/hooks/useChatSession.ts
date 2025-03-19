
import { useState, useEffect } from 'react';
import { vfSendLaunch, vfSendMessage, vfSendAction, parseMarkdown } from '@/lib/voiceflow';

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
    if (isPartial && messages.length > 0 && messages[messages.length - 1]?.isPartial) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: text
        };
        return newMessages;
      });
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'agent',
        content: text,
        isPartial
      }]);
    }
  };

  const sendUserMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    addUserMessage(userMessage);
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(false); // Don't show buttons loading while typing
    setMessageInProgress(true);

    try {
      await vfSendMessage(userMessage, handleStreamChunk);
    } catch (error) {
      console.error('Error sending message:', error);
      addAgentMessage('Beklager, jeg møtte en feil. Vennligst prøv igjen.');
    } finally {
      setIsTyping(false);
      setMessageInProgress(false);
      
      // Only show button loading after message is complete
      if (buttons.length === 0) {
        setIsButtonsLoading(true);
      }
    }
  };

  const handleButtonClick = async (button: Button) => {
    addUserMessage(button.name);
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(false); // Don't show buttons loading while typing
    setMessageInProgress(true);

    try {
      await vfSendAction(button.request, handleStreamChunk);
    } catch (error) {
      console.error('Error processing button action:', error);
      addAgentMessage('Beklager, jeg møtte en feil. Vennligst prøv igjen.');
    } finally {
      setIsTyping(false);
      setMessageInProgress(false);
      
      // Only show button loading after message is complete
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

          if (trace.type === 'completion') {
            if (trace.payload.state === 'start') {
              console.log('Completion start');
              setIsTyping(true);
              addAgentMessage('', true);
            } 
            else if (trace.payload.state === 'content') {
              console.log('Completion content');
              // Find the last message if it's partial
              const lastMessage = messages[messages.length - 1];
              const content = lastMessage?.isPartial ? lastMessage.content + trace.payload.content : trace.payload.content;
              addAgentMessage(content, true);
            }
            else if (trace.payload.state === 'end') {
              console.log('Completion end');
              setMessages(prev => {
                if (prev.length > 0 && prev[prev.length - 1].isPartial) {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    isPartial: false
                  };
                  return newMessages;
                }
                return prev;
              });
              
              setIsTyping(false);
              setMessageInProgress(false);
            }
          }

          else if (trace.type === 'text') {
            console.log('Text message received');
            const messageId = Date.now().toString();
            addAgentMessage(trace.payload.message, false);
            
            setIsTyping(false);
            setMessageInProgress(false);
          }

          else if (trace.type === 'choice') {
            console.log('Choice received', trace.payload.buttons);
            setButtons(trace.payload.buttons);
            setIsButtonsLoading(false);
            
            // If message is complete, don't show typing indicator
            if (!messageInProgress) {
              setIsTyping(false);
            }
          }

          else if (trace.type === 'end') {
            console.log('End of interaction');
            setIsTyping(false);
            setIsButtonsLoading(false);
            setMessageInProgress(false);
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
