import request from '@/utils/request'

// 任务列表
export function getTaskList(params) {
  return request({
    url: '/task/list',
    method: 'get',
    params,
  })
}

// 新增/更新任务
export function saveTask(data) {
  return request({
    url: '/task/save',
    method: 'post',
    data,
  })
}

// 删除任务
export function deleteTask(id) {
  return request({
    url: `/task/delete/${id}`,
    method: 'delete',
  })
}

// 启动任务
export function startTask(id) {
  return request({
    url: `/task/start/${id}`,
    method: 'post',
  })
}

// 停止任务
export function stopTask(id) {
  return request({
    url: `/task/stop/${id}`,
    method: 'post',
  })
}
