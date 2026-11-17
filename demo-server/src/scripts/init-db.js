/**
 * 数据库初始化脚本
 * 用法: npm run db:init
 * 说明: 自动创建数据库(若不存在) + 同步所有模型表结构
 */
import mysql from 'mysql2/promise';
import sequelize from '../models/index.js';
import { dbConfig } from '../config/index.js';

// 导入所有模型，确保 sequelize.sync 能同步全部表
import '../models/user.model.js';
import '../models/process.model.js';
import '../models/robot.model.js';
import '../models/task.model.js';
import '../models/record.model.js';
import '../models/role.model.js';

async function ensureDatabase() {
  const conn = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
  });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log(`[db:init] 数据库已就绪: ${dbConfig.database}`);
  await conn.end();
}

async function run() {
  try {
    await ensureDatabase();
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('[db:init] 所有模型已同步');
    process.exit(0);
  } catch (err) {
    console.error('[db:init] 失败:', err.message);
    process.exit(1);
  }
}

run();
