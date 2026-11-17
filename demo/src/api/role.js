import request from '@/utils/request'

// 角色列表
export function getRoleList(params) {
  return request({
    url: '/role/list',
    method: 'get',
    params,
  })
}

// 角色下拉选项
export function getRoleOptions() {
  return request({
    url: '/role/options',
    method: 'get',
  })
}

// 新增/更新角色
export function saveRole(data) {
  return request({
    url: '/role/save',
    method: 'post',
    data,
  })
}

// 删除角色
export function deleteRole(id) {
  return request({
    url: `/role/delete/${id}`,
    method: 'delete',
  })
}

// 权限树数据
export function getPermissionTree() {
  return request({
    url: '/role/permissionTree',
    method: 'get',
  })
}
