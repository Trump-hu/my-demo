import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

// 防止 401 重复处理（多个并发请求同时 401 时只处理一次）
let isHandling401 = false

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        // 关键：这里只清本地状态并跳转，不能调用 userStore.logout()，
        // 否则会再次请求受 /auth 保护的 /logout 接口，返回 401 又进入这里，形成死循环
        if (!isHandling401) {
          isHandling401 = true
          const userStore = useUserStore()
          userStore.clearAuth()
          router.push('/login')
          ElMessage.error('登录已过期，请重新登录')
          setTimeout(() => {
            isHandling401 = false
          }, 1000)
        }
      } else if (status === 403) {
        ElMessage.error('没有权限访问该资源')
      } else if (status === 500) {
        ElMessage.error('服务器内部错误')
      } else {
        ElMessage.error(error.response.data?.message || '网络错误')
      }
    } else {
      ElMessage.error('网络连接异常')
    }
    return Promise.reject(error)
  }
)

export default request
