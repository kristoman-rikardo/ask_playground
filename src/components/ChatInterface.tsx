import React, { useState, useEffect, useRef, useContext } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import ChatMessages from './chat/ChatMessages';
import ChatInputArea from './chat/ChatInputArea';
import ButtonPanel from './ButtonPanel';
import ScrollDownIndicator from './chat/indicators/ScrollDownIndicator';
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
    const chatBoxElement = document.querySelector('.overflow-y-auto, .ask-overflow-y-auto');
    if (chatBoxElement) {
      // First scroll attempt - immediate
      chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
      
      // Force layout recalculation
      if (chatBoxElement instanceof HTMLElement) {
        void chatBoxElement.offsetHeight;
      }
      
      // Multiple check attempts with increasing delays to ensure proper scrolling
      // This helps with dynamic content like carousels that may change height
      const scrollAttempts = [10, 50, 200, 500];
      scrollAttempts.forEach(delay => {
        setTimeout(() => {
          if (chatBoxElement) {
            chatBoxElement.scrollTop = chatBoxElement.scrollHeight + 1000; // Ensure it scrolls past the end
          }
        }, delay);
      });
      
      // Special handling for carousels
      if (carouselData) {
        // Add extra scroll attempt for carousels with longer delays
        // This ensures the carousel is fully rendered and visible
        const carouselDelays = [300, 600, 900, 1200];
        carouselDelays.forEach(delay => {
          setTimeout(() => {
            if (chatBoxElement) {
              chatBoxElement.scrollTop = chatBoxElement.scrollHeight + 1000;
            }
          }, delay);
        });
      }
    }
  };

  // Wrapper for handleButtonClick to ensure scrolling
  const handleButtonClick = (button: any) => {
    originalHandleButtonClick(button);
    // Scroll to bottom whenever a button is clicked
    setTimeout(() => scrollToBottom('auto'), 10);
    setTimeout(() => scrollToBottom('auto'), 300);
  };

  // Listen for scroll events to show/hide scroll indicator
  useEffect(() => {
    const chatBoxElement = document.querySelector('.overflow-y-auto, .ask-overflow-y-auto');
    if (!chatBoxElement) return;

    const handleScroll = () => {
      if (chatBoxElement) {
        const scrollBottom = chatBoxElement.scrollHeight - chatBoxElement.scrollTop - chatBoxElement.clientHeight;
        const threshold = 100; // Increased threshold to make the button appear earlier
        setShowScrollButton(scrollBottom > threshold);
      }
    };

    // Initial check
    handleScroll();

    // Add event listener
    chatBoxElement.addEventListener('scroll', handleScroll);
    
    // Also check periodically in case content changes without scrolling
    const intervalCheck = setInterval(handleScroll, 500);

    return () => {
      chatBoxElement.removeEventListener('scroll', handleScroll);
      clearInterval(intervalCheck);
    };
  }, []);

  // Auto-scroll during typing for better view of streamed messages
  useEffect(() => {
    // Only auto-scroll if:
    // 1. Text is typing AND
    // 2. Either we're near the bottom OR global auto-scroll is not disabled
    if (isTyping && (!isEmbedded || !disableGlobalAutoScroll)) {
      const interval = setInterval(() => {
        if (!showScrollButton) { // Only auto-scroll if already near bottom
          scrollToBottom('auto');
        }
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
        className="ask-w-full ask-mx-auto ask-bg-transparent ask-shadow-none ask-overflow-hidden ask-transition-all ask-font-sans ask-flex ask-flex-col ask-relative"
        style={{ 
          height: isFullyMinimized ? 'auto' : '100%', 
          maxHeight: isFullyMinimized ? 'auto' : '100vh', 
          fontFamily: "'Inter', system-ui, sans-serif"
        }}
      >
        <div className={`ask-flex-1 ask-flex ask-flex-col ask-overflow-hidden ask-relative ${isFullyMinimized ? 'ask-h-0 ask-m-0 ask-p-0' : ''}`}>
          <div 
            ref={messagesContainerRef}
            className="ask-flex-1 ask-overflow-hidden ask-transition-all ask-duration-300 ask-flex ask-flex-col ask-font-sans ask-relative"
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
                className="ask-absolute ask-z-50 ask-flex ask-space-x-2 ask-m-2" 
                style={{ 
                  top: '0',
                  left: '0'
                }}
              >
                <button
                  onClick={handleRestartClick}
                  className="ask-bg-gray-100 ask-hover:bg-gray-200 ask-transition-colors ask-p-1 ask-rounded-full ask-shadow-sm"
                  aria-label="Restart chat"
                >
                  <X size={14} className="ask-text-[#28483f]" />
                </button>
                <button
                  onClick={toggleMinimize}
                  className="ask-bg-gray-100 ask-hover:bg-gray-200 ask-transition-colors ask-p-1 ask-rounded-full ask-shadow-sm"
                  aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
                >
                  <ChevronDown size={14} className={`ask-text-[#28483f] ${isMinimized ? "ask-rotate-180" : ""}`} />
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
            <div className="ask-relative ask-z-50">
              <ScrollDownIndicator
                visible={showScrollButton}
                onClick={() => {
                  scrollToBottom('smooth');
                  // Etter scroll, sjekk om indikatoren bør skjules
                  setTimeout(() => {
                    const chatBoxElement = document.querySelector('.overflow-y-auto, .ask-overflow-y-auto');
                    if (chatBoxElement) {
                      const scrollBottom = chatBoxElement.scrollHeight - chatBoxElement.scrollTop - chatBoxElement.clientHeight;
                      setShowScrollButton(scrollBottom > 100);
                    }
                  }, 100);
                }}
              />
            </div>
          )}
          
          {/* Bottom container that stays together when minimized */}
          <div className={`${isMinimized ? 'ask-mt-0' : 'ask-mt-auto'} ask-sticky ask-bottom-0 ask-bg-transparent ask-transition-all ask-duration-300 ${isMinimized ? 'ask-rounded-2xl' : ''}`}>
            {/* ButtonPanel - visible in minimized but not fully minimized state */}
            {(!isFullyMinimized) && (
              <ButtonPanel 
                buttons={buttons} 
                isLoading={isButtonsLoading} 
                onButtonClick={handleButtonClick} 
                className={isMinimized ? 'ask-mb-0 ask-pb-0' : ''}
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
            <div className="ask-w-full ask-text-center ask-text-xs ask-text-gray-400 ask-pt-0 ask-mt-0 ask-mb-1 ask-font-light">
              <a 
                href="https://askask.no" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ask-font-normal"
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
