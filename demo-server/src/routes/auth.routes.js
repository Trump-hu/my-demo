import { Router } from 'express';
import { body } from 'express-validator';
import userController from '../controllers/user.controller.js';
import { auth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// 登录
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  validate,
  userController.login,
);

// 获取当前用户信息
router.get('/userInfo', auth(), userController.profile);

// 退出登录
router.post('/logout', auth(), userController.logout);

export default router;
