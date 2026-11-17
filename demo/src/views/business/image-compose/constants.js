// 图片类型可选值（与后端 IMAGE_TYPES 保持一致）
export const IMAGE_TYPES = ['图片', '草稿', '海报', '图标', '其他']

export const TYPE_TAG_MAP = {
  图片: 'primary',
  草稿: 'info',
  海报: 'warning',
  图标: 'success',
  其他: 'info',
}

export const typeTag = (type) => TYPE_TAG_MAP[type] || 'info'
