import { Router } from 'express';
import processController from '../controllers/process.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

// 流程列表
router.get('/process/list', auth(), processController.list);
// 流程详情
router.get('/process/detail/:id', auth(), processController.detail);
// 新增/更新流程
router.post('/process/save', auth(), processController.save);
// 删除流程
router.delete('/process/delete/:id', auth(), processController.remove);
// 流程监控
router.get('/process/monitor/:id', auth(), processController.monitor);
// 流程效能分析
router.get('/process/efficiency/:id', auth(), processController.efficiency);

export default router;
