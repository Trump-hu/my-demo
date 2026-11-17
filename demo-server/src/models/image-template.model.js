import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const ImageTemplate = sequelize.define(
  'ImageTemplate',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
      comment: '合成图片名称',
    },
    width: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1200,
      comment: '画布宽度(px)',
    },
    height: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 800,
      comment: '画布高度(px)',
    },
    quality: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 90,
      comment: '导出质量(1-100)',
    },
    config: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: '合成配置(JSON: 底图/插画/文字)',
    },
    previewPath: {
      type: DataTypes.STRING(512),
      allowNull: true,
      defaultValue: '',
      comment: '合成预览图存储路径',
    },
    fileSize: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '合成预览图大小(字节)',
    },
    creator: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '创建人(用户ID)',
    },
    updater: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '最后更新人(用户ID)',
    },
    type: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: '图片',
      comment: '图片类型: 图片/草稿/海报/图标/其他',
    },
  },
  {
    tableName: 'image_templates',
    comment: '图片合成模板表',
  },
);

export default ImageTemplate;
