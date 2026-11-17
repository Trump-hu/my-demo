import { Router } from 'express';
import taskController from '../controllers/task.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/task/list', auth(), taskController.list);
router.post('/task/save', auth(), taskController.save);
router.delete('/task/delete/:id', auth(), taskController.remove);
router.post('/task/start/:id', auth(), taskController.start);
router.post('/task/stop/:id', auth(), taskController.stop);

export default router;
