import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import processRoutes from './process.routes.js';
import robotRoutes from './robot.routes.js';
import taskRoutes from './task.routes.js';
import recordRoutes from './record.routes.js';
import roleRoutes from './role.routes.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    name: 'demo-server API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/login',
        userInfo: 'GET /api/userInfo (需登录)',
        logout: 'POST /api/logout (需登录)',
      },
      user: {
        list: 'GET /api/user/list (需登录)',
        save: 'POST /api/user/save (需登录)',
        delete: 'DELETE /api/user/delete/:id (需登录)',
        resetPassword: 'PUT /api/user/resetPassword/:id (需登录)',
      },
      process: {
        list: 'GET /api/process/list (需登录)',
        detail: 'GET /api/process/detail/:id (需登录)',
        save: 'POST /api/process/save (需登录)',
        delete: 'DELETE /api/process/delete/:id (需登录)',
        monitor: 'GET /api/process/monitor/:id (需登录)',
        efficiency: 'GET /api/process/efficiency/:id (需登录)',
      },
      robot: {
        list: 'GET /api/robot/list (需登录)',
        save: 'POST /api/robot/save (需登录)',
        delete: 'DELETE /api/robot/delete/:id (需登录)',
      },
      task: {
        list: 'GET /api/task/list (需登录)',
        save: 'POST /api/task/save (需登录)',
        delete: 'DELETE /api/task/delete/:id (需登录)',
        start: 'POST /api/task/start/:id (需登录)',
        stop: 'POST /api/task/stop/:id (需登录)',
      },
      record: {
        list: 'GET /api/record/list (需登录)',
      },
      role: {
        list: 'GET /api/role/list (需登录)',
        options: 'GET /api/role/options (需登录)',
        save: 'POST /api/role/save (需登录)',
        delete: 'DELETE /api/role/delete/:id (需登录)',
        permissionTree: 'GET /api/role/permissionTree (需登录)',
      },
      health: 'GET /health',
    },
  });
});

// 挂载业务路由
router.use('/', authRoutes);
router.use('/', userRoutes);
router.use('/', processRoutes);
router.use('/', robotRoutes);
router.use('/', taskRoutes);
router.use('/', recordRoutes);
router.use('/', roleRoutes);

export default router;
