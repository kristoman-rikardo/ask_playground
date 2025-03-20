
// Voiceflow API integration

// Voiceflow credentials
const VF_KEY = "VF.DM.67d466872e0fa2e87529d165.jvSM4GSGdSCXVn2z";
const VF_PROJECT_ID = "67d1ad605c5916e15e7ceb94";

// Create a random userID for session
export const userID = `${Math.floor(Math.random() * 1000000000000000)}`;

/**
 * Helper delay function
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main Voiceflow streaming function
 */
export async function vfInteractStream(
  user: string, 
  userAction: any, 
  onSseTrace: (chunk: string) => void
): Promise<any[]> {
  const streamUrl =
    `https://general-runtime.voiceflow.com/v2/project/${VF_PROJECT_ID}/user/${user}/interact/stream` +
    `?environment=development&completion_events=true&state=false`;

  const payload = { action: userAction };

  try {
    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        Authorization: VF_KEY,
        accept: 'text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Stream HTTP error: ${response.status}`);
    if (!response.body) throw new Error('Response body is null');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      // Decode the current chunk and add it to our buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process any complete SSE messages in the buffer
      // SSE format: "id: <id>\nevent: <event>\ndata: <data>\n\n"
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || ''; // Keep the last potentially incomplete message
      
      for (const message of messages) {
        if (message.trim()) {
          onSseTrace(message + '\n\n');
        }
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      onSseTrace(buffer);
    }

    return [];
  } catch (error) {
    console.error('Voiceflow API error:', error);
    // Add retry logic for network errors
    if (error instanceof TypeError && error.message.includes('network')) {
      console.log('Network error detected, retrying in 2 seconds...');
      await delay(2000);
      return vfInteractStream(user, userAction, onSseTrace);
    }
    throw error;
  }
}

/**
 * Voiceflow: Launch a new session
 */
export function vfSendLaunch(payload: any, onChunk: (chunk: string) => void): Promise<any[]> {
  return vfInteractStream(userID, { type: 'launch', payload }, onChunk);
}

/**
 * Voiceflow: Send text
 */
export function vfSendMessage(message: string, onChunk: (chunk: string) => void): Promise<any[]> {
  return vfInteractStream(userID, { type: 'text', payload: message }, onChunk);
}

/**
 * Voiceflow: Send an action (button press, etc.)
 */
export function vfSendAction(actionRequest: any, onChunk: (chunk: string) => void): Promise<any[]> {
  return vfInteractStream(userID, actionRequest, onChunk);
}

/**
 * Parse Voiceflow response for markdown formatting
 */
export function parseMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>')
    .replace(/(\n)+/g, '<br>');
}

/**
 * Optional fake streaming effect for text messages
 */
export async function fakeStreamMessage(fullMessage: string, element: HTMLElement): Promise<void> {
  const words = fullMessage.split(/\s+/);
  let current = "";

  for (let i = 0; i < words.length; i++) {
    current += (i === 0 ? "" : " ") + words[i];
    element.innerHTML = parseMarkdown(current);
    await delay(Math.floor(Math.random() * 20) + 10);
  }
}
