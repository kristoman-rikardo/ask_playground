import React, { useState, useEffect, useRef } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import ChatMessages from './chat/ChatMessages';
import ChatInputArea from './chat/ChatInputArea';
import ButtonPanel from './ButtonPanel';
import ScrollDownIndicator from './chat/ScrollDownIndicator';
import { ChevronDown, Maximize2, X } from 'lucide-react';
import RatingDialog from './RatingDialog';

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
      chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
      
      // Extra check to ensure we're really at the bottom
      setTimeout(() => {
        if (chatBoxElement) {
          chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
        }
      }, 50);
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
    if (isTyping && !showScrollButton) {
      const interval = setInterval(() => {
        scrollToBottom('auto');
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isTyping, showScrollButton]);

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
    <div 
      className="w-full mx-auto bg-transparent shadow-none overflow-hidden transition-all font-sans flex flex-col"
      style={{ height: '100%', maxHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Control buttons - only visible when not minimized */}
        <div className="absolute top-2 right-2 z-50 flex space-x-2" style={{ 
          opacity: isMinimized ? 0 : 1,
          transition: 'opacity 0.2s ease',
          pointerEvents: isMinimized ? 'none' : 'auto'
        }}>
          <button
            onClick={handleRestartClick}
            className="bg-gray-100 hover:bg-gray-200 transition-colors p-1.5 rounded-full shadow-sm"
            aria-label="Restart chat"
          >
            <X size={16} />
          </button>
          <button
            onClick={toggleMinimize}
            className="bg-gray-100 hover:bg-gray-200 transition-colors p-1.5 rounded-full shadow-sm"
            aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
          >
            <ChevronDown size={16} />
          </button>
        </div>

        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-hidden transition-all duration-300 flex flex-col font-sans relative"
          style={{ 
            opacity: conversationStarted && !isMinimized ? 1 : 0,
            flexGrow: isMinimized ? 0 : 1,
            height: isMinimized ? '0px' : 'auto',
            minHeight: conversationStarted && !isMinimized ? '200px' : '0px',
            maxHeight: isMinimized ? '0px' : 'calc(100vh - 120px)',
            fontFamily: "'Inter', system-ui, sans-serif"
          }}
        >
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
        <div className={`mt-auto sticky bottom-0 bg-transparent transition-all duration-300 ${isMinimized ? 'rounded-2xl' : ''}`}>
          {/* ButtonPanel - always visible */}
          <ButtonPanel 
            buttons={buttons} 
            isLoading={isButtonsLoading} 
            onButtonClick={handleButtonClick} 
            className={isMinimized ? 'mb-0 pb-0' : ''}
            isMinimized={isMinimized || isFullyMinimized}
          />
          
          <ChatInputArea 
            onSendMessage={handleSendMessage} 
            onInputFocus={handleInputFocus}
            isMinimized={isMinimized || isFullyMinimized}
            onMaximize={expandChat}
          />
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
  );
};

export default ChatInterface;
