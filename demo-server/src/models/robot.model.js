import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Robot = sequelize.define(
  'Robot',
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
      comment: '机器人编号',
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
      comment: '机器人名称',
    },
    ip: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: 'IP地址',
    },
    os: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '操作系统',
    },
    status: {
      type: DataTypes.ENUM('online', 'offline', 'busy'),
      allowNull: false,
      defaultValue: 'offline',
      comment: '状态',
    },
    cpu: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: 'CPU使用率(%)',
    },
    memory: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '内存使用率(%)',
    },
    disk: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '磁盘使用率(%)',
    },
    processCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '运行中流程数',
    },
    lastHeartbeat: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后心跳时间',
    },
    location: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '位置',
    },
  },
  {
    tableName: 'robots',
    comment: '机器人表',
  },
);

export default Robot;
