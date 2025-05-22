export interface Chat {
  chat_id: string;
  created_at: Date;
  user_id?: string;
  title?: string;
  model_used: string;
  total_tokens: number;
}