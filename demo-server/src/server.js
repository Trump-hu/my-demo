import createApp from './app.js';
import sequelize from './models/index.js';
import { env, dbConfig } from './config/index.js';

async function start() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log(`[db] MySQL 连接成功: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

    // 可选：同步模型（开发环境可通过 DB_SYNC=true 开启）
    if (dbConfig.sync) {
      await sequelize.sync({ alter: env.isDev });
      console.log('[db] 模型已同步到数据库');
    }

    const app = createApp();
    app.listen(env.port, () => {
      console.log(`[server] 服务已启动: http://localhost:${env.port} (env=${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('[server] 启动失败:', err.message);
    process.exit(1);
  }
}

start();
