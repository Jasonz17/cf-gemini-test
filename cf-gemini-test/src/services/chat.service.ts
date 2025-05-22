import { ChatRepository } from '../database/repositories/chat.repository.ts';
import { MessageRepository } from '../database/repositories/message.repository.ts';
import { AIService } from './ai.service.ts';

export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private messageRepository: MessageRepository,
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
    const userMessage = {
      message_id: crypto.randomUUID(),
      chat_id: chatId,
      role: 'user',
      content: { text: message },
      created_at: new Date(),
      tokens: message.length
    };
    await this.messageRepository.createMessage(userMessage);

    const response = await this.aiService.generateResponse(message);
    
    const modelMessage = {
      message_id: crypto.randomUUID(),
      chat_id: chatId,
      role: 'model',
      content: { text: response },
      created_at: new Date(),
      tokens: response.length
    };
    await this.messageRepository.createMessage(modelMessage);
    return response;
  }
}
