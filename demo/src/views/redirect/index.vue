<template>
  <div class="redirect-container"></div>
</template>

<script setup>
import { onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onBeforeMount(() => {
  // /redirect/process/edit/123 -> /process/edit/123
  const targetPath = route.fullPath.replace(/^\/redirect/, '') || '/'
  router.replace(targetPath)
})
</script>

<style scoped>
.redirect-container {
  height: 100%;
}
</style>
