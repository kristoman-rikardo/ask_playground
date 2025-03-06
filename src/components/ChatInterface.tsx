
import React, { useState, useRef, useEffect } from 'react';
import { 
  vfSendLaunch, 
  vfSendMessage, 
  vfSendAction, 
  parseMarkdown,
  fakeStreamMessage
} from '@/lib/voiceflow';
import TypingIndicator from './TypingIndicator';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  isPartial?: boolean;
}

interface Button {
  name: string;
  request: any;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [buttons, setButtons] = useState<Button[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, buttons]);

  // Start chat session on component mount
  useEffect(() => {
    startChatSession();
  }, []);

  const startChatSession = async () => {
    setIsTyping(true);
    try {
      await vfSendLaunch({ pageSlug: 'faq-page', productName: 'faq' }, handleStreamChunk);
    } catch (error) {
      console.error('Error starting chat session:', error);
      addAgentMessage('Sorry, I encountered an error starting our conversation. Please try refreshing the page.');
    } finally {
      setIsTyping(false);
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
    // If we're updating an existing partial message
    if (isPartial && messages.length > 0 && messages[messages.length - 1].isPartial) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: text
        };
        return newMessages;
      });
    } else {
      // Add a new message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'agent',
        content: text,
        isPartial
      }]);
    }
  };

  const handleUserSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addUserMessage(userMessage);
    setButtons([]);
    setIsTyping(true);

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
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const trace = JSON.parse(jsonStr);

          // Handle LLM streaming completion
          if (trace.type === 'completion') {
            if (trace.payload.state === 'start') {
              // Start a new partial message
              addAgentMessage('', true);
            } 
            else if (trace.payload.state === 'content') {
              // Get the last message and append content
              const lastMessage = messages[messages.length - 1];
              if (lastMessage && lastMessage.isPartial) {
                addAgentMessage(lastMessage.content + trace.payload.content, true);
              }
            }
            else if (trace.payload.state === 'end') {
              // Update the last message to not be partial anymore
              if (messages.length > 0) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  if (newMessages[newMessages.length - 1].isPartial) {
                    newMessages[newMessages.length - 1].isPartial = false;
                  }
                  return newMessages;
                });
              }
              setIsTyping(false);
            }
          }

          // Handle static text message with fake streaming
          else if (trace.type === 'text') {
            const messageId = Date.now().toString();
            setMessages(prev => [...prev, {
              id: messageId,
              type: 'agent',
              content: '',
              isPartial: true
            }]);

            // Use timeout to let React render the new empty message first
            setTimeout(() => {
              const messageEl = document.getElementById(`message-${messageId}`);
              if (messageEl) {
                fakeStreamMessage(trace.payload.message, messageEl)
                  .then(() => {
                    setMessages(prev => prev.map(msg => 
                      msg.id === messageId ? {...msg, isPartial: false} : msg
                    ));
                  });
              }
            }, 100);
          }

          // Handle choice buttons
          else if (trace.type === 'choice') {
            setButtons(trace.payload.buttons);
          }

          // Handle end of conversation
          else if (trace.type === 'end') {
            setIsTyping(false);
          }

        } catch (err) {
          console.warn('Error parsing SSE line:', err);
        }
      }
    }
  };

  return (
    <div className="w-full mx-auto bg-white shadow-lg rounded-2xl overflow-hidden transition-all">
      {/* Vertical layout with 16:9 aspect ratio */}
      <div className="flex flex-col" style={{ aspectRatio: '16/9' }}>
        {/* Chat messages container - takes the top area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat messages */}
          <div 
            ref={chatBoxRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((message, index) => (
              <div
                key={message.id}
                id={`message-${message.id}`}
                ref={index === messages.length - 1 ? lastMessageRef : null}
                className={`px-4 py-3 rounded-xl max-w-[85%] ${
                  message.type === 'user' 
                    ? 'chat-message-user ml-auto bg-gray-200' 
                    : 'chat-message-agent mr-auto bg-gray-200'
                }`}
                dangerouslySetInnerHTML={{ 
                  __html: parseMarkdown(message.content || '') 
                }}
              />
            ))}
            
            {isTyping && <TypingIndicator />}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Bottom section for buttons and input */}
        <div className="w-full bg-gray-50 border-t border-gray-200 p-4">
          {/* Buttons section - horizontal row */}
          {buttons.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={() => handleButtonClick(button)}
                  className="choice-button"
                >
                  {button.name}
                </button>
              ))}
            </div>
          )}
          
          {/* Input area at the bottom */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUserSend()}
              placeholder="Type your question..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            />
            <button
              onClick={handleUserSend}
              disabled={!inputValue.trim()}
              className="px-4 py-2 bg-gray-800 text-white rounded-xl transition-colors hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
