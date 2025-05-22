export interface Message {
  message_id: string;
  chat_id: string;
  role: 'user' | 'model';
  content: {
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string;
    };
  };
  created_at: Date;
  tokens: number;
}