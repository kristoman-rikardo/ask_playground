
/**
 * Utility for simulating word-by-word streaming for complete text messages
 */

/**
 * Streams text word by word with a fade-in animation
 * 
 * @param fullText The complete text to stream
 * @param onUpdate Callback function to update UI with each change
 * @param onComplete Callback function when streaming is complete
 * @param minDelay Optional minimum delay between words (default: 5ms)
 * @param maxDelay Optional maximum delay between words (default: 30ms)
 */
export const streamWords = (
  fullText: string,
  onUpdate: (text: string) => void,
  onComplete: () => void,
  minDelay: number = 5,
  maxDelay: number = 30
): void => {
  const words = fullText.split(/(\s+)/); // Split by whitespace but keep separators
  let index = 0;
  let currentDisplay = '';

  const appendNextWord = () => {
    if (index < words.length) {
      // Get the current word (could be actual word or whitespace)
      const word = words[index];
      
      if (word.trim()) {
        // This is an actual word, wrap it with fade-in class
        currentDisplay += `<span class="word-fade-in">${word}</span>`;
      } else {
        // This is whitespace, add it directly
        currentDisplay += word;
      }
      
      onUpdate(currentDisplay);
      index++;
      
      // Schedule next update with a random delay in the specified range
      const randomDelay = minDelay + Math.random() * (maxDelay - minDelay);
      setTimeout(appendNextWord, randomDelay);
    } else {
      // When complete, provide the raw text without spans for cleaner final state
      onComplete();
    }
  };

  // Start the streaming process
  appendNextWord();
};
