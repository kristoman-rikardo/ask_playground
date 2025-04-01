
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
  private formattedOutput: string = ''; // Store the formatted output with fade-in spans
  private nextCharIndex: number = 0;
  private isProcessing: boolean = false;
  private charDelay: number = 30; // 30ms delay between characters
  
  /**
   * Updates the buffer with new content and processes characters at a consistent rate
   * 
   * @param newContent New content to append to the buffer
   * @returns Object containing processed text, formatted output with spans
   */
  appendContent(newContent: string): { 
    processedText: string, 
    formattedOutput: string,
  } {
    // Add new content to the buffer
    this.currentBuffer += newContent;
    
    // Start processing if not already doing so
    if (!this.isProcessing) {
      this.processNextChar();
    }
    
    return { 
      processedText: this.processedText, 
      formattedOutput: this.formattedOutput,
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
      
      // Add to formatted output with fade-in span
      this.formattedOutput += `<span class="char-fade-in">${this.escapeHtml(char)}</span>`;
      
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
   * Escape HTML special characters to prevent issues with dangerouslySetInnerHTML
   */
  private escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
  }

  /**
   * Finalizes the buffer, processing any remaining content immediately
   * 
   * @returns Object containing the complete processed text and formatted output
   */
  finalize(): { text: string, formattedOutput: string } {
    // Process any remaining characters in the buffer immediately
    if (this.nextCharIndex < this.currentBuffer.length) {
      const remaining = this.currentBuffer.substring(this.nextCharIndex);
      this.processedText += remaining;
      
      // Add remaining chars with fade-in spans
      for (let i = 0; i < remaining.length; i++) {
        this.formattedOutput += `<span class="char-fade-in">${this.escapeHtml(remaining[i])}</span>`;
      }
      
      this.nextCharIndex = this.currentBuffer.length;
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
    return this.currentBuffer;
  }

  /**
   * Resets the tracker state
   */
  reset(): void {
    this.processedText = '';
    this.currentBuffer = '';
    this.formattedOutput = '';
    this.nextCharIndex = 0;
    this.isProcessing = false;
  }
}
