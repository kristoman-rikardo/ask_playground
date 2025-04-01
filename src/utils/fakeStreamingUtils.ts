
/**
 * Utility for simulating character-by-character streaming for complete text messages
 */

/**
 * Streams text character by character with a fade-in animation
 * 
 * @param fullText The complete text to stream
 * @param onUpdate Callback function to update UI with each change
 * @param onComplete Callback function when streaming is complete
 * @param delay Optional delay between characters (default: 30ms)
 */
export const streamWords = (
  fullText: string,
  onUpdate: (text: string) => void,
  onComplete: () => void,
  delay: number = 30
): void => {
  let index = 0;
  let currentDisplay = '';

  const appendNextChar = () => {
    if (index < fullText.length) {
      const char = fullText[index];
      
      // Add the next character with fade-in class
      currentDisplay += `<span class="char-fade-in">${escapeHtml(char)}</span>`;
      
      onUpdate(currentDisplay);
      index++;
      
      // Schedule next update with fixed delay
      setTimeout(appendNextChar, delay);
    } else {
      // We're done, call the completion callback
      onComplete();
    }
  };

  // Escape HTML special characters to prevent issues with dangerouslySetInnerHTML
  function escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
  }

  // Start the streaming process immediately
  appendNextChar();
};
