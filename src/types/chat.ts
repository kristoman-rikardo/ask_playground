export interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  isPartial?: boolean;
  transcriptId?: string;
}

export interface Button {
  name: string;
  request: {
    type?: string;
    payload?: {
      actions?: Array<{
        type: string;
        payload?: {
          url?: string;
          [key: string]: any;
        };
        [key: string]: any;
      }>;
      [key: string]: any;
    };
    [key: string]: any;
  };
}
