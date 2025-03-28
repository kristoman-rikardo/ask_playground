
/**
 * Streams text word by word with a fade-in animation
 * 
 * @param fullText The complete text to stream
 * @param onUpdate Callback function to update UI with each change
 * @param onComplete Callback function when streaming is complete
 * @param wordDelay Optional delay between words (default: 50ms)
 */
export const streamWords = (
  fullText: string,
  onUpdate: (text: string) => void,
  onComplete: () => void,
  wordDelay: number = 50
): void => {
  const words = fullText.split(' ');
  let index = 0;
  let currentDisplay = '';

  const appendNextWord = () => {
    if (index < words.length) {
      // Append next word plus a space
      const word = words[index];
      // Don't add spaces at the beginning
      const separator = currentDisplay.length > 0 ? ' ' : '';
      // Wrap new word with span and fade-in class
      currentDisplay += `${separator}<span class="word-fade-in">${word}</span>`;
      onUpdate(currentDisplay);
      index++;
      // Schedule next update with the specified delay
      setTimeout(appendNextWord, wordDelay);
    } else {
      // When complete, provide the raw text without spans for cleaner final state
      onComplete();
    }
  };

  // Start the streaming process
  appendNextWord();
};

/**
 * Tracks already processed words to avoid re-animating them
 * Used for real-time streaming scenarios
 */
export class StreamingWordTracker {
  private processedText: string = '';
  private currentBuffer: string = '';
  private lastProcessedIndex: number = 0;

  /**
   * Updates the buffer with new content and returns any new complete words
   * 
   * @param newContent New content to append to the buffer
   * @returns Object containing processed text and any new complete words
   */
  appendContent(newContent: string): { processedText: string, newCompleteWords: string } {
    this.currentBuffer += newContent;
    
    // Find complete words (ending with spaces)
    const lastSpaceIndex = this.currentBuffer.lastIndexOf(' ');
    
    // If we have complete words, process them
    if (lastSpaceIndex > this.lastProcessedIndex) {
      const newWords = this.currentBuffer.substring(this.lastProcessedIndex, lastSpaceIndex + 1);
      this.processedText += newWords;
      this.lastProcessedIndex = lastSpaceIndex + 1;
      return { processedText: this.processedText, newCompleteWords: newWords };
    }
    
    return { processedText: this.processedText, newCompleteWords: '' };
  }

  /**
   * Finalizes the buffer, processing any remaining content
   * 
   * @returns The complete processed text
   */
  finalize(): string {
    if (this.lastProcessedIndex < this.currentBuffer.length) {
      this.processedText += this.currentBuffer.substring(this.lastProcessedIndex);
    }
    return this.processedText;
  }

  /**
   * Gets the current state of the processed text
   * 
   * @returns Current processed text
   */
  getCurrentProcessedText(): string {
    return this.processedText;
  }

  /**
   * Gets the complete text (processed + buffer)
   * 
   * @returns Complete text
   */
  getCompleteText(): string {
    return this.processedText + this.currentBuffer.substring(this.lastProcessedIndex);
  }

  /**
   * Resets the tracker state
   */
  reset(): void {
    this.processedText = '';
    this.currentBuffer = '';
    this.lastProcessedIndex = 0;
  }
}
