import { Op } from 'sequelize';
import User from '../models/user.model.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

class UserService {
  async register({ username, password, nickname, email }) {
    const exists = await User.findOne({ where: { username } });
    if (exists) {
      const err = new Error('用户名已存在');
      err.status = 409;
      throw err;
    }
    const user = await User.create({
      username,
      password: hashPassword(password),
      nickname: nickname || username,
      email: email || null,
    });
    return user.toSafeJSON();
  }

  // 登录：返回前端期望的 { token, userInfo, roles, permissions }
  async login({ username, password }) {
    const user = await User.findOne({ where: { username } });
    if (!user || !comparePassword(password, user.password)) {
      const err = new Error('用户名或密码错误');
      err.status = 401;
      throw err;
    }
    if (user.status === 0) {
      const err = new Error('账号已被禁用');
      err.status = 403;
      throw err;
    }
    // 更新最后登录时间
    await user.update({ lastLogin: new Date() });

    const token = signToken({ id: user.id, role: user.role, username: user.username });
    const userInfo = user.toSafeJSON();
    const roles = [user.role === 'admin' ? 'admin' : user.role];
    // admin 拥有全部权限
    const permissions = user.role === 'admin' ? ['*:*:*'] : [];
    return { token, userInfo, roles, permissions };
  }

  // 获取当前用户信息：返回前端期望的 { userInfo, roles, permissions }
  async getProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      const err = new Error('用户不存在');
      err.status = 404;
      throw err;
    }
    const userInfo = user.toSafeJSON();
    const roles = [user.role === 'admin' ? 'admin' : user.role];
    const permissions = user.role === 'admin' ? ['*:*:*'] : [];
    return { userInfo, roles, permissions };
  }

  async list({ page, pageSize, keyword, dept, status }) {
    const where = {};
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (dept) {
      where.dept = dept;
    }
    if (status !== undefined && status !== '') {
      where.status = Number(status);
    }
    const { rows, count } = await User.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['id', 'DESC']],
    });
    return {
      list: rows.map((u) => u.toSafeJSON()),
      total: count,
      page,
      pageSize,
    };
  }

  // 新增或更新用户（前端 saveUser）
  async save(data) {
    if (data.id) {
      const user = await User.findByPk(data.id);
      if (!user) {
        const err = new Error('用户不存在');
        err.status = 404;
        throw err;
      }
      const patch = {};
      ['username', 'nickname', 'email', 'phone', 'avatar', 'dept', 'role', 'status'].forEach((k) => {
        if (data[k] !== undefined) patch[k] = data[k];
      });
      // 如果传了密码则一并更新
      if (data.password) patch.password = hashPassword(data.password);
      await user.update(patch);
      return user.toSafeJSON();
    }
    // 新增
    const exists = await User.findOne({ where: { username: data.username } });
    if (exists) {
      const err = new Error('用户名已存在');
      err.status = 409;
      throw err;
    }
    const user = await User.create({
      username: data.username,
      password: hashPassword(data.password || '123456'),
      nickname: data.nickname || data.username,
      email: data.email || null,
      phone: data.phone || null,
      dept: data.dept || '',
      role: data.role || 'viewer',
      status: data.status !== undefined ? data.status : 1,
      lastLogin: null,
    });
    return user.toSafeJSON();
  }

  async remove(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      const err = new Error('用户不存在');
      err.status = 404;
      throw err;
    }
    await user.destroy();
    return true;
  }

  // 重置密码
  async resetPassword(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      const err = new Error('用户不存在');
      err.status = 404;
      throw err;
    }
    const defaultPwd = 'Rpa@123456';
    await user.update({ password: hashPassword(defaultPwd) });
    return defaultPwd;
  }
}

export default new UserService();
