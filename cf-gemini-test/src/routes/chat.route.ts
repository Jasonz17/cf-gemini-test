import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { ChatService } from "../services/chat.service.ts";

type CreateChatRequest = {
  userId: string;
};

type SendMessageRequest = {
  message: string;
};

export function createChatRoutes(router: Router, chatService: ChatService) {
  router
    .post('/chats', async (ctx) => {
      try {
        const body = await ctx.request.body().value as CreateChatRequest;
        const newChat = await chatService.createNewChat(body.userId);
        ctx.response.status = 201;
        ctx.response.body = newChat;
      } catch (error) {
        ctx.response.status = 500;
        ctx.response.body = { error: '创建对话失败' };
      }
    })
    .post('/chats/:chatId/messages', async (ctx) => {
      try {
        const { chatId } = ctx.params;
        const body = await ctx.request.body().value as SendMessageRequest;
        const response = await chatService.processMessage(chatId, body.message);
        ctx.response.body = { response };
      } catch (error) {
        ctx.response.status = 500;
        ctx.response.body = { error: '处理消息失败' };
      }
    });
}