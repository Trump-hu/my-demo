import userService from '../services/user.service.js';
import { success, paginate } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

class UserController {
  // 登录
  async login(req, res, next) {
    try {
      const result = await userService.login(req.body);
      return success(res, result, '登录成功');
    } catch (err) {
      next(err);
    }
  }

  // 获取当前用户信息
  async profile(req, res, next) {
    try {
      const result = await userService.getProfile(req.userId);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 退出登录（JWT 无状态，前端清除即可）
  async logout(req, res, next) {
    try {
      return success(res, null, '退出成功');
    } catch (err) {
      next(err);
    }
  }

  // 用户列表（分页）
  async list(req, res, next) {
    try {
      const { page, pageSize } = parsePagination(req.query);
      const result = await userService.list({
        page,
        pageSize,
        keyword: req.query.keyword,
        dept: req.query.dept,
        status: req.query.status,
      });
      return paginate(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 新增或更新用户（saveUser）
  async save(req, res, next) {
    try {
      const user = await userService.save(req.body);
      return success(res, user, '保存成功');
    } catch (err) {
      next(err);
    }
  }

  // 删除用户
  async remove(req, res, next) {
    try {
      await userService.remove(req.params.id);
      return success(res, null, '删除成功');
    } catch (err) {
      next(err);
    }
  }

  // 重置密码
  async resetPassword(req, res, next) {
    try {
      const pwd = await userService.resetPassword(req.params.id);
      return success(res, { password: pwd }, `密码已重置为 ${pwd}`);
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();
