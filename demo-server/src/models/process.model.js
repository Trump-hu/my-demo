import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Process = sequelize.define(
  'Process',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      comment: '流程编号',
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
      comment: '流程名称',
    },
    category: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '分类',
    },
    status: {
      type: DataTypes.ENUM('published', 'draft', 'offline'),
      allowNull: false,
      defaultValue: 'draft',
      comment: '状态',
    },
    version: {
      type: DataTypes.STRING(16),
      allowNull: true,
      defaultValue: 'v1.0.0',
      comment: '版本',
    },
    robotCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '关联机器人数量',
    },
    runCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '运行次数',
    },
    successRate: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 100,
      comment: '成功率(%)',
    },
    creator: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '创建人',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '描述',
    },
  },
  {
    tableName: 'processes',
    comment: '流程表',
  },
);

export default Process;
