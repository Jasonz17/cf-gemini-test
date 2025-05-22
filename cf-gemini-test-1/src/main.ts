import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { client } from "./database/client.ts";
import { ChatRepository } from "./database/repositories/chat.repository.ts";
import { MessageRepository } from "./database/repositories/message.repository.ts";
import { ChatService } from "./services/chat.service.ts";
import { AIService } from "./services/ai.service.ts";

console.log("main.ts: Starting execution...");
console.log("main.ts: Type of imported client:", typeof client);
console.log("main.ts: Imported client object:", client); // 打印导入的 client 变量的值

// 初始化数据库连接
if (!client) {
  console.error("main.ts: Error: client is undefined or null before connect. Exiting.");
  Deno.exit(1); // 或者抛出错误，以便部署失败
}
await client.connect();
console.log("main.ts: Database connected.");

// ... (rest of your main.ts code)
