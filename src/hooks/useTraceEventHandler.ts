
import { useRef } from 'react';
import { Button } from '@/types/chat';
import { MessageStreamingHook } from '@/hooks/useMessageStreaming';
// Import from the re-exporting file, so no changes needed in imports
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

  // Animation frame ID for throttling updates
  const animationFrameIdRef = useRef<number | null>(null);
  // Timestamp for throttling real-time streaming
  const lastUpdateTimeRef = useRef<number>(0);
  // Minimum update interval for real-time streaming (ms)
  const MIN_UPDATE_INTERVAL = 30;

  const handleCompletionEvent = (payload: any) => {
    if (!payload) {
      console.warn('Empty completion payload received');
      return;
    }
    
    const { state, content } = payload;
    console.log('Completion event:', state, content ? content.substring(0, 50) : '');
    
    if (state === 'start') {
      console.log('Completion started');
      // Create a unique ID for this completion
      const msgId = `completion-${Date.now()}`;
      
      // Check if we already have a text/speak message
      const hasTextMessage = Object.values(messageSourceTracker.current).includes('text');
      
      // Reset word tracker for new completion
      wordTrackerRef.current.reset();
      
      // Only create a new message if we don't already have a text/speak message
      if (!hasTextMessage) {
        partialMessageIdRef.current = msgId;
        currentCompletionContentRef.current = '';
        messageSourceTracker.current[msgId] = 'completion';
        
        // Initialize with empty content
        addAgentMessage('', true, msgId);
      } else {
        console.log('Skipping completion message as we already have a text message');
      }
      receivedFirstTraceRef.current = true;
    } 
    else if (state === 'content') {
      if (!content || !partialMessageIdRef.current) return;
      
      // Only update completion content if the current message is a completion message
      const currentMsgId = partialMessageIdRef.current;
      
      if (messageSourceTracker.current[currentMsgId] === 'completion') {
        // Append new content to the buffer
        currentCompletionContentRef.current += content;
        
        // Use the word tracker to process incoming content with proper formatting
        const { formattedOutput } = wordTrackerRef.current.appendContent(content);
        
        // Throttle updates to avoid too frequent DOM updates
        const now = Date.now();
        if (now - lastUpdateTimeRef.current >= MIN_UPDATE_INTERVAL) {
          // Schedule an update to the UI
          if (animationFrameIdRef.current === null) {
            animationFrameIdRef.current = requestAnimationFrame(() => {
              updatePartialMessage(currentMsgId, formattedOutput, true);
              animationFrameIdRef.current = null;
            });
          }
          lastUpdateTimeRef.current = now;
        }
      }
    }
    else if (state === 'end') {
      console.log('Completion ended');
      
      // Only finalize if this is a completion message
      const currentMsgId = partialMessageIdRef.current;
      if (currentMsgId && messageSourceTracker.current[currentMsgId] === 'completion') {
        // Cancel any pending animation frame
        if (animationFrameIdRef.current !== null) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
        
        // Finalize any partial content
        const { text } = wordTrackerRef.current.finalize();
        
        // Ensure the full content is displayed without animation wrappers
        updatePartialMessage(currentMsgId, text, false);
        partialMessageIdRef.current = null;
      }
    }
  };

  const handleTraceEvent = (trace: any) => {
    console.log('Trace event received:', trace.type, trace);
    
    // Set the receivedFirstTraceRef to true for any content trace received
    if (trace.type === 'speak' || trace.type === 'text' || (trace.type === 'completion' && trace.payload?.state === 'content')) {
      receivedFirstTraceRef.current = true;
    }
    
    switch (trace.type) {
      case 'speak':
      case 'text': {
        if (trace.payload && trace.payload.message) {
          const messageContent = trace.payload.message;
          const msgId = `text-${Date.now()}`;
          
          // Track that this message came from text/speak
          messageSourceTracker.current[msgId] = 'text';
          
          console.log('Text/Speak message received:', messageContent);
          
          // Initialize the message immediately
          partialMessageIdRef.current = msgId;
          addAgentMessage('', true, msgId);
          
          // Stream the message word by word with fade-in effect using random delays (5-30ms)
          streamWords(
            messageContent,
            (updatedText) => {
              updatePartialMessage(msgId, updatedText, true);
            },
            () => {
              // When streaming is complete, set the final message without animation wrappers
              updatePartialMessage(msgId, messageContent, false);
              partialMessageIdRef.current = null;
            },
            5, // minimum 5ms delay
            30  // maximum 30ms delay
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
        // Ensure any partial messages are complete before ending
        if (partialMessageIdRef.current && currentCompletionContentRef.current) {
          // Finalize any partial messages with their complete content
          updatePartialMessage(partialMessageIdRef.current, currentCompletionContentRef.current, false);
          partialMessageIdRef.current = null;
          currentCompletionContentRef.current = '';
        }
        
        // Only set typing to false after all messages are complete
        setTimeout(() => {
          setIsTyping(false);
          setIsButtonsLoading(false);
        }, 50);
        break;
      
      default:
        console.log('Unhandled trace type:', trace.type);
    }
  };

  return {
    handleTraceEvent,
    receivedFirstTraceRef
  };
}
