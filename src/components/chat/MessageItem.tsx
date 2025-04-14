import React, { useState, useRef } from 'react';
import { parseMarkdown } from '@/lib/voiceflow';

interface MessageItemProps {
  content: string;
  isUser: boolean;
  isPartial?: boolean;
  messageId: string;
  isLast: boolean;
  lastMessageRef: React.RefObject<HTMLDivElement> | null;
}

type FeedbackType = 'helpful' | 'not_helpful' | null;

const MessageItem: React.FC<MessageItemProps> = ({ 
  content, 
  isUser, 
  isPartial, 
  messageId, 
  isLast,
  lastMessageRef 
}) => {
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  
  const processContent = (content: string) => {
    if (!content) return <div className="ask-h-5 ask-w-20 ask-bg-gray-200/50 ask-rounded ask-animate-pulse"></div>;
    return <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />;
  };

  const copyContent = () => {
    // Henter rent tekstinnhold uten markdown-formatering
    const textContent = content;
    
    navigator.clipboard.writeText(textContent)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch(err => {
        console.error('Kunne ikke kopiere tekst: ', err);
      });

    // Skjul ikoner etter handling på mobil
    setIsActionsVisible(false);
  };

  const handleFeedback = (type: FeedbackType) => {
    // Hvis brukeren klikker på samme feedback som allerede er valgt, fjern den
    if (feedback === type) {
      setFeedback(null);
    } else {
      setFeedback(type);
    }
    
    // Her kan du legge til API-kall eller annen logikk for å registrere feedbacken
    
    // Skjul ikoner etter handling på mobil
    setIsActionsVisible(false);
  };

  const toggleActionsVisibility = (e: React.MouseEvent) => {
    if (isUser) return; // Bare vis handlinger for systemmeldinger
    
    // Hindre at klikk på knapper trigger denne
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    setIsActionsVisible(!isActionsVisible);
  };

  return (
    <div 
      id={`message-${messageId}`}
      ref={isLast ? lastMessageRef : null}
      className={`ask-flex ${isUser ? 'ask-justify-end' : 'ask-justify-start'} ask-w-full ask-relative ask-group`}
    >
      <div
        className={`ask-rounded-xl ask-font-sans ${
          isUser 
            ? 'chat-message-user ask-max-w-[85%] ask-self-end ask-px-3 ask-py-2'
            : 'chat-message-agent ask-max-w-[85%] ask-self-start ask-px-4 ask-py-2.5 ask-cursor-pointer'
        } ask-relative`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        onClick={toggleActionsVisibility}
      >
        {processContent(content)}
        
        {!isUser && (
          <div 
            className={`ask-absolute ask--right-6 ask-top-1/2 ask-transform ask--translate-y-1/2 ask-flex ask-flex-col ask-transition-opacity 
            ${isActionsVisible ? 'ask-opacity-100' : 'ask-opacity-0 group-hover:ask-opacity-100'}`}
            style={{ lineHeight: 0 }}
          >
            <button 
              className="ask-p-0 hover:ask-bg-gray-100 ask-rounded-full ask-my-[2px]" 
              onClick={(e) => {
                e.stopPropagation();
                handleFeedback('helpful');
              }}
              aria-label="Hjelpsomt"
            >
              {feedback === 'helpful' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#28483F" stroke="#28483F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 10v12"></path>
                  <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ask-text-gray-400 hover:ask-text-gray-600">
                  <path d="M7 10v12"></path>
                  <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
                </svg>
              )}
              <span className="ask-sr-only">Hjelpsomt</span>
              <div className="ask-absolute ask-right-full ask-mr-2 ask-top-1/2 ask-transform ask--translate-y-1/2 ask-bg-gray-800 ask-text-white ask-text-xs ask-px-2 ask-py-1 ask-rounded ask-opacity-0 group-hover:ask-opacity-0 hover:ask-opacity-100 ask-whitespace-nowrap ask-pointer-events-none">
                Hjelpsomt
              </div>
            </button>
            
            <button 
              className="ask-p-0 hover:ask-bg-gray-100 ask-rounded-full ask-my-[2px]" 
              onClick={(e) => {
                e.stopPropagation();
                handleFeedback('not_helpful');
              }}
              aria-label="Ikke hjelpsomt"
            >
              {feedback === 'not_helpful' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#28483F" stroke="#28483F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 14V2"></path>
                  <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ask-text-gray-400 hover:ask-text-gray-600">
                  <path d="M17 14V2"></path>
                  <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
                </svg>
              )}
              <span className="ask-sr-only">Ikke hjelpsomt</span>
              <div className="ask-absolute ask-right-full ask-mr-2 ask-top-1/2 ask-transform ask--translate-y-1/2 ask-bg-gray-800 ask-text-white ask-text-xs ask-px-2 ask-py-1 ask-rounded ask-opacity-0 group-hover:ask-opacity-0 hover:ask-opacity-100 ask-whitespace-nowrap ask-pointer-events-none">
                Ikke hjelpsomt
              </div>
            </button>
            
            <button 
              className="ask-p-0 hover:ask-bg-gray-100 ask-rounded-full ask-my-[2px]" 
              onClick={(e) => {
                e.stopPropagation();
                copyContent();
              }}
              aria-label="Kopier"
            >
              {isCopied ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#28483F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ask-text-gray-400 hover:ask-text-gray-600">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                </svg>
              )}
              <span className="ask-sr-only">Kopier</span>
              <div className="ask-absolute ask-right-full ask-mr-2 ask-top-1/2 ask-transform ask--translate-y-1/2 ask-bg-gray-800 ask-text-white ask-text-xs ask-px-2 ask-py-1 ask-rounded ask-opacity-0 group-hover:ask-opacity-0 hover:ask-opacity-100 ask-whitespace-nowrap ask-pointer-events-none">
                {isCopied ? 'Kopiert!' : 'Kopier'}
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
