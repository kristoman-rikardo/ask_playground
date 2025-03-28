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
  // Split text into words but keep separators
  const words = fullText.split(/(\s+|[.,!?;:]\s*)/g).filter(word => word);
  let index = 0;
  let currentDisplay = '';

  const appendNextWord = () => {
    if (index < words.length) {
      const word = words[index];
      
      // Check if the current segment is a word or whitespace/punctuation
      if (word.trim()) {
        // This is an actual word, wrap it with fade-in class
        currentDisplay += `<span class="word-fade-in">${word}</span>`;
      } else {
        // This is whitespace or punctuation, add it directly
        currentDisplay += word;
      }
      
      onUpdate(currentDisplay);
      index++;
      
      // Schedule next update with a random delay in the specified range
      const randomDelay = minDelay + Math.random() * (maxDelay - minDelay);
      setTimeout(appendNextWord, randomDelay);
    } else {
      // We're done, call the completion callback
      onComplete();
    }
  };

  // Start the streaming process immediately
  appendNextWord();
};
