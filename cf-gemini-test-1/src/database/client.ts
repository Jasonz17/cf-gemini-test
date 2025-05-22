// --- START OF FILE client.ts ---
// 将这一行：
// import { Client } from "jsr:@db/postgres";
// 更改为：
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts"; // 使用最新的稳定版本，目前是 v0.17.0

// 数据库配置（建议后续迁移到环境变量）
const DB_CONFIG = {
  user: "neondb_owner",
  password: "npg_zMNKkv16wYiT",
  hostname: "ep-polished-brook-a16oqjtd-pooler.ap-southeast-1.aws.neon.tech",
  port: 5432,
  database: "neondb",
  ssl: true
};

let clientInstance: Client | null = null; // 使用更清晰的名称，并初始化为 null

// 连接数据库
async function connectDB() {
  if (clientInstance) {
    console.log("数据库已连接或正在连接，跳过重复连接");
    return;
  }

  try {
    // 在 connectDB 函数内部实例化 Client
    clientInstance = new Client(DB_CONFIG);
    await clientInstance.connect();
    console.log("成功连接到 PostgreSQL 数据库");
  } catch (error) {
    console.error("数据库连接失败:", error);
    clientInstance = null; // 连接失败时重置实例
    throw error;
  }
}

// 断开数据库连接
async function disconnectDB() {
  if (clientInstance) {
    try {
      await clientInstance.end();
      console.log("数据库连接已关闭");
    } catch (error) {
      console.error("断开数据库连接时出错:", error);
    } finally {
      clientInstance = null; // 清除实例引用
    }
  }
}

// 提供一个获取 client 实例的函数
function getClient(): Client {
  if (!clientInstance) {
    throw new Error("数据库客户端未连接或初始化！请先调用 connectDB。");
  }
  return clientInstance;
}

export { getClient, connectDB, disconnectDB, DB_CONFIG };
// --- END OF FILE client.ts ---
