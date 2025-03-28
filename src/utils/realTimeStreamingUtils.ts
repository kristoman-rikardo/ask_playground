
/**
 * Utilities for handling real-time token-by-token streaming
 */

/**
 * Tracks already processed words to avoid re-animating them
 * Used for real-time streaming scenarios
 */
export class StreamingWordTracker {
  private processedText: string = '';
  private currentBuffer: string = '';
  private lastProcessedIndex: number = 0;
  private formattedOutput: string = ''; // Store the formatted output with fade-in spans
  private firstWordProcessed: boolean = false;
  private lastProcessTime: number = 0;
  
  // Minimum delay between processing words (ms) - similar to fake streaming
  private MIN_WORD_DELAY: number = 5;
  private MAX_WORD_DELAY: number = 30;

  /**
   * Updates the buffer with new content and returns any new complete words
   * 
   * @param newContent New content to append to the buffer
   * @returns Object containing processed text, formatted output with spans, and newCompleteWords
   */
  appendContent(newContent: string): { 
    processedText: string, 
    formattedOutput: string,
    newCompleteWords: string 
  } {
    this.currentBuffer += newContent;
    
    // Find word boundaries (space, punctuation followed by space, etc.)
    const wordBoundaryRegex = /(\s+|[.,!?;:]\s*)/g;
    let match;
    let lastIndex = 0;
    let newWords = '';
    let newFormattedWords = '';
    
    // Reset regex state
    wordBoundaryRegex.lastIndex = this.lastProcessedIndex;
    
    // Process first word immediately, then apply delays for subsequent words
    const now = Date.now();
    const shouldDelay = this.firstWordProcessed && 
                       (now - this.lastProcessTime < this.getRandomDelay());
    
    if (!shouldDelay) {
      while ((match = wordBoundaryRegex.exec(this.currentBuffer)) !== null) {
        if (match.index >= this.lastProcessedIndex) {
          // Extract the word before this boundary
          const word = this.currentBuffer.substring(this.lastProcessedIndex, match.index);
          if (word) {
            // Add to processed text and new words
            this.processedText += word + match[0];
            newWords += word + match[0];
            
            // Add to formatted output with fade-in span (ensuring proper HTML)
            this.formattedOutput += `<span class="word-fade-in">${word}</span>${match[0]}`;
            newFormattedWords += `<span class="word-fade-in">${word}</span>${match[0]}`;
            
            // Mark that we've processed at least one word
            this.firstWordProcessed = true;
          } else {
            // Just a boundary with no preceding word
            this.processedText += match[0];
            newWords += match[0];
            this.formattedOutput += match[0];
            newFormattedWords += match[0];
          }
          
          // Update last processed index to after this match
          this.lastProcessedIndex = match.index + match[0].length;
          lastIndex = this.lastProcessedIndex;
          
          // Update the last process time
          this.lastProcessTime = now;
        }
      }
    }
    
    return { 
      processedText: this.processedText, 
      formattedOutput: this.formattedOutput,
      newCompleteWords: newWords 
    };
  }

  /**
   * Get a random delay between min and max values
   */
  private getRandomDelay(): number {
    return this.MIN_WORD_DELAY + 
           Math.random() * (this.MAX_WORD_DELAY - this.MIN_WORD_DELAY);
  }

  /**
   * Finalizes the buffer, processing any remaining content
   * 
   * @returns Object containing the complete processed text and formatted output
   */
  finalize(): { text: string, formattedOutput: string } {
    if (this.lastProcessedIndex < this.currentBuffer.length) {
      const remaining = this.currentBuffer.substring(this.lastProcessedIndex);
      this.processedText += remaining;
      this.formattedOutput += `<span class="word-fade-in">${remaining}</span>`;
    }
    return { 
      text: this.processedText,
      formattedOutput: this.formattedOutput
    };
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
   * Gets the formatted output with fade-in spans
   * 
   * @returns Formatted output
   */
  getFormattedOutput(): string {
    return this.formattedOutput;
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
    this.formattedOutput = '';
    this.firstWordProcessed = false;
    this.lastProcessTime = 0;
  }
}
