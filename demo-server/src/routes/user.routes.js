import { Router } from 'express';
import { body } from 'express-validator';
import userController from '../controllers/user.controller.js';
import { auth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// 用户列表（分页）
router.get('/user/list', auth(), userController.list);

// 新增 / 更新用户
router.post(
  '/user/save',
  auth(),
  [
    body('username').optional().isString().isLength({ min: 3, max: 64 }).withMessage('用户名长度需为 3-64'),
  ],
  validate,
  userController.save,
);

// 删除用户
router.delete('/user/delete/:id', auth(), userController.remove);

// 重置密码
router.put('/user/resetPassword/:id', auth(), userController.resetPassword);

export default router;
