import request from '@/utils/request'

// 秒传 / 断点续传检查
export function checkUpload(data) {
  return request({
    url: '/upload/check',
    method: 'post',
    data,
  })
}

// 上传单个分片：body 为二进制原始字节，参数走 query
export function uploadChunk({ hash, index, totalChunks, chunkSize, fileName, fileSize, blob, signal, onProgress }) {
  return request({
    url: '/upload/chunk',
    method: 'post',
    params: { hash, index, totalChunks, chunkSize, fileName, fileSize },
    data: blob,
    headers: { 'Content-Type': 'application/octet-stream' },
    // 分片上传耗时不可预估，交由重试逻辑控制；silent 避免每次重试都弹错误提示
    timeout: 0,
    silent: true,
    signal,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })
}

// 合并分片
export function mergeUpload(hash) {
  return request({
    url: '/upload/merge',
    method: 'post',
    data: { hash },
    timeout: 120000,
  })
}

// 上传记录列表
export function getUploadList(params) {
  return request({
    url: '/upload/list',
    method: 'get',
    params,
  })
}

// 获取文件内容（预览 / 下载共用，带 token 的 blob 请求）
export function fetchUploadFile(id) {
  return request({
    url: `/upload/download/${id}`,
    method: 'get',
    responseType: 'blob',
    timeout: 0,
    silent: true,
  })
}
