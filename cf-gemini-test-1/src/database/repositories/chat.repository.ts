import { Client } from "../client.ts";
import { Chat } from "../models/chat.ts";

export class ChatRepository {
  constructor(private client: Client) {}

  async createChat(chat: Omit<Chat, 'created_at'>): Promise<Chat> {
    const result = await this.client.queryObject<Chat>({
      text: `
        INSERT INTO chats (chat_id, user_id, title, model_used, total_tokens)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      args: [
        chat.chat_id,
        chat.user_id,
        chat.title,
        chat.model_used,
        chat.total_tokens
      ]
    });
    return result.rows[0];
  }

  async getChatById(chatId: string): Promise<Chat | undefined> {
    const result = await this.client.queryObject<Chat>({
      text: 'SELECT * FROM chats WHERE chat_id = $1',
      args: [chatId]
    });
    return result.rows[0];
  }

  async updateChatTitle(chatId: string, title: string): Promise<void> {
    await this.client.queryObject({
      text: 'UPDATE chats SET title = $1 WHERE chat_id = $2',
      args: [title, chatId]
    });
  }

  async listChatsByUser(userId: string): Promise<Chat[]> {
    const result = await this.client.queryObject<Chat>({
      text: 'SELECT * FROM chats WHERE user_id = $1 ORDER BY created_at DESC',
      args: [userId]
    });
    return result.rows;
  }
}