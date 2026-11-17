import { Router } from 'express';
import recordController from '../controllers/record.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/record/list', auth(), recordController.list);

export default router;
