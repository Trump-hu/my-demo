import { Router } from 'express';
import imageTemplateController from '../controllers/image-template.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/image-template/list', auth(), imageTemplateController.list);
router.get('/image-template/detail/:id', auth(), imageTemplateController.detail);
router.post('/image-template/save', auth(), imageTemplateController.save);
router.post('/image-template/copy/:id', auth(), imageTemplateController.copy);
router.delete('/image-template/delete/:id', auth(), imageTemplateController.remove);
router.get('/image-template/preview/:id', auth(), imageTemplateController.preview);

export default router;
