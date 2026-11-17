import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/index.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

function createApp() {
  const app = express();

  // 安全 & 基础中间件
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '30mb' })); // 图片合成保存时配置中含 base64 图片，需要更大的请求体上限
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 日志
  app.use(morgan(env.isDev ? 'dev' : 'combined'));

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 业务路由
  app.use('/api', routes);

  // 404 & 错误处理
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
