
/**
 * Utilities for handling real-time character-by-character streaming
 */

/**
 * Tracks characters for real-time streaming with consistent timing
 * Used for real-time streaming scenarios
 */
export class StreamingWordTracker {
  private processedText: string = '';
  private currentBuffer: string = '';
  private nextCharIndex: number = 0;
  private isProcessing: boolean = false;
  private charDelay: number = 30; // 30ms delay between characters
  
  /**
   * Updates the buffer with new content and processes characters at a consistent rate
   * 
   * @param newContent New content to append to the buffer
   * @returns Object containing processed text
   */
  appendContent(newContent: string): { 
    processedText: string
  } {
    // Add new content to the buffer
    this.currentBuffer += newContent;
    
    // Start processing if not already doing so
    if (!this.isProcessing) {
      this.processNextChar();
    }
    
    return { 
      processedText: this.processedText
    };
  }
  
  /**
   * Process the next character with a delay
   */
  private processNextChar(): void {
    this.isProcessing = true;
    
    // If we have characters to process
    if (this.nextCharIndex < this.currentBuffer.length) {
      const char = this.currentBuffer.charAt(this.nextCharIndex);
      
      // Add to processed text
      this.processedText += char;
      
      // Move to next character
      this.nextCharIndex++;
      
      // Schedule next character processing
      setTimeout(() => {
        this.processNextChar();
      }, this.charDelay);
    } else {
      // No more characters to process at the moment
      this.isProcessing = false;
    }
  }

  /**
   * Finalizes the buffer, processing any remaining content immediately
   * 
   * @returns Object containing the complete processed text
   */
  finalize(): { text: string } {
    // Instead of immediately processing remaining characters,
    // we'll queue them for processing at the regular rate
    if (this.nextCharIndex < this.currentBuffer.length && !this.isProcessing) {
      this.processNextChar();
    }
    
    return { 
      text: this.processedText
    };
  }

  /**
   * Force complete all text immediately (bypass streaming)
   * 
   * @returns Complete text
   */
  forceComplete(): string {
    const remaining = this.currentBuffer.substring(this.nextCharIndex);
    this.processedText += remaining;
    this.nextCharIndex = this.currentBuffer.length;
    this.isProcessing = false;
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
    return this.currentBuffer;
  }

  /**
   * Checks if streaming is complete
   * 
   * @returns Boolean indicating if all content has been processed
   */
  isStreamingComplete(): boolean {
    return this.nextCharIndex >= this.currentBuffer.length && !this.isProcessing;
  }

  /**
   * Resets the tracker state
   */
  reset(): void {
    this.processedText = '';
    this.currentBuffer = '';
    this.nextCharIndex = 0;
    this.isProcessing = false;
  }
}
