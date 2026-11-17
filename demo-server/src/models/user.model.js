import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '用户名',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码哈希',
    },
    nickname: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '昵称',
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: true,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号',
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '',
      comment: '头像',
    },
    dept: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '部门',
    },
    role: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'viewer',
      comment: '角色名称',
    },
    status: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '状态: 0=禁用 1=启用',
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后登录时间',
    },
  },
  {
    tableName: 'users',
    comment: '用户表',
  },
);

// 实例方法：返回不含敏感字段的用户信息
User.prototype.toSafeJSON = function () {
  const values = this.toJSON();
  delete values.password;
  // 格式化 lastLogin
  if (values.lastLogin) {
    const d = new Date(values.lastLogin);
    const pad = (n) => String(n).padStart(2, '0');
    values.lastLogin = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } else {
    values.lastLogin = '未登录';
  }
  return values;
};

export default User;
