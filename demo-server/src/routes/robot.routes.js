import { Router } from 'express';
import robotController from '../controllers/robot.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/robot/list', auth(), robotController.list);
router.post('/robot/save', auth(), robotController.save);
router.delete('/robot/delete/:id', auth(), robotController.remove);

export default router;
