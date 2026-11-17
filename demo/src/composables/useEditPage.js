// 编辑页通用组合式：处理路由参数、返回列表
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useEditPage(parentPath) {
  const route = useRoute()
  const router = useRouter()

  // 是否编辑模式（有id参数为编辑，无id为新增）
  const isEdit = computed(() => !!route.params.id)
  const id = computed(() => route.params.id)

  // 返回列表页
  const goBack = () => {
    router.push(parentPath)
  }

  return {
    route,
    router,
    isEdit,
    id,
    goBack,
  }
}
