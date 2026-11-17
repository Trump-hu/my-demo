<template>
  <el-container class="app-container">
    <!-- 侧边栏 -->
    <el-aside :width="sidebarWidth" class="app-aside">
      <div class="logo-container">
        <svg viewBox="0 0 32 32" width="28" height="28">
          <rect width="32" height="32" rx="6" fill="#fff" />
          <text x="16" y="22" font-size="18" font-family="Arial" font-weight="bold" fill="#1a73e8" text-anchor="middle">R</text>
        </svg>
        <span v-show="!appStore.sidebarCollapsed" class="logo-text">RPA 管理平台</span>
      </div>
      <el-scrollbar class="menu-scrollbar">
        <el-menu
          :default-active="activeMenu"
          :default-openeds="openMenus"
          :collapse="appStore.sidebarCollapsed"
          :unique-opened="true"
          router
          background-color="#001529"
          text-color="rgba(255, 255, 255, 0.65)"
          active-text-color="#fff"
        >
          <template v-for="item in menuItems" :key="item.type === 'group' ? item.key : item.route.path">
            <el-sub-menu v-if="item.type === 'group'" :index="item.key">
              <template #title>
                <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
                <span>{{ item.title }}</span>
              </template>
              <el-menu-item
                v-for="r in item.routes"
                :key="r.path"
                :index="'/' + r.path"
              >
                <el-icon v-if="r.meta.icon"><component :is="r.meta.icon" /></el-icon>
                <template #title>{{ r.meta.title }}</template>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="'/' + item.route.path">
              <el-icon v-if="item.route.meta.icon"><component :is="item.route.meta.icon" /></el-icon>
              <template #title>{{ item.route.meta.title }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <!-- 顶部Header -->
      <el-header class="app-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="appStore.toggleSidebar">
            <Fold v-if="!appStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tooltip content="刷新页面" placement="bottom">
            <el-icon class="header-icon" @click="refresh"><Refresh /></el-icon>
          </el-tooltip>
          <el-tooltip content="全屏" placement="bottom">
            <el-icon class="header-icon" @click="toggleFullscreen"><FullScreen /></el-icon>
          </el-tooltip>
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ userStore.userInfo.nickname || userStore.userInfo.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>账户设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 标签页 -->
      <tags-view />

      <!-- 主内容区 -->
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive :include="tagsStore.cachedViews">
              <component :is="wrapComponent(Component, route)" :key="route.fullPath" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <!-- 退出登录确认 -->
    <el-dialog v-model="logoutDialog" title="提示" width="360px">
      <span>确定要退出登录吗？</span>
      <template #footer>
        <el-button @click="logoutDialog = false">取消</el-button>
        <el-button type="primary" @click="handleLogout">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { computed, ref, markRaw, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  UserFilled, ArrowDown, Fold, Expand, Refresh, FullScreen,
  User, Setting, SwitchButton
} from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'
import { useTagsStore } from '@/store/tags'
import TagsView from '@/components/TagsView.vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const tagsStore = useTagsStore()

const logoutDialog = ref(false)

// 包装组件：为每个路由生成带唯一 name 的包装组件
// 这样 keep-alive 的 :include 可以按 name 精确匹配，实现多编辑页独立缓存
const componentCache = new Map()
const wrapComponent = (component, route) => {
  const cacheName = route.meta._cacheName
  if (!cacheName) {
    return component
  }
  if (componentCache.has(cacheName)) {
    return componentCache.get(cacheName)
  }
  const wrapped = markRaw({
    name: cacheName,
    render() {
      return h(component)
    },
  })
  componentCache.set(cacheName, wrapped)
  return wrapped
}

// 菜单路由（过滤掉隐藏路由，如编辑页）
const menuRoutes = computed(() => {
  const rootRoute = router.options.routes.find(r => r.path === '/')
  const children = rootRoute ? rootRoute.children || [] : []
  return children.filter(r => !r.meta?.hidden)
})

// 菜单项：将路由按 menuGroup 元信息分组，实现二级菜单
const menuItems = computed(() => {
  const routes = menuRoutes.value
  const groupMap = new Map()
  const result = []
  for (const r of routes) {
    const g = r.meta?.menuGroup
    if (g) {
      let gItem = groupMap.get(g)
      if (!gItem) {
        gItem = { type: 'group', key: g, title: r.meta.groupTitle || g, icon: r.meta.groupIcon, routes: [] }
        groupMap.set(g, gItem)
        result.push(gItem)
      }
      gItem.routes.push(r)
    } else {
      result.push({ type: 'item', route: r })
    }
  }
  return result
})

// 默认展开的子菜单：包含当前激活路由的分组
const openMenus = computed(() => {
  const g = route.meta?.menuGroup
  return g ? [g] : []
})

// 当前激活的菜单：编辑页时高亮父级菜单
const activeMenu = computed(() => {
  const parentName = route.meta.parentName
  if (parentName) {
    const parentRoute = menuRoutes.value.find(r => r.name === parentName)
    return parentRoute ? '/' + parentRoute.path : route.path
  }
  return route.path
})
const currentTitle = computed(() => route.meta.title || '')
const sidebarWidth = computed(() => appStore.sidebarCollapsed ? '64px' : '220px')

const refresh = () => {
  window.location.reload()
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心功能开发中')
      break
    case 'settings': 
      ElMessage.info('账户设置功能开发中')
      break
    case 'logout':
      logoutDialog.value = true
      break
  }
}

const handleLogout = async () => {
  // 必须等待登出完成、清除 token 后再跳转，否则路由守卫检测到 token 仍存在会把 /login 重定向回 /
  await userStore.logout()
  tagsStore.reset()
  logoutDialog.value = false
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.app-container {
  height: 100vh;
}

.app-aside {
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;

  .logo-container {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #002140;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    .logo-text {
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
    }
  }

  .menu-scrollbar {
    height: calc(100vh - 56px);

    :deep(.el-menu) {
      border-right: none;
    }

    :deep(.el-menu-item) {
      &:hover {
        background-color: rgba(255, 255, 255, 0.08) !important;
      }

      &.is-active {
        background-color: #1a73e8 !important;
      }
    }
  }
}

.app-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      color: #595959;
      transition: color 0.3s;

      &:hover {
        color: #1a73e8;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;

    .header-icon {
      font-size: 18px;
      cursor: pointer;
      color: #595959;
      transition: color 0.3s;

      &:hover {
        color: #1a73e8;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 0 8px;
      height: 56px;
      transition: background 0.3s;

      &:hover {
        background: #f5f5f5;
      }

      .username {
        font-size: 14px;
        color: #303133;
      }
    }
  }
}

.app-main {
  background: #f5f7fa;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
