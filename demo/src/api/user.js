import request from '@/utils/request'

// 用户列表
export function getUserList(params) {
  return request({
    url: '/user/list',
    method: 'get',
    params,
  })
}

// 新增/更新用户
export function saveUser(data) {
  return request({
    url: '/user/save',
    method: 'post',
    data,
  })
}

// 删除用户
export function deleteUser(id) {
  return request({
    url: `/user/delete/${id}`,
    method: 'delete',
  })
}

// 重置密码
export function resetPassword(id) {
  return request({
    url: `/user/resetPassword/${id}`,
    method: 'put',
  })
}
