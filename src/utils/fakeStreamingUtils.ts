
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

  // Start with an empty string
  onUpdate('');
  
  console.log(`🔄 Starting fake streaming of ${fullText.length} characters`);

  // Function to add one character at a time
  const appendNextChar = () => {
    if (index < fullText.length) {
      // Get the next character
      const char = fullText[index];
      
      // Add the character to our current display text
      currentDisplay += char;
      
      // Update the UI with the new character
      onUpdate(currentDisplay);
      
      // Move to the next character
      index++;
      
      // Schedule the next character after exactly 5ms
      setTimeout(appendNextChar, delay);
    } else {
      // We're done, call the completion callback
      console.log(`✅ Completed fake streaming of ${fullText.length} characters`);
      onComplete();
    }
  };

  // Start the streaming process immediately with the first character
  appendNextChar();
};
