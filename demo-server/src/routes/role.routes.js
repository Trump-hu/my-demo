import { Router } from 'express';
import roleController from '../controllers/role.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/role/list', auth(), roleController.list);
router.get('/role/options', auth(), roleController.options);
router.post('/role/save', auth(), roleController.save);
router.delete('/role/delete/:id', auth(), roleController.remove);
router.get('/role/permissionTree', auth(), roleController.permissionTree);

export default router;
