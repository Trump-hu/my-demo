<template>
  <div class="page-container">
    <!-- 简介 -->
    <div class="page-card intro-card">
      <div class="intro-head">
        <el-icon :size="32" color="#1a73e8"><Tickets /></el-icon>
        <div>
          <h2>虚拟列表实际使用场景</h2>
          <p class="intro-desc">
            虚拟列表只渲染可视区域内的少量 DOM 节点（而非全部数据），用占位元素撑出完整滚动条，
            因此即使数据量达到十万、百万级也能保持流畅滚动。下面是三个常见业务场景演示。
          </p>
        </div>
      </div>
      <div class="intro-tags">
        <el-tag v-for="t in scenarios" :key="t" type="info" effect="plain">{{ t }}</el-tag>
      </div>
    </div>

    <!-- 主线程心跳计数器（全局置顶，用于观察主线程是否被阻塞） -->
    <div class="heartbeat-banner" :class="{ frozen }">
      <div class="hb-pulse"></div>
      <div class="hb-info">
        <div class="hb-title">主线程心跳计数器</div>
        <div class="hb-desc">
          计数器持续跳动表示主线程流畅；切换为“普通列表”渲染大数据时它会停顿（主线程被阻塞），
          而启用虚拟列表时它始终保持跳动。
        </div>
      </div>
      <div class="hb-number">{{ heartCount }}</div>
      <div class="hb-status">
        <span class="status-dot"></span>
        {{ frozen ? '已停顿' : '运行中' }}
      </div>
    </div>

    <!-- 场景一：海量数据渲染 -->
    <div class="page-card mt-16">
      <div class="card-header">
        <span class="card-title">场景一 · 海量数据渲染</span>
        <el-tag type="success" effect="light">核心能力</el-tag>
      </div>
      <p class="card-tip">
        切换数据量与行高并自由滚动。无论数据总量多大，页面始终只渲染可视区域内的少量节点，滚动流畅、内存占用低。
      </p>
      <div class="demo-form">
        <span class="label">渲染模式：</span>
        <el-switch
          v-model="useVirtual"
          inline-prompt
          active-text="虚拟"
          inactive-text="普通"
          style="--el-switch-on-color: #67c23a; --el-switch-off-color: #f56c6c"
        />
        <span class="label">数据总量：</span>
        <el-select v-model="bigCount" style="width: 140px" @change="regenBig">
          <el-option label="1 万条" :value="10000" />
          <el-option label="10 万条" :value="100000" />
          <el-option label="100 万条" :value="1000000" />
        </el-select>
        <span class="label">行高：</span>
        <el-select v-model="bigItemSize" style="width: 100px">
          <el-option label="40px" :value="40" />
          <el-option label="56px" :value="56" />
          <el-option label="80px" :value="80" />
        </el-select>
        <span class="label">视口高度：</span>
        <el-input-number v-model="bigHeight" :min="200" :max="700" :step="40" />
        <template v-if="useVirtual">
          <el-button @click="scrollToMiddle">跳到中部</el-button>
          <el-button @click="scrollToTop">回到顶部</el-button>
        </template>
      </div>
      <div class="metrics mt-16">
        <div class="metric-card">
          <div class="metric-label">数据总量</div>
          <div class="metric-value">{{ bigItems.length.toLocaleString() }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">渲染节点数</div>
          <div class="metric-value">{{ bigRenderedCount }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">DOM 占比</div>
          <div class="metric-value">{{ bigDomRatio }}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">滚动进度</div>
          <div class="metric-value">{{ bigProgress }}%</div>
        </div>
      </div>
      <VirtualList
        v-if="useVirtual"
        ref="bigVL"
        class="mt-16"
        :items="bigItems"
        :item-size="bigItemSize"
        :height="bigHeight"
        @scroll="onBigScroll"
      >
        <template #default="{ item, index }">
          <div class="vl-row">
            <span class="vl-idx">#{{ String(index).padStart(7, '0') }}</span>
            <span class="vl-dot" :style="{ background: statusColor(item.status) }"></span>
            <span class="vl-name">{{ item.name }}</span>
            <el-tag size="small" :type="tagType(item.tag)" effect="light">{{ item.tag }}</el-tag>
            <span class="vl-status" :style="{ color: statusColor(item.status) }">{{ item.status }}</span>
          </div>
        </template>
      </VirtualList>
      <div v-else class="normal-list" :style="{ height: bigHeight + 'px' }">
        <el-alert
          v-if="bigItems.length > NORMAL_CAP"
          class="normal-cap-alert"
          type="warning"
          :closable="false"
          show-icon
          :title="`普通列表为避免页面卡死，仅渲染前 ${NORMAL_CAP.toLocaleString()} 条（数据总量 ${bigItems.length.toLocaleString()} 条）`"
        />
        <div
          v-for="(item, index) in bigRenderItems"
          :key="item.id"
          class="nl-item"
          :style="{ height: bigItemSize + 'px', lineHeight: bigItemSize + 'px' }"
        >
          <div class="vl-row">
            <span class="vl-idx">#{{ String(index).padStart(7, '0') }}</span>
            <span class="vl-dot" :style="{ background: statusColor(item.status) }"></span>
            <span class="vl-name">{{ item.name }}</span>
            <el-tag size="small" :type="tagType(item.tag)" effect="light">{{ item.tag }}</el-tag>
            <span class="vl-status" :style="{ color: statusColor(item.status) }">{{ item.status }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 场景二：搜索过滤 -->
    <div class="page-card mt-16">
      <div class="card-header">
        <span class="card-title">场景二 · 搜索过滤</span>
        <el-tag type="info" effect="light">交互筛选</el-tag>
      </div>
      <p class="card-tip">
        在 10 万条基础数据中按关键词过滤。即便结果仍有数万条，虚拟列表也只渲染可视部分，筛选与滚动均流畅。
      </p>
      <div class="demo-form">
        <el-input
          v-model="keyword"
          placeholder="搜索姓名或标签（如：张、VIP）"
          clearable
          style="width: 320px"
          :prefix-icon="Search"
        />
      </div>
      <div class="metrics mt-16">
        <div class="metric-card">
          <div class="metric-label">基础数据</div>
          <div class="metric-value">{{ filterBase.toLocaleString() }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">匹配结果</div>
          <div class="metric-value">{{ filteredItems.length.toLocaleString() }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">渲染节点数</div>
          <div class="metric-value">{{ filterVisibleCount }}</div>
        </div>
      </div>
      <el-empty v-if="!filteredItems.length" description="无匹配数据" class="mt-16" />
      <VirtualList
        v-else
        ref="filterVL"
        class="mt-16"
        :items="filteredItems"
        :item-size="48"
        :height="440"
        @scroll="onFilterScroll"
      >
        <template #default="{ item, index }">
          <div class="vl-row">
            <span class="vl-idx">#{{ String(item.id).padStart(7, '0') }}</span>
            <span class="vl-dot" :style="{ background: statusColor(item.status) }"></span>
            <span class="vl-name" v-html="highlight(item.name)"></span>
            <el-tag size="small" :type="tagType(item.tag)" effect="light">
              <span v-html="highlight(item.tag)"></span>
            </el-tag>
            <span class="vl-status" :style="{ color: statusColor(item.status) }">{{ item.status }}</span>
          </div>
        </template>
      </VirtualList>
    </div>

    <!-- 场景三：无限滚动加载 -->
    <div class="page-card mt-16">
      <div class="card-header">
        <span class="card-title">场景三 · 无限滚动加载</span>
        <el-tag type="warning" effect="light">动态增长</el-tag>
      </div>
      <p class="card-tip">
        滚动到底部时自动加载下一页数据并追加。数据集合不断增长，虚拟列表始终保持性能稳定，适合信息流、时间线等场景。
      </p>
      <div class="demo-form">
        <span class="label">每页加载：</span>
        <el-input-number v-model="infPageSize" :min="100" :step="100" :max="2000" />
        <el-button @click="resetInfinite">重置列表</el-button>
      </div>
      <div class="metrics mt-16">
        <div class="metric-card">
          <div class="metric-label">已加载条数</div>
          <div class="metric-value">{{ infiniteItems.length.toLocaleString() }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">已加载页数</div>
          <div class="metric-value">{{ infinitePage }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">加载状态</div>
          <div class="metric-value" :class="{ loading: infiniteLoading }">
            {{ infiniteNoMore ? '已到底' : infiniteLoading ? '加载中…' : '空闲' }}
          </div>
        </div>
      </div>
      <VirtualList
        class="mt-16"
        :items="infiniteItems"
        :item-size="56"
        :height="480"
        @reach-bottom="loadMore"
      >
        <template #default="{ item, index }">
          <div class="vl-row">
            <span class="vl-idx">#{{ String(index).padStart(7, '0') }}</span>
            <span class="vl-dot" :style="{ background: statusColor(item.status) }"></span>
            <span class="vl-name">{{ item.name }}</span>
            <el-tag size="small" :type="tagType(item.tag)" effect="light">{{ item.tag }}</el-tag>
            <span class="vl-status" :style="{ color: statusColor(item.status) }">{{ item.status }}</span>
          </div>
        </template>
      </VirtualList>
      <div class="inf-footer">{{ infiniteNoMore ? '—— 已经到底啦 ——' : (infiniteLoading ? '加载中…' : '向下滚动加载更多') }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, shallowRef, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Tickets, Search } from '@element-plus/icons-vue'

import VirtualList from './components/VirtualList.vue'

// ===== 数据生成 =====
const FIRST = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗']
const LAST = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞']
const TAGS = ['VIP', '普通', '试用', '企业', '内部']
const STATUS = ['在线', '离线', '忙碌']

const genItem = (i) => ({
  id: i,
  name: FIRST[i % FIRST.length] + LAST[(i * 7) % LAST.length] + '（' + (1000 + (i % 9000)) + '）',
  tag: TAGS[i % TAGS.length],
  status: STATUS[i % STATUS.length],
})

// 用 shallowRef 存大数组，避免 Vue 对每个元素做深度响应式代理
const genItems = (n, offset = 0) => {
  const arr = new Array(n)
  for (let i = 0; i < n; i++) arr[i] = genItem(offset + i)
  return arr
}

const statusColor = (s) =>
  s === '在线' ? '#67c23a' : s === '忙碌' ? '#e6a23c' : '#c0c4cc'
const tagType = (t) =>
  ({ VIP: 'danger', 企业: 'success', 试用: 'warning', 内部: 'info', 普通: '' }[t] || '')

// 简介标签
const scenarios = ['海量数据渲染', '搜索过滤', '无限滚动', '主线程不阻塞', '低内存占用']

// ===== 公共：主线程心跳计数器（用于观察主线程是否被阻塞）=====
const heartCount = ref(0)
const frozen = ref(false)
let heartTimer = null
let lastHeart = 0
heartTimer = setInterval(() => {
  const now = performance.now()
  // 两次心跳间隔明显超过设定周期，说明主线程被阻塞过
  if (lastHeart && now - lastHeart > 320) {
    frozen.value = true
  } else {
    frozen.value = false
  }
  lastHeart = now
  heartCount.value++
}, 200)

// ===== 场景一：海量数据渲染 =====
const useVirtual = ref(true)
// 普通列表模式下的安全渲染上限，避免大数据量直接撑爆浏览器
const NORMAL_CAP = 50000
const bigCount = ref(100000)
const bigItemSize = ref(56)
const bigHeight = ref(480)
const bigItems = shallowRef([])
const bigVL = ref(null)
const bigProgress = ref(0)
const bigVisibleCount = ref(0)

// 普通列表实际渲染的数据（大数据量时做截断保护）
const bigRenderItems = computed(() => {
  const items = bigItems.value
  return items.length > NORMAL_CAP ? items.slice(0, NORMAL_CAP) : items
})
// 当前模式下实际渲染的节点数
const bigRenderedCount = computed(() =>
  useVirtual.value ? bigVisibleCount.value : bigRenderItems.value.length
)

const regenBig = () => {
  bigItems.value = genItems(bigCount.value)
  nextTick(() => bigVL.value?.scrollToIndex(0))
}
const onBigScroll = ({ progress, visibleCount }) => {
  bigProgress.value = Math.round(progress * 100)
  bigVisibleCount.value = visibleCount ?? 0
}
const scrollToTop = () => bigVL.value?.scrollToIndex(0)
const scrollToMiddle = () => bigVL.value?.scrollToIndex(Math.floor(bigItems.value.length / 2))

const bigDomRatio = computed(() => {
  const total = bigItems.value.length
  const rendered = bigRenderedCount.value
  if (!total) return 0
  return Math.max(0, Math.round((rendered / total) * 10000) / 100)
})

// ===== 场景二：搜索过滤 =====
const filterBase = 100000
const filterBaseItems = shallowRef([])
const keyword = ref('')
const filterVL = ref(null)
const filterVisibleCount = ref(0)

const onFilterScroll = ({ visibleCount }) => {
  filterVisibleCount.value = visibleCount ?? 0
}

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return filterBaseItems.value
  const src = filterBaseItems.value
  const res = []
  for (let i = 0; i < src.length; i++) {
    const it = src[i]
    if (it.name.toLowerCase().includes(kw) || it.tag.toLowerCase().includes(kw)) {
      res.push(it)
    }
  }
  return res
})

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const highlight = (text) => {
  const kw = keyword.value.trim()
  if (!kw) return escapeHtml(text)
  const esc = escapeHtml(text)
  const re = new RegExp(escapeHtml(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  return esc.replace(re, (m) => `<mark>${m}</mark>`)
}

watch(keyword, () => {
  nextTick(() => filterVL.value?.scrollToIndex(0))
})

// ===== 场景三：无限滚动加载 =====
const infiniteItems = shallowRef([])
const infinitePage = ref(0)
const infPageSize = ref(500)
const infiniteLoading = ref(false)
const infiniteNoMore = ref(false)
const INF_MAX = 20000

const appendPage = () => {
  const start = infiniteItems.value.length
  const next = genItems(infPageSize.value, start)
  infiniteItems.value = [...infiniteItems.value, ...next]
  infinitePage.value += 1
}

const loadMore = () => {
  if (infiniteLoading.value || infiniteNoMore.value) return
  infiniteLoading.value = true
  // 模拟异步请求
  setTimeout(() => {
    appendPage()
    infiniteLoading.value = false
    if (infiniteItems.value.length >= INF_MAX) infiniteNoMore.value = true
  }, 600)
}

const resetInfinite = () => {
  infiniteItems.value = []
  infinitePage.value = 0
  infiniteLoading.value = false
  infiniteNoMore.value = false
  nextTick(() => appendPage())
}

// ===== 初始化 =====
onMounted(() => {
  regenBig()
  filterBaseItems.value = genItems(filterBase)
  resetInfinite()
})

// 清理心跳定时器
onBeforeUnmount(() => {
  clearInterval(heartTimer)
})
</script>

<style lang="scss" scoped>
.intro-card {
  .intro-head {
    display: flex;
    gap: 16px;
    align-items: flex-start;

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
    }

    .intro-desc {
      font-size: 13px;
      color: #606266;
      line-height: 1.6;
      max-width: 920px;
    }
  }

  .intro-tags {
    margin-top: 16px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.card-tip {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
  margin-bottom: 16px;
}

.demo-form {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  .label {
    font-size: 13px;
    color: #606266;
  }
}

.metrics {
  display: flex;
  gap: 16px;

  .metric-card {
    flex: 1;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    background: #fafbfc;

    .metric-label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 6px;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: #303133;
      font-variant-numeric: tabular-nums;

      &.loading {
        color: #e6a23c;
      }
    }
  }
}

.vl-row {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  font-size: 13px;
  color: #303133;

  .vl-idx {
    font-family: 'Courier New', monospace;
    color: #909399;
    width: 96px;
    flex-shrink: 0;
  }

  .vl-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .vl-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    :deep(mark) {
      background: #fff3cd;
      color: #856404;
      padding: 0 2px;
      border-radius: 2px;
    }
  }

  .vl-status {
    width: 50px;
    flex-shrink: 0;
    text-align: right;
    font-size: 12px;
  }
}

.inf-footer {
  text-align: center;
  padding: 12px;
  color: #909399;
  font-size: 13px;
}

.heartbeat-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 16px;
  padding: 18px 24px;
  border-radius: 10px;
  border: 2px solid #67c23a;
  background: linear-gradient(135deg, #f0f9eb 0%, #ffffff 100%);
  box-shadow: 0 4px 16px rgba(103, 194, 58, 0.18);
  transition: all 0.3s ease;

  .hb-pulse {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border-radius: 50%;
    background: #67c23a;
    animation: hb-pulse 1.4s infinite;
  }

  .hb-info {
    flex: 1;

    .hb-title {
      font-size: 16px;
      font-weight: 700;
      color: #303133;
      margin-bottom: 4px;
    }

    .hb-desc {
      font-size: 12px;
      color: #909399;
      line-height: 1.5;
    }
  }

  .hb-number {
    font-size: 44px;
    font-weight: 800;
    color: #67c23a;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .hb-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #67c23a;

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #67c23a;
    }
  }

  &.frozen {
    border-color: #f56c6c;
    background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
    box-shadow: 0 4px 16px rgba(245, 108, 108, 0.22);

    .hb-pulse {
      background: #f56c6c;
      animation: none;
    }

    .hb-number,
    .hb-status {
      color: #f56c6c;
    }

    .hb-status .status-dot {
      background: #f56c6c;
    }
  }

  @keyframes hb-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.6);
    }
    70% {
      box-shadow: 0 0 0 14px rgba(103, 194, 58, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(103, 194, 58, 0);
    }
  }
}

.normal-list {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  overflow-y: auto;

  .normal-cap-alert {
    margin: 8px;
  }

  .nl-item {
    box-sizing: border-box;
    border-bottom: 1px solid #f5f5f5;
    padding: 0 16px;
    overflow: hidden;
  }
}
</style>
