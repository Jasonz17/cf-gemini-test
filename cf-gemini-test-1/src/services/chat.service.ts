// services/chat.service.ts
import { ChatRepository } from "../database/repositories/chat.repository.ts";
import { MessageRepository } from "../database/repositories/message.repository.ts";
import { AIService } from "./ai.service.ts"; // 导入 AIService

export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private messageRepository: MessageRepository,
    private aiService: AIService // aiService 实例在这里
  ) {}

  // ... createNewChat 方法保持不变 ...

  // 核心改动：processMessage 方法现在接收 apikey
  async processMessage(chatId: string, userMessage: string, apikey: string): Promise<any> {
    // 1. 获取聊天历史
    const chatHistory = await this.messageRepository.getChatHistory(chatId);

    // 2. 将用户消息添加到历史记录 (如果需要，可在这里创建消息ID和时间戳)
    // 假设 Message 模型有 message_id, chat_id, content, role, created_at
    const newUserMessage = {
      message_id: crypto.randomUUID(), // Deno 内置的 crypto.randomUUID()
      chat_id: chatId,
      content: userMessage,
      role: 'user',
      created_at: new Date()
    };
    await this.messageRepository.createMessage(newUserMessage);

    // 3. 调用 AI 服务生成响应，并将 apikey 传递过去
    // AIService 应该有一个方法来接受消息历史和 apikey
    const aiResponseContent = await this.aiService.generateAIResponse(
      chatHistory.map(msg => ({ role: msg.role, content: msg.content })), // 传递 AI 服务所需的格式
      userMessage,
      apikey // <-- 将 apikey 传递给 AIService
    );

    // 4. 将 AI 响应添加到历史记录
    const newAiMessage = {
      message_id: crypto.randomUUID(),
      chat_id: chatId,
      content: aiResponseContent,
      role: 'model',
      created_at: new Date()
    };
    await this.messageRepository.createMessage(newAiMessage);

    // 5. 返回 AI 响应
    return aiResponseContent;
  }
}
