// main.ts
import { Application } from "jsr:@oak/oak/application";
// import { Router } from "jsr:@oak/oak/router"; // 注释掉
// import { client } from "./database/client.ts"; // 注释掉
// ... 其他服务和仓库导入都注释掉 ...

// 初始化数据库连接 (先注释掉)
// await client.connect();

// 创建服务实例 (注释掉)
// const chatRepository = new ChatRepository(client);
// ...

// 创建路由 (注释掉或只保留一个简单路由)
const app = new Application();
// const router = new Router();
// router.get("/", (ctx) => { ctx.response.body = "Hello from Deno Deploy!"; });
// app.use(router.routes());
// app.use(router.allowedMethods());

// 启动服务
const port = 8000;
console.log(`Server running on port ${port}`); // 应该能看到这个日志
await app.listen({ port });

// 关闭数据库连接 (注释掉)
// app.addEventListener("close", async () => {
//   await client.end();
// });
