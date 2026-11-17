import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/redirect',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: ':pathMatch(.*)*',
        name: 'Redirect',
        component: () => import('@/views/redirect/index.vue'),
        meta: { requiresAuth: true, cacheable: false },
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'Odometer', requiresAuth: true, affix: true, cacheable: true },
      },
      {
        path: 'process',
        name: 'Process',
        component: () => import('@/views/process/index.vue'),
        meta: { title: '流程管理', icon: 'Share', requiresAuth: true, cacheable: true },
      },
      {
        path: 'process/edit/:id?',
        name: 'ProcessEdit',
        component: () => import('@/views/process/edit.vue'),
        meta: { title: '流程编辑', requiresAuth: true, cacheable: true, parentName: 'Process', editableTitle: true, baseTitle: '流程', hidden: true },
      },
      {
        path: 'process/monitor/:id',
        name: 'ProcessMonitor',
        component: () => import('@/views/process/monitor.vue'),
        meta: { title: '流程监控', requiresAuth: true, cacheable: true, parentName: 'Process', monitorTitle: true, baseTitle: '流程', hidden: true },
      },
      {
        path: 'robot',
        name: 'Robot',
        component: () => import('@/views/robot/index.vue'),
        meta: { title: '机器人管理', icon: 'Cpu', requiresAuth: true, cacheable: true },
      },
      {
        path: 'robot/edit/:id?',
        name: 'RobotEdit',
        component: () => import('@/views/robot/edit.vue'),
        meta: { title: '机器人编辑', requiresAuth: true, cacheable: true, parentName: 'Robot', editableTitle: true, baseTitle: '机器人', hidden: true },
      },
      {
        path: 'task',
        name: 'Task',
        component: () => import('@/views/task/index.vue'),
        meta: { title: '任务管理', icon: 'List', requiresAuth: true, cacheable: true },
      },
      {
        path: 'task/edit/:id?',
        name: 'TaskEdit',
        component: () => import('@/views/task/edit.vue'),
        meta: { title: '任务编辑', requiresAuth: true, cacheable: true, parentName: 'Task', editableTitle: true, baseTitle: '任务', hidden: true },
      },
      {
        path: 'record',
        name: 'Record',
        component: () => import('@/views/record/index.vue'),
        meta: { title: '流程运行记录', icon: 'Document', requiresAuth: true, cacheable: true },
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', icon: 'User', requiresAuth: true, cacheable: true },
      },
      {
        path: 'user/edit/:id?',
        name: 'UserEdit',
        component: () => import('@/views/user/edit.vue'),
        meta: { title: '用户编辑', requiresAuth: true, cacheable: true, parentName: 'User', editableTitle: true, baseTitle: '用户', hidden: true },
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('@/views/role/index.vue'),
        meta: { title: '角色管理', icon: 'UserFilled', requiresAuth: true, cacheable: true },
      },
      {
        path: 'role/edit/:id?',
        name: 'RoleEdit',
        component: () => import('@/views/role/edit.vue'),
        meta: { title: '角色编辑', requiresAuth: true, cacheable: true, parentName: 'Role', editableTitle: true, baseTitle: '角色', hidden: true },
      },
      {
        path: 'setting',
        name: 'Setting',
        component: () => import('@/views/setting/index.vue'),
        meta: { title: '系统设置', icon: 'Setting', requiresAuth: true, cacheable: true, affix: true },
      },
      {
        path: 'business/web-worker',
        name: 'WebWorker',
        component: () => import('@/views/business/web-worker.vue'),
        meta: {
          title: 'Web Worker',
          icon: 'Cpu',
          requiresAuth: true,
          cacheable: true,
          menuGroup: 'Business',
          groupTitle: '业务场景',
          groupIcon: 'Briefcase',
        },
      },
      {
        path: 'business/virtual-list',
        name: 'VirtualList',
        component: () => import('@/views/business/virtual-list.vue'),
        meta: {
          title: '虚拟列表',
          icon: 'Tickets',
          requiresAuth: true,
          cacheable: true,
          menuGroup: 'Business',
          groupTitle: '业务场景',
          groupIcon: 'Briefcase',
        },
      },
      {
        path: 'business/file-upload',
        name: 'FileUpload',
        component: () => import('@/views/business/file-upload.vue'),
        meta: {
          title: '大文件上传',
          icon: 'UploadFilled',
          requiresAuth: true,
          cacheable: true,
          menuGroup: 'Business',
          groupTitle: '业务场景',
          groupIcon: 'Briefcase',
        },
      },
      {
        path: 'business/file-preview',
        name: 'FilePreview',
        component: () => import('@/views/business/file-preview.vue'),
        meta: {
          title: '文件预览',
          icon: 'View',
          requiresAuth: true,
          cacheable: true,
          menuGroup: 'Business',
          groupTitle: '业务场景',
          groupIcon: 'Briefcase',
        },
      },
      {
        path: 'business/upload-list',
        name: 'UploadList',
        component: () => import('@/views/business/upload-list.vue'),
        meta: {
          title: '上传记录',
          icon: 'Files',
          requiresAuth: true,
          cacheable: true,
          menuGroup: 'Business',
          groupTitle: '业务场景',
          groupIcon: 'Briefcase',
        },
      },
      {
        path: 'business/image-compose',
        name: 'ImageCompose',
        component: () => import('@/views/business/image-compose/index.vue'),
        meta: {
          title: '图片合成',
          icon: 'PictureFilled',
          requiresAuth: true,
          cacheable: true,
          menuGroup: 'Business',
          groupTitle: '业务场景',
          groupIcon: 'Briefcase',
        },
      },
      {
        path: 'business/image-compose/edit/:id?',
        name: 'ImageComposeEdit',
        component: () => import('@/views/business/image-compose/edit.vue'),
        meta: {
          title: '图片合成编辑',
          requiresAuth: true,
          cacheable: true,
          parentName: 'ImageCompose',
          editableTitle: true,
          baseTitle: '图片合成',
          hidden: true,
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  // 动态设置标签页标题
  let title = to.meta.title || 'RPA管理平台'
  // 编辑页根据是否有id调整标题
  if (to.meta.editableTitle) {
    const base = to.meta.baseTitle || to.meta.title
    title = to.params.id ? `编辑${base}` : `新增${base}`
  } else if (to.meta.monitorTitle) {
    const base = to.meta.baseTitle || to.meta.title
    title = `${base}监控`
  }
  document.title = `${title} - RPA管理平台`

  if (to.meta.requiresAuth === false) {
    if (to.path === '/login' && token) {
      next('/')
      return
    }
    next()
    return
  }

  if (!token) {
    next('/login')
    return
  }

  next()
})

export default router
