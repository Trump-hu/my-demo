import { defineStore } from 'pinia'

export const useTagsStore = defineStore('tags', {
  state: () => ({
    // 已打开的标签页列表
    visitedViews: [],
    // 当前激活的标签路径
    activePath: '',
  }),

  getters: {
    // 需要缓存的组件名称列表（供 keep-alive 使用）
    // 每个标签页有独立的缓存名，确保多个同类型编辑页可独立缓存
    cachedViews: (state) => {
      return state.visitedViews
        .filter(v => v.cacheable && v.cacheName)
        .map(v => v.cacheName)
    },
  },

  actions: {
    // 添加标签页
    addView(view) {
      // view: { path, title, cacheName, cacheable, query, affix }
      const exist = this.visitedViews.find(v => v.path === view.path)
      if (exist) {
        // 已存在则更新query等
        exist.query = view.query || exist.query
        exist.title = view.title || exist.title
        this.activePath = view.path
        return
      }
      this.visitedViews.push({
        path: view.path,
        title: view.title || '未命名',
        cacheName: view.cacheName || '',
        cacheable: view.cacheable !== false,
        query: view.query || {},
        affix: view.affix || false,
      })
      this.activePath = view.path
    },

    // 删除标签页
    removeView(path) {
      const idx = this.visitedViews.findIndex(v => v.path === path)
      if (idx === -1) return null

      const removed = this.visitedViews.splice(idx, 1)[0]

      // 如果关闭的是当前激活的标签，需要切换到相邻标签
      if (this.activePath === path) {
        const next = this.visitedViews[idx] || this.visitedViews[idx - 1]
        if (next) {
          this.activePath = next.path
          return next
        }
        this.activePath = ''
      }
      return null
    },

    // 关闭其他标签
    closeOtherViews(path) {
      this.visitedViews = this.visitedViews.filter(v => v.affix || v.path === path)
      this.activePath = path
    },

    // 关闭所有标签（保留固定标签）
    closeAllViews() {
      this.visitedViews = this.visitedViews.filter(v => v.affix)
      const first = this.visitedViews[0]
      this.activePath = first ? first.path : ''
      return first
    },

    // 更新标签标题
    updateTitle(path, title) {
      const view = this.visitedViews.find(v => v.path === path)
      if (view) view.title = title
    },

    // 重置（退出登录时调用）
    reset() {
      this.visitedViews = []
      this.activePath = ''
    },
  },
})
