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

  // Store accumulated content from multiple traces
  const accumulatedContentRef = useRef<string>('');
  // Keep track of whether we're currently streaming
  const isStreamingRef = useRef<boolean>(false);
  // Keep track of typing indicator display status
  const typingIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track if we're waiting for more content
  const waitingForMoreContentRef = useRef<boolean>(false);
  // Track if we've completed a message
  const messageCompletedRef = useRef<boolean>(false);

  const handleCompletionEvent = (payload: any) => {
    if (!payload) {
      console.warn('Empty completion payload received');
      return;
    }
    
    const { state, content } = payload;
    console.log('Completion event:', state, content ? content.substring(0, 50) + '...' : '');
    
    if (state === 'start') {
      console.log('Completion started');
      const msgId = `completion-${Date.now()}`;
      
      // Check if we already have a text message
      const hasTextMessage = Object.values(messageSourceTracker.current).includes('text');
      messageCompletedRef.current = false;
      
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
        waitingForMoreContentRef.current = true;
        
        // After a brief delay, replace typing indicator with streaming message
        typingIndicatorTimeoutRef.current = setTimeout(() => {
          partialMessageIdRef.current = msgId;
          currentCompletionContentRef.current = '';
          messageSourceTracker.current[msgId] = 'completion';
          setIsTyping(false); // Hide typing indicator when message starts
          waitingForMoreContentRef.current = false;
          
          addAgentMessage('', true, msgId);
          typingIndicatorTimeoutRef.current = null;
        }, 500); // 500ms delay for natural transition
      } else {
        console.log('Skipping completion message as we already have a text message');
      }
      receivedFirstTraceRef.current = true;
    } 
    else if (state === 'content') {
      // When we receive content from a trace
      if (!content) return;
      
      console.log(`Received content trace: "${content}"`);
      
      // If we haven't started a message yet
      if (!partialMessageIdRef.current && !isStreamingRef.current) {
        const msgId = `completion-${Date.now()}`;
        
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
          isStreamingRef.current = false;
          waitingForMoreContentRef.current = false;
          
          addAgentMessage('', true, msgId);
          typingIndicatorTimeoutRef.current = null;
          
          // Start streaming the first content
          processContentStream(content, msgId);
        }, 500); // 500ms delay for natural transition
      } 
      else if (partialMessageIdRef.current) {
        // If we're already streaming a message
        const msgId = partialMessageIdRef.current;
        
        if (isStreamingRef.current) {
          // If we're currently streaming, add this content to accumulated buffer
          accumulatedContentRef.current += content;
          console.log(`Added to buffer (now ${accumulatedContentRef.current.length} chars)`);
        } else {
          // If we're not currently streaming, start streaming this content
          processContentStream(content, msgId);
        }
      }
    }
    else if (state === 'end') {
      console.log('Completion ended');
      messageCompletedRef.current = true;
      
      // If we have pending content and we're not currently streaming, process it
      if (accumulatedContentRef.current.length > 0 && !isStreamingRef.current && partialMessageIdRef.current) {
        processContentStream(accumulatedContentRef.current, partialMessageIdRef.current);
        accumulatedContentRef.current = '';
      }
      
      // Mark the message as no longer partial once complete and all content is processed
      checkAndFinalizeMessage();
    }
  };
  
  const processContentStream = (content: string, msgId: string) => {
    if (!content || content.length === 0) return;
    
    console.log(`Starting to stream content: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
    isStreamingRef.current = true;
    waitingForMoreContentRef.current = false;
    
    // Stream each character with a delay
    let index = 0;
    let currentText = wordTrackerRef.current.getCurrentProcessedText();
    
    const streamNextChar = () => {
      if (index < content.length) {
        const char = content[index];
        currentText += char;
        
        // Update the UI with the new character
        updatePartialMessage(msgId, currentText, true);
        
        // Update our word tracker's processed text
        wordTrackerRef.current.appendContent(char);
        
        // Move to next character
        index++;
        
        // Schedule next character with consistent 30ms delay
        setTimeout(streamNextChar, 30);
      } else {
        // Done streaming this content chunk
        console.log(`Finished streaming chunk of ${content.length} chars`);
        isStreamingRef.current = false;
        
        // Check if we have more content in the buffer to process
        if (accumulatedContentRef.current.length > 0) {
          console.log(`Processing ${accumulatedContentRef.current.length} chars from buffer`);
          const nextContent = accumulatedContentRef.current;
          accumulatedContentRef.current = '';
          processContentStream(nextContent, msgId);
        } else if (messageCompletedRef.current) {
          // If the message is completed and we've processed all content
          checkAndFinalizeMessage();
        } else {
          // Otherwise we're waiting for more content
          waitingForMoreContentRef.current = true;
          console.log('Waiting for more content...');
        }
      }
    };
    
    // Start streaming
    streamNextChar();
  };
  
  const checkAndFinalizeMessage = () => {
    if (messageCompletedRef.current && !isStreamingRef.current && partialMessageIdRef.current) {
      console.log('Message completed, finalizing');
      const currentMsgId = partialMessageIdRef.current;
      
      // Ensure all content is processed
      const finalText = wordTrackerRef.current.getCurrentProcessedText();
      updatePartialMessage(currentMsgId, finalText, false);
      partialMessageIdRef.current = null;
      isStreamingRef.current = false;
      waitingForMoreContentRef.current = false;
      currentCompletionContentRef.current = '';
    }
  };

  const handleTraceEvent = (trace: any) => {
    console.log('Trace event received:', trace.type);
    
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
          messageCompletedRef.current = false;
          
          console.log('Text/Speak message received:', messageContent.substring(0, 50) + '...');
          
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
            
            // Process the text message in the same way as completion content
            processContentStream(messageContent, msgId);
            messageCompletedRef.current = true; // Text messages are complete when delivered
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
        messageCompletedRef.current = true;
        
        // If we have pending content and we're not currently streaming, process it
        if (accumulatedContentRef.current.length > 0 && !isStreamingRef.current && partialMessageIdRef.current) {
          processContentStream(accumulatedContentRef.current, partialMessageIdRef.current);
          accumulatedContentRef.current = '';
        }
        
        // Check and finalize any pending message
        checkAndFinalizeMessage();
        
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
