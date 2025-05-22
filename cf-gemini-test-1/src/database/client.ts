// 推荐加上明确的版本号，例如 0.19.5
import { Client } from "jsr:@db/postgres@0.19.5";

export const DB_CONFIG = {
  user: "neondb_owner",
  password: "npg_zMNKkv16wYiT",
  hostname: "ep-polished-brook-a16oqjtd-pooler.ap-southeast-1.aws.neon.tech",
  port: 5432,
  database: "neondb",
  ssl: true
};

console.log("client.ts: Starting execution...");
console.log("client.ts: Type of Client from @db/postgres:", typeof Client);

let clientInstance;
try {
  clientInstance = new Client(DB_CONFIG);
  console.log("client.ts: Client instance created successfully.");
  console.log("client.ts: Client instance object:", clientInstance); // 打印实例本身
} catch (e) {
  console.error("client.ts: Error creating Client instance:", e);
  // 这一步非常重要，它会捕获 Client 构造函数中可能发生的任何错误
}

// 确保我们导出的是创建的实例，即使它可能是 undefined 如果出错
export const client = clientInstance;

console.log("client.ts: Finished execution. Exported client type:", typeof client);
