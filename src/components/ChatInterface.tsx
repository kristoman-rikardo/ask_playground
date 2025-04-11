import React, { useState, useEffect, useRef, useContext } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import ChatMessages from './chat/ChatMessages';
import ChatInputArea from './chat/ChatInputArea';
import ButtonPanel from './ButtonPanel';
import ScrollDownIndicator from './chat/ScrollDownIndicator';
import { ChevronDown, Maximize2, X } from 'lucide-react';
import RatingDialog from './RatingDialog';
import { ChatContext } from '@/App';

// Custom styles for scrollbar
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(209, 213, 219, 0.8); /* bg-gray-300 with opacity */
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.9); /* bg-gray-400 with opacity */
  }
`;

const ChatInterface: React.FC = () => {
  const {
    messages,
    isTyping,
    buttons,
    isButtonsLoading,
    sendUserMessage,
    handleButtonClick: originalHandleButtonClick,
    stepsTotal,
    currentStepIndex,
    textStreamingStarted,
    carouselData,
    resetSession
  } = useChatSession();
  
  const { isEmbedded, disableGlobalAutoScroll } = useContext(ChatContext);
  
  // Track if user has started conversation
  const [conversationStarted, setConversationStarted] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullyMinimized, setIsFullyMinimized] = useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  
  useEffect(() => {
    if (messages.length > 0 && !conversationStarted) {
      setConversationStarted(true);
    }
  }, [messages, conversationStarted]);
  
  const handleSendMessage = (message: string) => {
    setConversationStarted(true);
    sendUserMessage(message);
    // Scroll to bottom whenever a user sends a message
    setTimeout(() => scrollToBottom('auto'), 50);
    // Expand the chat if it was minimized
    if (isMinimized) setIsMinimized(false);
    if (isFullyMinimized) setIsFullyMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    // Ensure fully minimized is turned off when maximizing
    if (isFullyMinimized && !isMinimized) {
      setIsFullyMinimized(false);
    }
  };

  const handleInputFocus = () => {
    if (isMinimized || isFullyMinimized) {
      setIsMinimized(false);
      setIsFullyMinimized(false);
    }
  };

  const handleRestart = () => {
    // Reset conversation state
    setConversationStarted(false);
    
    // Reset session in the chat service
    if (resetSession) {
      resetSession();
    }
    
    // Fully minimize the chat after restart (hide buttons too)
    setIsMinimized(true);
    setIsFullyMinimized(true);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const chatBoxElement = document.querySelector('.overflow-y-auto');
    if (chatBoxElement) {
      // First scroll attempt
      chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
      
      // Multiple check attempts with increasing delays to ensure proper scrolling
      // This helps with dynamic content like carousels that may change height
      const scrollAttempts = [50, 200, 500];
      scrollAttempts.forEach(delay => {
        setTimeout(() => {
          if (chatBoxElement) {
            chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
          }
        }, delay);
      });
      
      // Special handling for carousels
      if (carouselData) {
        // Add extra scroll attempt for carousels with longer delays
        // This ensures the carousel is fully rendered and visible
        setTimeout(() => {
          if (chatBoxElement) {
            chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
          }
        }, 800);
      }
    }
  };

  // Wrapper for handleButtonClick to ensure scrolling
  const handleButtonClick = (button: any) => {
    originalHandleButtonClick(button);
    // Scroll to bottom whenever a button is clicked
    setTimeout(() => scrollToBottom('auto'), 50);
  };

  // Listen for scroll events to show/hide scroll indicator
  useEffect(() => {
    const chatBoxElement = document.querySelector('.overflow-y-auto');
    if (!chatBoxElement) return;

    const handleScroll = () => {
      if (chatBoxElement) {
        const scrollBottom = chatBoxElement.scrollHeight - chatBoxElement.scrollTop - chatBoxElement.clientHeight;
        const threshold = 40;
        setShowScrollButton(scrollBottom > threshold);
      }
    };

    chatBoxElement.addEventListener('scroll', handleScroll);
    return () => chatBoxElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll during typing for better view of streamed messages
  useEffect(() => {
    // Only auto-scroll if:
    // 1. Text is typing AND
    // 2. The user is near the bottom of the chat already AND
    // 3. Either we're not in embedded mode OR global auto-scroll is not disabled
    if (isTyping && !showScrollButton && (!isEmbedded || !disableGlobalAutoScroll)) {
      const interval = setInterval(() => {
        scrollToBottom('auto');
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isTyping, showScrollButton, isEmbedded, disableGlobalAutoScroll]);

  // Ensure carouselData persists through message changes
  useEffect(() => {
    // When messages change, don't automatically reset carousel data
    // This allows carousels to stay in the chat history
    if (messages.length > 0 && carouselData) {
      // Check if the carousel message still exists in the message list
      const carouselMessageExists = messages.some(msg => msg.id === carouselData.messageId);
      
      // If the carousel message has been removed (chat reset), then clear the carousel data
      if (!carouselMessageExists) {
        console.log('Carousel message no longer exists, resetting carousel data');
        // Don't need to do anything here as the carousel message is gone
      }
    }
  }, [messages, carouselData]);
  
  // Special handling for carousel data changes to ensure they're fully visible
  useEffect(() => {
    if (carouselData && (!isEmbedded || !disableGlobalAutoScroll)) {
      // Use multiple scroll attempts with increasing delays
      // This ensures the carousel is properly rendered and visible
      const scrollDelays = [100, 300, 600, 1000];
      scrollDelays.forEach(delay => {
        setTimeout(() => scrollToBottom('auto'), delay);
      });
    }
  }, [carouselData, isEmbedded, disableGlobalAutoScroll]);

  // Add custom scrollbar style
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = scrollbarStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const expandChat = () => {
    setIsMinimized(false);
    setIsFullyMinimized(false);
  };

  const handleRestartClick = () => {
    // Show rating dialog instead of immediately restarting
    setIsRatingDialogOpen(true);
  };
  
  const handleRatingSubmit = (rating: number, comment: string) => {
    // Here you would normally send the rating and comment to your backend
    console.log('Rating submitted:', rating, comment);
    
    // Close the dialog
    setIsRatingDialogOpen(false);
    
    // Then restart the chat
    handleRestart();
  };
  
  const handleRatingCancel = () => {
    // Close the dialog and restart the chat
    setIsRatingDialogOpen(false);
    handleRestart();
  };

  return (
    <>
      <div 
        className="w-full mx-auto bg-transparent shadow-none overflow-hidden transition-all font-sans flex flex-col relative"
        style={{ 
          height: isFullyMinimized ? 'auto' : '100%', 
          maxHeight: isFullyMinimized ? 'auto' : '100vh', 
          fontFamily: "'Inter', system-ui, sans-serif"
        }}
      >
        <div className={`flex-1 flex flex-col overflow-hidden relative ${isFullyMinimized ? 'h-0 m-0 p-0' : ''}`}>
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-hidden transition-all duration-300 flex flex-col font-sans relative"
            style={{ 
              display: isMinimized ? 'none' : 'flex',
              height: isMinimized ? '0' : 'auto',
              minHeight: conversationStarted && !isMinimized ? '200px' : '0',
              maxHeight: isMinimized ? '0' : 'calc(100vh - 120px)',
              overflow: 'hidden',
              fontFamily: "'Inter', system-ui, sans-serif"
            }}
          >
            {/* Control buttons - inside the chat container */}
            {conversationStarted && !isMinimized && !isFullyMinimized && (
              <div 
                className="absolute z-50 flex space-x-2 m-2" 
                style={{ 
                  top: '0',
                  left: '0'
                }}
              >
                <button
                  onClick={handleRestartClick}
                  className="bg-gray-100 hover:bg-gray-200 transition-colors p-1 rounded-full shadow-sm"
                  aria-label="Restart chat"
                >
                  <X size={14} className="text-[#28483f]" />
                </button>
                <button
                  onClick={toggleMinimize}
                  className="bg-gray-100 hover:bg-gray-200 transition-colors p-1 rounded-full shadow-sm"
                  aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
                >
                  <ChevronDown size={14} className={`text-[#28483f] ${isMinimized ? "rotate-180" : ""}`} />
                </button>
              </div>
            )}
            
            <ChatMessages 
              messages={messages} 
              isTyping={isTyping}
              stepsTotal={stepsTotal}
              currentStepIndex={currentStepIndex} 
              textStreamingStarted={textStreamingStarted}
              carouselData={carouselData}
              onButtonClick={handleButtonClick}
            />
          </div>
          
          {/* Scroll down indicator - only visible when not minimized */}
          {!isMinimized && (
            <ScrollDownIndicator
              visible={showScrollButton}
              onClick={scrollToBottom}
            />
          )}
          
          {/* Bottom container that stays together when minimized */}
          <div className={`${isMinimized ? 'mt-0' : 'mt-auto'} sticky bottom-0 bg-transparent transition-all duration-300 ${isMinimized ? 'rounded-2xl' : ''}`}>
            {/* ButtonPanel - visible in minimized but not fully minimized state */}
            {(!isFullyMinimized) && (
              <ButtonPanel 
                buttons={buttons} 
                isLoading={isButtonsLoading} 
                onButtonClick={handleButtonClick} 
                className={isMinimized ? 'mb-0 pb-0' : ''}
                isMinimized={isMinimized}
                onMaximize={expandChat}
              />
            )}
            
            <ChatInputArea 
              onSendMessage={handleSendMessage} 
              onInputFocus={handleInputFocus}
              isMinimized={isMinimized || isFullyMinimized}
              onMaximize={expandChat}
            />
            
            {/* Disclaimer under innskrivingsfeltet - alltid synlig */}
            <div className="w-full text-center text-xs text-gray-400 pt-0 mt-0 mb-1 font-light">
              <a 
                href="https://askask.no" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-normal"
                style={{ color: "#28483F" }}
              >
                Ask
              </a>
              <span> is powered by AI. For reference only.</span>
            </div>
          </div>
        </div>

        {/* Rating Dialog */}
        <RatingDialog 
          open={isRatingDialogOpen} 
          onOpenChange={setIsRatingDialogOpen}
          onSubmit={handleRatingSubmit}
          onCancel={handleRatingCancel}
        />
      </div>
    </>
  );
};

export default ChatInterface;
