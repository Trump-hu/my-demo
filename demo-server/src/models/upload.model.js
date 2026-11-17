import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Upload = sequelize.define(
  'Upload',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    hash: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      comment: '文件指纹（秒传 / 断点续传依据）',
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '原始文件名',
    },
    fileSize: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '文件总大小(字节)',
    },
    chunkSize: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '切片大小(字节)',
    },
    totalChunks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '分片总数',
    },
    uploadedChunks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '已上传分片数',
    },
    status: {
      type: DataTypes.ENUM('uploading', 'merging', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'uploading',
      comment: '状态: uploading=上传中 merging=合并中 completed=已完成 failed=失败',
    },
    storagePath: {
      type: DataTypes.STRING(512),
      allowNull: true,
      defaultValue: '',
      comment: '合并后文件存储路径',
    },
    creator: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '上传人(用户ID)',
    },
  },
  {
    tableName: 'uploads',
    comment: '文件上传记录表',
    indexes: [{ fields: ['status'] }],
  },
);

export default Upload;
