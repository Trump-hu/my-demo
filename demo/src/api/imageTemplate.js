import request from '@/utils/request'

// 合成记录列表
export function getImageTemplateList(params) {
  return request({
    url: '/image-template/list',
    method: 'get',
    params,
  })
}

// 合成详情（含 config，用于编辑回显）
export function getImageTemplateDetail(id) {
  return request({
    url: `/image-template/detail/${id}`,
    method: 'get',
  })
}

// 新增/更新合成记录
export function saveImageTemplate(data) {
  return request({
    url: '/image-template/save',
    method: 'post',
    data,
    timeout: 120000,
  })
}

// 一键复制合成记录
export function copyImageTemplate(id) {
  return request({
    url: `/image-template/copy/${id}`,
    method: 'post',
    timeout: 60000,
  })
}

// 删除合成记录
export function deleteImageTemplate(id) {
  return request({
    url: `/image-template/delete/${id}`,
    method: 'delete',
  })
}

// 获取合成预览图（带 token 的 blob 请求）
export function fetchImageTemplatePreview(id) {
  return request({
    url: `/image-template/preview/${id}`,
    method: 'get',
    responseType: 'blob',
    timeout: 0,
    silent: true,
  })
}
