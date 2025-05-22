import { ChatRepository } from '../database/repositories/chat.repository.ts';
import { AIService } from './ai.service.ts';

export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private aiService: AIService
  ) {}

  async createNewChat(userId: string) {
    const newChat = {
      chat_id: crypto.randomUUID(),
      user_id: userId,
      title: '新对话',
      model_used: 'gemini-2.0-flash',
      total_tokens: 0
    };

    return await this.chatRepository.createChat(newChat);
  }

  async processMessage(chatId: string, message: string) {
    const response = await this.aiService.generateResponse(message);
    // TODO: 实现消息存储逻辑
    return response;
  }
}