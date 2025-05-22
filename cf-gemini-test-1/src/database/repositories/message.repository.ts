import { Client } from "jsr:@db/postgres";
import { Message } from "../models/message.ts";

export class MessageRepository {
  constructor(private client: Client) {}

  async createMessage(message: Message) {
    await this.client.queryObject`
      INSERT INTO messages (
        message_id, chat_id, content, role, created_at
      ) VALUES (
        ${message.message_id}, 
        ${message.chat_id}, 
        ${message.content}, 
        ${message.role}, 
        ${message.created_at}
      )
    `;
  }

  async getChatHistory(chatId: string) {
    const result = await this.client.queryObject<Message>`
      SELECT * FROM messages 
      WHERE chat_id = ${chatId}
      ORDER BY created_at ASC
    `;
    return result.rows;
  }
}