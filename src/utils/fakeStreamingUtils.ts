
/**
 * Utility for simulating character-by-character streaming for complete text messages
 */

/**
 * Streams text character by character
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
      
      // Add the next character
      currentDisplay += char;
      
      onUpdate(currentDisplay);
      index++;
      
      // Schedule next update with consistent 30ms delay
      setTimeout(appendNextChar, delay);
    } else {
      // We're done, call the completion callback
      onComplete();
    }
  };

  // Start the streaming process immediately
  appendNextChar();
};
