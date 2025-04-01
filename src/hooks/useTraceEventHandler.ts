
import { useRef } from 'react';
import { Button } from '@/types/chat';
import { MessageStreamingHook } from '@/hooks/useMessageStreaming';
import { streamWords } from '@/utils/streamingUtils';

export function useTraceEventHandler(
  streaming: MessageStreamingHook,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  setButtons: React.Dispatch<React.SetStateAction<Button[]>>,
  setIsButtonsLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
  const receivedFirstTraceRef = useRef<boolean>(false);
  const {
    currentCompletionContentRef,
    partialMessageIdRef,
    messageSourceTracker,
    wordTrackerRef,
    updatePartialMessage,
    addAgentMessage,
    scheduleUpdate
  } = streaming;

  const animationFrameIdRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  // Use a consistent update interval for smooth streaming
  const MIN_UPDATE_INTERVAL = 30; // ms
  
  // Keep track of typing indicator display status
  const typingIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track if we're currently streaming content
  const isStreamingRef = useRef<boolean>(false);
  // Store accumulated content from multiple traces
  const accumulatedContentRef = useRef<string>('');

  const handleCompletionEvent = (payload: any) => {
    if (!payload) {
      console.warn('Empty completion payload received');
      return;
    }
    
    const { state, content } = payload;
    console.log('Completion event:', state, content ? content.substring(0, 50) : '');
    
    if (state === 'start') {
      console.log('Completion started');
      const msgId = `completion-${Date.now()}`;
      
      // Check if we already have a text message
      const hasTextMessage = Object.values(messageSourceTracker.current).includes('text');
      
      wordTrackerRef.current.reset();
      accumulatedContentRef.current = '';
      
      if (!hasTextMessage) {
        // Clear any existing typing indicator timeout
        if (typingIndicatorTimeoutRef.current) {
          clearTimeout(typingIndicatorTimeoutRef.current);
          typingIndicatorTimeoutRef.current = null;
        }
        
        // Show typing indicator for a short natural delay
        setIsTyping(true);
        
        // After a brief delay, replace typing indicator with streaming message
        typingIndicatorTimeoutRef.current = setTimeout(() => {
          partialMessageIdRef.current = msgId;
          currentCompletionContentRef.current = '';
          messageSourceTracker.current[msgId] = 'completion';
          setIsTyping(false); // Hide typing indicator when message starts
          isStreamingRef.current = true;
          
          addAgentMessage('', true, msgId);
          typingIndicatorTimeoutRef.current = null;
        }, 500); // 500ms delay for natural transition
      } else {
        console.log('Skipping completion message as we already have a text message');
      }
      receivedFirstTraceRef.current = true;
    } 
    else if (state === 'content') {
      if (!content || !partialMessageIdRef.current) return;
      
      const currentMsgId = partialMessageIdRef.current;
      
      // Always accumulate content, even if we're currently streaming something else
      accumulatedContentRef.current += content;
      
      if (messageSourceTracker.current[currentMsgId] === 'completion' && !isStreamingRef.current) {
        // If we're not currently streaming, start streaming the accumulated content
        isStreamingRef.current = true;
        
        // Process content through character tracker
        const contentToStream = accumulatedContentRef.current;
        accumulatedContentRef.current = '';
        
        // Add the content to the total content
        currentCompletionContentRef.current += contentToStream;
        
        // Process content through character tracker to maintain the 30ms delay
        wordTrackerRef.current.appendContent(contentToStream);
        
        // Ensure we're updating with consistent timing
        if (animationFrameIdRef.current === null) {
          const updateStreaming = () => {
            if (!partialMessageIdRef.current) return;
            
            const processedText = wordTrackerRef.current.getCurrentProcessedText();
            updatePartialMessage(currentMsgId, processedText, true);
            
            if (!wordTrackerRef.current.isStreamingComplete()) {
              animationFrameIdRef.current = requestAnimationFrame(updateStreaming);
            } else {
              animationFrameIdRef.current = null;
              isStreamingRef.current = false;
              
              // If we have more accumulated content, process it now
              if (accumulatedContentRef.current.length > 0) {
                handleCompletionEvent({
                  state: 'content',
                  content: accumulatedContentRef.current
                });
              }
            }
          };
          
          animationFrameIdRef.current = requestAnimationFrame(updateStreaming);
        }
      }
    }
    else if (state === 'end') {
      console.log('Completion ended');
      
      const currentMsgId = partialMessageIdRef.current;
      if (currentMsgId && messageSourceTracker.current[currentMsgId] === 'completion') {
        if (animationFrameIdRef.current !== null) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
        
        // Add any remaining accumulated content
        if (accumulatedContentRef.current.length > 0) {
          currentCompletionContentRef.current += accumulatedContentRef.current;
          wordTrackerRef.current.appendContent(accumulatedContentRef.current);
          accumulatedContentRef.current = '';
        }
        
        // Let the streaming finish naturally through the word tracker
        // The StreamingWordTracker will continue to process remaining characters
        const { text } = wordTrackerRef.current.finalize();
        
        // We'll continue letting the stream tracker output the text,
        // but mark the message as no longer partial once complete
        const checkStreamingComplete = () => {
          if (wordTrackerRef.current.isStreamingComplete()) {
            updatePartialMessage(currentMsgId, wordTrackerRef.current.getCurrentProcessedText(), false);
            partialMessageIdRef.current = null;
            isStreamingRef.current = false;
          } else {
            setTimeout(checkStreamingComplete, 100);
          }
        };
        
        checkStreamingComplete();
      }
    }
  };

  const handleTraceEvent = (trace: any) => {
    console.log('Trace event received:', trace.type, trace);
    
    if (trace.type === 'speak' || trace.type === 'text' || (trace.type === 'completion' && trace.payload?.state === 'content')) {
      receivedFirstTraceRef.current = true;
    }
    
    switch (trace.type) {
      case 'speak':
      case 'text': {
        if (trace.payload && trace.payload.message) {
          const messageContent = trace.payload.message;
          const msgId = `text-${Date.now()}`;
          
          messageSourceTracker.current[msgId] = 'text';
          
          console.log('Text/Speak message received:', messageContent);
          
          // Clear any existing typing indicator timeout
          if (typingIndicatorTimeoutRef.current) {
            clearTimeout(typingIndicatorTimeoutRef.current);
            typingIndicatorTimeoutRef.current = null;
          }
          
          // Show typing indicator for a short natural delay
          setIsTyping(true);
          
          // After a brief delay, replace typing indicator with streaming message
          typingIndicatorTimeoutRef.current = setTimeout(() => {
            partialMessageIdRef.current = msgId;
            setIsTyping(false); // Hide typing indicator when message starts
            
            addAgentMessage('', true, msgId);
            typingIndicatorTimeoutRef.current = null;
            isStreamingRef.current = true;
            
            // Use streamWords with character-by-character animation
            streamWords(
              messageContent,
              (updatedText) => {
                updatePartialMessage(msgId, updatedText, true);
              },
              () => {
                // When complete, show final text
                updatePartialMessage(msgId, messageContent, false);
                partialMessageIdRef.current = null;
                isStreamingRef.current = false;
              },
              30  // consistent 30ms delay
            );
          }, 500); // 500ms delay for natural transition
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
        if (partialMessageIdRef.current && currentCompletionContentRef.current) {
          // Make sure we stream any remaining content
          if (accumulatedContentRef.current.length > 0) {
            wordTrackerRef.current.appendContent(accumulatedContentRef.current);
            accumulatedContentRef.current = '';
          }
          
          // Let the streaming finish naturally
          const checkStreamingComplete = () => {
            if (wordTrackerRef.current.isStreamingComplete()) {
              updatePartialMessage(partialMessageIdRef.current!, wordTrackerRef.current.getCurrentProcessedText(), false);
              partialMessageIdRef.current = null;
              isStreamingRef.current = false;
              currentCompletionContentRef.current = '';
            } else {
              setTimeout(checkStreamingComplete, 100);
            }
          };
          
          checkStreamingComplete();
        }
        
        setTimeout(() => {
          setIsTyping(false);
          setIsButtonsLoading(false);
        }, 50);
        break;
      
      default:
        // Handle other trace types if needed
        break;
    }
  };

  return {
    handleTraceEvent,
    receivedFirstTraceRef
  };
}
