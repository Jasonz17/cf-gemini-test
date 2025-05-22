import { Client } from "jsr:@db/postgres";

// 数据库配置（建议后续迁移到环境变量）
export const DB_CONFIG = {
  user: "neondb_owner",
  password: "npg_zMNKkv16wYiT",
  hostname: "ep-polished-brook-a16oqjtd-pooler.ap-southeast-1.aws.neon.tech",
  port: 5432,
  database: "neondb",
  ssl: true
};

// 创建全局客户端实例
export const client = new Client(DB_CONFIG);