import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  isDev: (process.env.NODE_ENV || 'development') === 'development',
};

export const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'demo_server',
  dialect: process.env.DB_DIALECT || 'mysql',
  sync: (process.env.DB_SYNC || 'false').toLowerCase() === 'true',
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'change_me_please',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

export const uploadConfig = {
  // 文件存储根目录（分片临时目录 tmp/<hash>，合并结果 files/<hash>）
  dir: path.resolve(process.env.UPLOAD_DIR || 'uploads'),
  // 单个文件大小上限，默认 1GB
  maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE, 10) || 1024 * 1024 * 1024,
  // 单个分片大小上限，默认 100MB
  maxChunkSize: parseInt(process.env.UPLOAD_MAX_CHUNK_SIZE, 10) || 100 * 1024 * 1024,
};
