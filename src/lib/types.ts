export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  choices?: any[];
  transcriptId?: string;
} 