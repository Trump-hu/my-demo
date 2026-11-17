import request from '@/utils/request'

// 机器人列表
export function getRobotList(params) {
  return request({
    url: '/robot/list',
    method: 'get',
    params,
  })
}

// 新增/更新机器人
export function saveRobot(data) {
  return request({
    url: '/robot/save',
    method: 'post',
    data,
  })
}

// 删除机器人
export function deleteRobot(id) {
  return request({
    url: `/robot/delete/${id}`,
    method: 'delete',
  })
}
