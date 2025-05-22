// 调试路径信息
console.log("当前工作目录:", Deno.cwd());

// 打印 client.ts 的绝对路径
const clientFilePath = new URL("./database/client.ts", import.meta.url).pathname;
console.log("尝试访问的 client.ts 绝对路径:", clientFilePath);

// 检查文件是否存在
async function checkFileExists(path: string) {
  try {
    await Deno.stat(path);
    return true;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return false;
    }
    throw err;
  }
}

// 验证 client.ts 是否存在
checkFileExists(clientFilePath).then(exists => {
  console.log(`client.ts 文件是否存在: ${exists}`);
}).catch(err => {
  console.error("检查文件时出错:", err);
});

// 继续原有代码...
import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
// 其他导入语句...

import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { client } from "/cf-gemini-test/src/database/client.ts";
import { ChatRepository } from "/database/repositories/chat.repository.ts";
import { MessageRepository } from "/database/repositories/message.repository.ts";
import { ChatService } from "/services/chat.service.ts";
import { AIService } from "/services/ai.service.ts";

// 初始化数据库连接
const client = new Client({
  connectionString: Deno.env.get("DATABASE_URL"),
});
await client.connect();

// 创建服务实例
const chatRepository = new ChatRepository(client);
const messageRepository = new MessageRepository(client);
const aiService = new AIService(Deno.env.get("GEMINI_API_KEY"));
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
