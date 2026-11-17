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
