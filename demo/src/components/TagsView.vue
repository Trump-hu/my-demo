<template>
  <div class="tags-view-container">
    <el-scrollbar class="tags-scrollbar">
      <div class="tags-wrapper">
        <div
          v-for="tag in tagsStore.visitedViews"
          :key="tag.path"
          class="tag-item"
          :class="{ active: tag.path === tagsStore.activePath }"
          @click="handleClick(tag)"
          @contextmenu.prevent="openContextMenu($event, tag)"
        >
          <span class="tag-dot" v-if="tag.path === tagsStore.activePath"></span>
          <span class="tag-title">{{ tag.title }}</span>
          <el-icon
            v-if="!tag.affix"
            class="tag-close"
            @click.stop="closeTag(tag)"
          >
            <Close />
          </el-icon>
        </div>
      </div>
    </el-scrollbar>

    <!-- 右键菜单 / 操作按钮 -->
    <div class="tags-actions">
      <el-dropdown trigger="click" @command="handleCommand">
        <el-icon class="action-trigger"><ArrowDown /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="refresh">
              <el-icon><Refresh /></el-icon>刷新当前
            </el-dropdown-item>
            <el-dropdown-item command="closeOthers">
              <el-icon><CircleClose /></el-icon>关闭其他
            </el-dropdown-item>
            <el-dropdown-item command="closeAll">
              <el-icon><Remove /></el-icon>关闭全部
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 右键菜单浮层 -->
    <ul
      v-show="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.top + 'px', left: contextMenu.left + 'px' }"
    >
      <li @click="refreshTag(contextMenu.tag)">
        <el-icon><Refresh /></el-icon>刷新
      </li>
      <li v-if="contextMenu.tag && !contextMenu.tag.affix" @click="closeTag(contextMenu.tag)">
        <el-icon><Close /></el-icon>关闭
      </li>
      <li @click="closeOthers(contextMenu.tag)">
        <el-icon><CircleClose /></el-icon>关闭其他
      </li>
      <li @click="closeAll">
        <el-icon><Remove /></el-icon>关闭全部
      </li>
    </ul>
  </div>
</template>

<script setup>
import { reactive, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close, ArrowDown, Refresh, CircleClose, Remove } from '@element-plus/icons-vue'
import { useTagsStore } from '@/store/tags'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const tagsStore = useTagsStore()
const userStore = useUserStore()

const contextMenu = reactive({
  visible: false,
  top: 0,
  left: 0,
  tag: null,
})

// 从路由 meta 中提取组件名（name 字段）
const getComponentName = (matchedRoute) => {
  if (matchedRoute && matchedRoute.name) {
    return String(matchedRoute.name)
  }
  return ''
}

// 监听路由变化，自动添加标签
watch(
  () => route.fullPath,
  (newPath) => {
    if (!userStore.isLoggedIn) return
    if (route.meta.requiresAuth === false) return

    // 找到当前匹配的子路由（有name的）
    const matched = route.matched.find(m => m.name) || {}
    const routeName = matched.name ? String(matched.name) : ''

    // 生成缓存组件名：每个标签页独立缓存
    // 列表页用路由name（如 Process），编辑页/监控页用 路由name + fullPath（如 ProcessEdit-/process/edit/1）
    // 这样多个同类型编辑页/监控页可独立缓存，互不影响
    let cacheName = ''
    if (route.meta.cacheable !== false) {
      if (route.meta.editableTitle || route.meta.monitorTitle) {
        // 编辑页/监控页：用 fullPath 转换为合法的组件名（去掉特殊字符）
        cacheName = routeName + '-' + newPath.replace(/[^a-zA-Z0-9]/g, '')
      } else {
        // 列表页：用路由name作为组件名
        cacheName = routeName
      }
    }

    // 动态标题
    let title = route.meta.title || '未命名'
    if (route.meta.editableTitle) {
      const base = route.meta.baseTitle || route.meta.title
      title = route.params.id ? `编辑${base}` : `新增${base}`
    } else if (route.meta.monitorTitle) {
      const base = route.meta.baseTitle || route.meta.title
      title = `${base}监控`
    }

    tagsStore.addView({
      path: newPath,
      title: title,
      cacheName: cacheName,
      cacheable: route.meta.cacheable !== false,
      query: route.query,
      affix: route.meta.affix || false,
    })

    // 同步设置 route.meta._cacheName 供 layout 的 wrapComponent 使用
    if (cacheName) {
      route.meta._cacheName = cacheName
    }
  },
  { immediate: true }
)

const handleClick = (tag) => {
  if (tag.path === tagsStore.activePath) return
  router.push({ path: tag.path, query: tag.query })
}

const closeTag = (tag) => {
  const next = tagsStore.removeView(tag.path)
  contextMenu.visible = false
  if (next) {
    router.push({ path: next.path, query: next.query })
  } else if (tagsStore.visitedViews.length === 0) {
    router.push('/')
  }
}

const closeOthers = (tag) => {
  const target = tag || tagsStore.visitedViews.find(v => v.path === tagsStore.activePath)
  if (target) {
    tagsStore.closeOtherViews(target.path)
    router.push({ path: target.path, query: target.query })
  }
  contextMenu.visible = false
}

const closeAll = () => {
  const first = tagsStore.closeAllViews()
  if (first) {
    router.push({ path: first.path })
  } else {
    router.push('/')
  }
  contextMenu.visible = false
}

// 刷新当前标签 - 通过路由重定向实现
const refreshTag = (tag) => {
  contextMenu.visible = false
  const target = tag || tagsStore.visitedViews.find(v => v.path === tagsStore.activePath)
  if (!target) return

  // 从缓存中移除
  if (target.componentName) {
    const idx = tagsStore.cachedViews.indexOf(target.componentName)
    if (idx > -1) {
      // 临时标记为不可缓存
      target.cacheable = false
      nextTick(() => {
        target.cacheable = true
        router.replace({ path: '/redirect' + target.path, query: target.query })
      })
    } else {
      router.replace({ path: '/redirect' + target.path, query: target.query })
    }
  } else {
    router.replace({ path: '/redirect' + target.path, query: target.query })
  }
}

const handleCommand = (command) => {
  switch (command) {
    case 'refresh':
      refreshTag()
      break
    case 'closeOthers':
      closeOthers()
      break
    case 'closeAll':
      closeAll()
      break
  }
}

const openContextMenu = (e, tag) => {
  contextMenu.visible = true
  contextMenu.tag = tag
  const padding = 10
  const menuWidth = 140
  const menuHeight = 160
  let left = e.clientX
  let top = e.clientY
  if (left + menuWidth > window.innerWidth) {
    left = window.innerWidth - menuWidth - padding
  }
  if (top + menuHeight > window.innerHeight) {
    top = window.innerHeight - menuHeight - padding
  }
  contextMenu.left = left
  contextMenu.top = top
}

const closeContextMenu = () => {
  contextMenu.visible = false
}

onMounted(() => {
  document.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
})
</script>

<style lang="scss" scoped>
.tags-view-container {
  display: flex;
  align-items: center;
  height: 34px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 8px;

  .tags-scrollbar {
    flex: 1;

    :deep(.el-scrollbar__wrap) {
      overflow-y: hidden;
    }

    :deep(.el-scrollbar__view) {
      display: inline-block;
      white-space: nowrap;
    }
  }

  .tags-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
  }

  .tag-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 26px;
    padding: 0 10px;
    border: 1px solid #e4e7ed;
    border-radius: 3px;
    font-size: 12px;
    color: #606266;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    user-select: none;

    &:hover {
      color: #1a73e8;
      border-color: #1a73e8;
    }

    &.active {
      background: #1a73e8;
      color: #fff;
      border-color: #1a73e8;

      .tag-dot {
        background: #fff;
      }
    }

    .tag-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #1a73e8;
    }

    .tag-close {
      font-size: 12px;
      border-radius: 50%;
      padding: 1px;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
        color: inherit;
      }
    }
  }

  .tags-actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 8px;
    border-left: 1px solid #f0f0f0;
    margin-left: 4px;
    height: 100%;

    .action-trigger {
      font-size: 16px;
      cursor: pointer;
      color: #595959;
      &:hover {
        color: #1a73e8;
      }
    }
  }

  .context-menu {
    position: fixed;
    z-index: 3000;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    padding: 4px 0;
    list-style: none;
    min-width: 140px;

    li {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 13px;
      color: #606266;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #f5f7fa;
        color: #1a73e8;
      }
    }
  }
}
</style>
