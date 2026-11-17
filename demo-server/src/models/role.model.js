import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Role = sequelize.define(
  'Role',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '角色名称',
    },
    code: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '角色编码',
    },
    sort: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '排序',
    },
    status: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '状态: 0=禁用 1=启用',
    },
    remark: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '',
      comment: '备注',
    },
    userCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '用户数量',
    },
  },
  {
    tableName: 'roles',
    comment: '角色表',
  },
);

export default Role;
