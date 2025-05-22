// main.ts
import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { client } from "./database/client.ts";
import { ChatRepository } from "./database/repositories/chat.repository.ts";
import { MessageRepository } from "./database/repositories/message.repository.ts";
import { ChatService } from "./services/chat.service.ts";
import { AIService } from "./services/ai.service.ts"; // 导入 AIService

// 初始化数据库连接
await client.connect();

// 创建服务实例
const chatRepository = new ChatRepository(client);
const messageRepository = new MessageRepository(client);

// 核心改动：AIService 构造函数不再接收 API 密钥，或者接收一个可选参数。
// 假设 AIService 现在可以不带参数构造，或者带一个 null/undefined。
// 更常见的模式是，AIService 内部的 AI 客户端是懒加载的，或者在方法中接收 API Key。
const aiService = new AIService(); // <-- 重要改动：不再传递 Deno.env.get("GEMINI_API_KEY")
const chatService = new ChatService(chatRepository, messageRepository, aiService);

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
    // 从请求体中获取 message 和 apikey
    const { message, apikey } = await ctx.request.body().value; // <-- 从请求体中获取 apikey！
    if (!apikey) {
      ctx.response.status = 400;
      ctx.response.body = { error: "API key is required." };
      return;
    }
    // 将 apikey 传递给 chatService.processMessage
    const response = await chatService.processMessage(chatId, message, apikey);
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
app.addEventListener("close", async () => {
  await client.end();
});
