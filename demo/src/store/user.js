import { defineStore } from 'pinia'
import { login as loginApi, getUserInfo as getUserInfoApi, logout as logoutApi } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: {},
    roles: [],
    permissions: [],
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo.username || '',
    avatar: (state) => state.userInfo.avatar || '',
  },

  actions: {
    async login(loginForm) {
      const res = await loginApi(loginForm)
      // 后端返回 { code, message, data: { token, userInfo, roles, permissions } }
      const data = res.data
      this.token = data.token
      this.userInfo = data.userInfo
      this.roles = data.roles || []
      this.permissions = data.permissions || []
      return res
    },

    async fetchUserInfo() {
      const res = await getUserInfoApi()
      const data = res.data
      this.userInfo = data.userInfo
      this.roles = data.roles || []
      this.permissions = data.permissions || []
      return res
    },

    async logout() {
      try {
        await logoutApi()
      } catch (e) {
        // 忽略退出登录接口错误（如 token 已过期返回 401）
      }
      this.clearAuth()
    },

    // 仅清除本地登录状态，不调用后端接口
    // 用于 401 拦截等场景，避免触发 /logout 请求形成死循环
    clearAuth() {
      this.token = ''
      this.userInfo = {}
      this.roles = []
      this.permissions = []
    },
  },

  persist: {
    key: 'rpa-user',
    storage: localStorage,
  },
})
