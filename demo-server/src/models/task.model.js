import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Task = sequelize.define(
  'Task',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
      comment: '任务名称',
    },
    processName: {
      type: DataTypes.STRING(128),
      allowNull: true,
      defaultValue: '',
      comment: '关联流程名称',
    },
    robotName: {
      type: DataTypes.STRING(128),
      allowNull: true,
      defaultValue: '',
      comment: '执行机器人名称',
    },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'success', 'failed', 'stopped'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '状态',
    },
    priority: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
      comment: '优先级',
    },
    triggerType: {
      type: DataTypes.ENUM('manual', 'scheduled', 'api'),
      allowNull: false,
      defaultValue: 'manual',
      comment: '触发方式',
    },
    cron: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: 'Cron表达式',
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '开始时间',
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '结束时间',
    },
    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '耗时(秒)',
    },
    creator: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '创建人',
    },
  },
  {
    tableName: 'tasks',
    comment: '任务表',
  },
);

export default Task;
