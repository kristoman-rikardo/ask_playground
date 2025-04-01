
/**
 * Utility for simulating character-by-character streaming for complete text messages
 */

/**
 * Streams text character by character
 * 
 * @param fullText The complete text to stream
 * @param onUpdate Callback function to update UI with each change
 * @param onComplete Callback function when streaming is complete
 * @param delay Optional delay between characters (default: 5ms)
 */
export const streamWords = (
  fullText: string,
  onUpdate: (text: string) => void,
  onComplete: () => void,
  delay: number = 5
): void => {
  let index = 0;
  let currentDisplay = '';

  // Start with an empty string and immediately begin streaming
  onUpdate('');
  
  console.log(`🔄 Starting fake streaming of ${fullText.length} characters`);

  const appendNextChar = () => {
    if (index < fullText.length) {
      const char = fullText[index];
      
      // Add the next character
      currentDisplay += char;
      
      onUpdate(currentDisplay);
      index++;
      
      // Schedule next update with 5ms delay (same as real-time streaming)
      setTimeout(appendNextChar, delay);
    } else {
      // We're done, call the completion callback
      console.log(`✅ Completed fake streaming of ${fullText.length} characters`);
      onComplete();
    }
  };

  // Start the streaming process immediately
  appendNextChar();
};
