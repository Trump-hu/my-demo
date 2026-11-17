import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Record = sequelize.define(
  'Record',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    taskName: {
      type: DataTypes.STRING(128),
      allowNull: false,
      comment: '任务名称',
    },
    processName: {
      type: DataTypes.STRING(128),
      allowNull: true,
      defaultValue: '',
      comment: '流程名称',
    },
    robotName: {
      type: DataTypes.STRING(128),
      allowNull: true,
      defaultValue: '',
      comment: '机器人名称',
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'running', 'stopped'),
      allowNull: false,
      defaultValue: 'success',
      comment: '状态',
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
    logCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '日志条数',
    },
    errorMsg: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '错误信息',
    },
    operator: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '操作人',
    },
  },
  {
    tableName: 'records',
    comment: '运行记录表',
  },
);

export default Record;
