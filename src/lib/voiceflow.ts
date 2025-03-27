
// src/lib/voiceflow.ts
import { v4 as uuidv4 } from 'uuid';

const RUNTIME_API_KEY = import.meta.env.VITE_VOICEFLOW_API_KEY || "VF.DM.67d466872e0fa2e87529d165.jvSM4GSGdSCXVn2z";
const RUNTIME_ENDPOINT = 'https://general-runtime.voiceflow.com';
const PROJECT_ID = import.meta.env.VITE_VOICEFLOW_PROJECT_ID || "67d1ad605c5916e15e7ceb94";

// User session ID - fixed for testing but can be dynamic in production
const USER_ID = '123456777';

export function parseMarkdown(text: string): string {
  if (!text) return '';
  
  // Convert markdown links: [text](url)
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g, 
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
  );
  
  // Handle bold: **text** or __text__
  text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
  
  // Handle italic: *text* or _text_
  text = text.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
  
  // Handle line breaks
  text = text.replace(/\n/g, '<br />');
  
  return text;
}

// Simple delay function for animations
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Types for trace handling
export type TraceHandler = (trace: any) => void;
export type CompletionCallback = (content: string, isPartial: boolean, messageId: string | null) => void;

// Send a launch request to Voiceflow Dialog API
export async function vfSendLaunch(
  variables: Record<string, any> = {}, 
  traceHandler: TraceHandler
): Promise<void> {
  console.log('Sending launch request to Voiceflow');
  
  await sendRequest(
    {
      type: 'launch',
    },
    variables,
    traceHandler
  );
}

// Send a message to Voiceflow Dialog API
export async function vfSendMessage(
  message: string, 
  traceHandler: TraceHandler,
  variables: Record<string, any> = {}
): Promise<void> {
  console.log(`Sending message to Voiceflow: ${message}`);
  
  await sendRequest(
    {
      type: 'text',
      payload: message
    },
    variables,
    traceHandler
  );
}

// Send an action to Voiceflow Dialog API (for button clicks)
export async function vfSendAction(
  action: any,
  traceHandler: TraceHandler,
  variables: Record<string, any> = {}
): Promise<void> {
  console.log('Sending action to Voiceflow:', action);
  
  await sendRequest(
    action,
    variables,
    traceHandler
  );
}

// Core function to send requests to Voiceflow Dialog API
async function sendRequest(
  action: any,
  variables: Record<string, any> = {},
  traceHandler: TraceHandler
): Promise<void> {
  if (!RUNTIME_API_KEY || !PROJECT_ID) {
    console.error('Missing Voiceflow API key or project ID');
    throw new Error('Missing Voiceflow API key or project ID');
  }

  const queryParams = new URLSearchParams({
    completion_events: 'true', // Enable streaming completion events
    environment: 'production',
    state: 'false'
  });

  try {
    // Make the request to the Voiceflow Dialog API
    const response = await fetch(
      `${RUNTIME_ENDPOINT}/v2/project/${PROJECT_ID}/user/${USER_ID}/interact/stream?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': RUNTIME_API_KEY,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          action,
          ...(Object.keys(variables).length > 0 && { variables }),
        }),
      }
    );

    if (!response.ok || !response.body) {
      throw new Error(`API failed with status ${response.status}`);
    }

    // Process the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      // Decode the chunk and add it to our buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete events from the buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.startsWith('data:')) {
          try {
            const data = line.slice(5).trim();
            const event = JSON.parse(data);
            // Pass the event to the trace handler
            traceHandler(event);
          } catch (error) {
            console.error('Error parsing event:', line, error);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error sending request to Voiceflow:', error);
    throw error;
  }
}
