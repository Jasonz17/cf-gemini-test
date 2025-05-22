import { Client } from "jsr:@db/postgres";

// 数据库配置（建议后续迁移到环境变量）
const DB_CONFIG = {
  user: "neondb_owner",
  password: "npg_zMNKkv16wYiT",
  hostname: "ep-polished-brook-a16oqjtd-pooler.ap-southeast-1.aws.neon.tech",
  port: 5432,
  database: "neondb",
  ssl: true
};

// 连接数据库
async function connectDB() {
  // 创建数据库客户端实例
  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    console.log("成功连接到 PostgreSQL 数据库");
  } catch (error) {
    console.error("数据库连接失败:", error);
    throw error;
  }
  return client;
}

// 断开数据库连接
async function disconnectDB() {
  try {
    await client.end();
    console.log("数据库连接已关闭");
  } catch (error) {
    console.error("断开数据库连接时出错:", error);
    throw error;
  }
}

export { connectDB, disconnectDB, DB_CONFIG };
