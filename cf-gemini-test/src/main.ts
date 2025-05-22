import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { Client } from "./database/client.ts";
import { ChatRepository } from "../database/repositories/chat.repository.ts";
import { ChatService } from "./services/chat.service.ts";
import { AIService } from "./services/ai.service.ts";

// 初始化数据库连接
const client = new Client({
  connectionString: Deno.env.get("DATABASE_URL"),
});
await client.connect();

// 创建服务实例
const chatRepository = new ChatRepository(client);
const aiService = new AIService(Deno.env.get("GEMINI_API_KEY"));
const chatService = new ChatService(chatRepository, aiService);

// 创建路由
const router = new Router();
router
  .post("/chats", async (ctx) => {
    const userId = "temp_user_id"; // 需要替换为真实用户ID
    const newChat = await chatService.createNewChat(userId);
    ctx.response.body = newChat;
  })
  .post("/chats/:chatId/messages", async (ctx) => {
    const chatId = ctx.params.chatId;
    const { message } = await ctx.request.body().value;
    const response = await chatService.processMessage(chatId, message);
    ctx.response.body = { response };
  });

// 启动服务
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

const port = 8000;
console.log(`Server running on port ${port}`);
await app.listen({ port });

// 关闭数据库连接
app.addEventListener("close", () => {
  client.end();
});
