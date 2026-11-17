import { Router, raw } from 'express';
import uploadController from '../controllers/upload.controller.js';
import { auth } from '../middlewares/auth.middleware.js';
import { uploadConfig } from '../config/index.js';

const router = Router();

// 分片请求体为二进制原始字节，不使用 multipart，避免额外依赖
const rawChunkBody = raw({
  type: 'application/octet-stream',
  limit: uploadConfig.maxChunkSize,
});

router.post('/upload/check', auth(), uploadController.check);
router.get('/upload/progress', auth(), uploadController.progress);
router.post('/upload/chunk', auth(), rawChunkBody, uploadController.chunk);
router.post('/upload/merge', auth(), uploadController.merge);
router.get('/upload/list', auth(), uploadController.list);
router.get('/upload/download/:id', auth(), uploadController.download);
router.delete('/upload/delete/:id', auth(), uploadController.remove);

export default router;
