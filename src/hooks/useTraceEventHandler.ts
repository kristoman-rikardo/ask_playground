
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
      
      const hasTextMessage = Object.values(messageSourceTracker.current).includes('text');
      
      wordTrackerRef.current.reset();
      
      if (!hasTextMessage) {
        partialMessageIdRef.current = msgId;
        currentCompletionContentRef.current = '';
        messageSourceTracker.current[msgId] = 'completion';
        
        addAgentMessage('', true, msgId);
      } else {
        console.log('Skipping completion message as we already have a text message');
      }
      receivedFirstTraceRef.current = true;
    } 
    else if (state === 'content') {
      if (!content || !partialMessageIdRef.current) return;
      
      const currentMsgId = partialMessageIdRef.current;
      
      if (messageSourceTracker.current[currentMsgId] === 'completion') {
        currentCompletionContentRef.current += content;
        
        // Process content through character tracker
        const result = wordTrackerRef.current.appendContent(content);
        
        // Update with consistent timing
        const now = Date.now();
        if (now - lastUpdateTimeRef.current >= MIN_UPDATE_INTERVAL) {
          if (animationFrameIdRef.current === null) {
            animationFrameIdRef.current = requestAnimationFrame(() => {
              // Use the processed text directly
              updatePartialMessage(currentMsgId, result.processedText, true);
              animationFrameIdRef.current = null;
            });
          }
          lastUpdateTimeRef.current = now;
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
        
        // Use the final processed content
        const { text } = wordTrackerRef.current.finalize();
        
        updatePartialMessage(currentMsgId, text || currentCompletionContentRef.current, false);
        partialMessageIdRef.current = null;
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
          
          partialMessageIdRef.current = msgId;
          addAgentMessage('', true, msgId);
          
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
            },
            30  // consistent 30ms delay
          );
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
          updatePartialMessage(partialMessageIdRef.current, currentCompletionContentRef.current, false);
          partialMessageIdRef.current = null;
          currentCompletionContentRef.current = '';
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
