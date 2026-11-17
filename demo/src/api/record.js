import request from '@/utils/request'

// 运行记录列表
export function getRecordList(params) {
  return request({
    url: '/record/list',
    method: 'get',
    params,
  })
}
