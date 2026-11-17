import { Op } from 'sequelize';
import Role from '../models/role.model.js';
import { formatDateTime } from '../utils/date.js';

function formatRole(r) {
  const d = r.toJSON();
  return {
    id: d.id,
    name: d.name,
    code: d.code,
    sort: d.sort,
    status: d.status,
    remark: d.remark,
    userCount: d.userCount,
    createTime: d.createdAt ? formatDateTime(d.createdAt) : '',
  };
}

class RoleService {
  async list({ page, pageSize, keyword }) {
    const where = {};
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
      ];
    }
    const { rows, count } = await Role.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['sort', 'ASC'], ['id', 'DESC']],
    });
    return {
      list: rows.map(formatRole),
      total: count,
      page,
      pageSize,
    };
  }

  // 角色下拉选项
  async options() {
    const roles = await Role.findAll({ order: [['sort', 'ASC']] });
    return roles.map((r) => ({ label: r.name, value: r.id }));
  }

  async save(data) {
    if (data.id) {
      const r = await Role.findByPk(data.id);
      if (!r) {
        const err = new Error('角色不存在');
        err.status = 404;
        throw err;
      }
      const patch = {};
      ['name', 'code', 'sort', 'status', 'remark'].forEach((k) => {
        if (data[k] !== undefined) patch[k] = data[k];
      });
      await r.update(patch);
      return formatRole(r);
    }
    const r = await Role.create({
      name: data.name,
      code: data.code,
      sort: data.sort || 0,
      status: data.status !== undefined ? data.status : 1,
      remark: data.remark || '',
      userCount: 0,
    });
    return formatRole(r);
  }

  async remove(id) {
    const r = await Role.findByPk(id);
    if (!r) {
      const err = new Error('角色不存在');
      err.status = 404;
      throw err;
    }
    await r.destroy();
    return true;
  }

  // 权限树（静态数据，与前端 mock 一致）
  getPermissionTree() {
    return [
      {
        id: 1, label: '流程管理', children: [
          { id: 11, label: '查看' },
          { id: 12, label: '新增' },
          { id: 13, label: '编辑' },
          { id: 14, label: '删除' },
          { id: 15, label: '发布' },
        ],
      },
      {
        id: 2, label: '机器人管理', children: [
          { id: 21, label: '查看' },
          { id: 22, label: '新增' },
          { id: 23, label: '编辑' },
          { id: 24, label: '删除' },
          { id: 25, label: '重启' },
        ],
      },
      {
        id: 3, label: '任务管理', children: [
          { id: 31, label: '查看' },
          { id: 32, label: '新增' },
          { id: 33, label: '编辑' },
          { id: 34, label: '删除' },
          { id: 35, label: '执行' },
          { id: 36, label: '停止' },
        ],
      },
      {
        id: 4, label: '运行记录', children: [
          { id: 41, label: '查看' },
          { id: 42, label: '导出' },
        ],
      },
      {
        id: 5, label: '用户管理', children: [
          { id: 51, label: '查看' },
          { id: 52, label: '新增' },
          { id: 53, label: '编辑' },
          { id: 54, label: '删除' },
          { id: 55, label: '重置密码' },
        ],
      },
      {
        id: 6, label: '角色管理', children: [
          { id: 61, label: '查看' },
          { id: 62, label: '新增' },
          { id: 63, label: '编辑' },
          { id: 64, label: '删除' },
          { id: 65, label: '分配权限' },
        ],
      },
      {
        id: 7, label: '系统设置', children: [
          { id: 71, label: '查看' },
          { id: 72, label: '编辑' },
        ],
      },
    ];
  }
}

export default new RoleService();
