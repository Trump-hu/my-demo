import request from '@/utils/request'

// 流程列表
export function getProcessList(params) {
  return request({
    url: '/process/list',
    method: 'get',
    params,
  })
}

// 流程详情
export function getProcessDetail(id) {
  return request({
    url: `/process/detail/${id}`,
    method: 'get',
  })
}

// 新增/更新流程
export function saveProcess(data) {
  return request({
    url: '/process/save',
    method: 'post',
    data,
  })
}

// 删除流程
export function deleteProcess(id) {
  return request({
    url: `/process/delete/${id}`,
    method: 'delete',
  })
}

// 获取流程实时运行状态
export function getProcessMonitor(id) {
  return request({
    url: `/process/monitor/${id}`,
    method: 'get',
  })
}

// 获取流程效能分析数据
export function getProcessEfficiency(id, params) {
  return request({
    url: `/process/efficiency/${id}`,
    method: 'get',
    params,
  })
}
