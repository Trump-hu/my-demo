<template>
  <div
    ref="containerRef"
    class="virtual-list"
    :style="{ height: height + 'px' }"
    @scroll.passive="onScroll"
  >
    <!-- 占位元素，撑出完整滚动条高度 -->
    <div class="vl-phantom" :style="{ height: totalHeight + 'px' }"></div>
    <!-- 可视区域内容，通过 translateY 对齐到当前滚动位置 -->
    <div class="vl-content" :style="{ transform: `translateY(${offset}px)` }">
      <div
        v-for="(item, i) in visibleItems"
        :key="item[keyField]"
        class="vl-item"
        :style="{ height: itemSize + 'px', lineHeight: itemSize + 'px' }"
      >
        <slot :item="item" :index="startIndex + i" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  itemSize: { type: Number, default: 48 },
  height: { type: Number, default: 480 },
  buffer: { type: Number, default: 6 }, // 上下额外渲染的缓冲条数
  keyField: { type: String, default: 'id' },
  bottomThreshold: { type: Number, default: 80 }, // 距底部多少 px 触发 reach-bottom
})

const emit = defineEmits(['reach-bottom', 'scroll'])

const containerRef = ref(null)
const startIndex = ref(0)
const endIndex = ref(0)
const offset = ref(0)
const progress = ref(0)

const totalHeight = computed(() => props.items.length * props.itemSize)

const visibleItems = computed(() => props.items.slice(startIndex.value, endIndex.value))

const visibleCount = computed(() => endIndex.value - startIndex.value)

const compute = () => {
  const el = containerRef.value
  if (!el) return
  const scrollTop = el.scrollTop
  const viewCount = Math.ceil(props.height / props.itemSize)
  const first = Math.max(0, Math.floor(scrollTop / props.itemSize) - props.buffer)
  startIndex.value = first
  endIndex.value = Math.min(props.items.length, first + viewCount + props.buffer * 2)
  offset.value = first * props.itemSize

  const maxScroll = el.scrollHeight - el.clientHeight
  progress.value = maxScroll > 0 ? Math.min(1, scrollTop / maxScroll) : 0
  emit('scroll', {
    progress: progress.value,
    scrollTop,
    visibleCount: visibleCount.value,
    startIndex: startIndex.value,
    endIndex: endIndex.value,
  })

  if (scrollTop + el.clientHeight >= el.scrollHeight - props.bottomThreshold) {
    emit('reach-bottom')
  }
}

const onScroll = () => {
  compute()
}

// 滚动到指定索引
const scrollToIndex = (index) => {
  const el = containerRef.value
  if (!el) return
  const target = Math.max(0, Math.min(props.items.length - 1, index))
  el.scrollTop = target * props.itemSize
}

// 数据/尺寸变化时重置并重新计算
watch(
  () => [props.items.length, props.itemSize, props.height],
  () => {
    nextTick(() => compute())
  }
)

onMounted(() => {
  compute()
})

defineExpose({
  scrollToIndex,
})
</script>

<style lang="scss" scoped>
.virtual-list {
  position: relative;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
}

.vl-phantom {
  width: 1px;
}

.vl-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.vl-item {
  box-sizing: border-box;
  border-bottom: 1px solid #f5f5f5;
  padding: 0 16px;
  overflow: hidden;
}
</style>
