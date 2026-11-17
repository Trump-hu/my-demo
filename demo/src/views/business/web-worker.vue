<template>
  <div class="page-container">
    <!-- 简介 -->
    <div class="page-card intro-card">
      <div class="intro-head">
        <el-icon :size="32" color="#1a73e8"><Cpu /></el-icon>
        <div>
          <h2>Web Worker 实际使用场景</h2>
          <p class="intro-desc">
            Web Worker 允许在主线程之外运行脚本，适合处理 CPU 密集型计算、大数据处理、后台定时任务等场景，
            避免长时间任务阻塞 UI 导致页面卡顿。下面是三个常见的实际业务场景演示。
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
          计数器持续跳动表示主线程流畅；执行下方“在主线程”任务时它会停顿（主线程被阻塞），
          而用 Worker 执行同类任务时它始终保持跳动。
        </div>
      </div>
      <div class="hb-number">{{ heartCount }}</div>
      <div class="hb-status">
        <span class="status-dot"></span>
        {{ frozen ? '已停顿' : '运行中' }}
      </div>
    </div>

    <!-- 场景一：CPU 密集计算对比 -->
    <div class="page-card mt-16">
      <div class="card-header">
        <span class="card-title">场景一 · CPU 密集计算（不阻塞 UI）</span>
        <el-tag type="warning" effect="light">对比演示</el-tag>
      </div>
      <p class="card-tip">
        在 [2, N] 范围内计算素数。用主线程计算时上方“心跳计数器”会停顿（UI 被阻塞），
        用 Worker 计算时计数器持续跳动（UI 不受影响）。
      </p>
      <div class="demo-form">
        <span class="label">计算上限 N：</span>
        <el-input-number v-model="primeMax" :min="10000" :max="5000000" :step="10000" />
        <el-button type="danger" plain :loading="mainBusy" @click="calcOnMain">
          在主线程计算
        </el-button>
        <el-button type="primary" :loading="primeBusy" @click="calcOnWorker">
          在 Worker 中计算
        </el-button>
      </div>
      <el-alert
        v-if="primeResult"
        :title="primeResultLabel"
        :description="`耗时 ${primeResult.time.toFixed(0)} ms`"
        :type="primeResultLabel.includes('Worker') ? 'success' : 'error'"
        show-icon
        class="mt-16"
      />
    </div>

    <!-- 场景二：大数据排序 -->
    <div class="page-card mt-16">
      <div class="card-header">
        <span class="card-title">场景二 · 大数据排序</span>
        <el-tag type="warning" effect="light">对比演示</el-tag>
      </div>
      <p class="card-tip">
        生成并排序海量随机数组。用主线程排序时上方“心跳计数器”会停顿（页面卡死），
        用 Worker 排序时计数器持续跳动（页面可交互）。
      </p>
      <div class="demo-form">
        <span class="label">数据量：</span>
        <el-select v-model="sortCount" style="width: 180px">
          <el-option label="10 万条" :value="100000" />
          <el-option label="100 万条" :value="1000000" />
          <el-option label="500 万条" :value="5000000" />
        </el-select>
        <el-button type="danger" plain :loading="sortMainBusy" @click="sortOnMain">
          在主线程排序
        </el-button>
        <el-button type="primary" :loading="sortBusy" @click="sortInWorker">
          在 Worker 中排序
        </el-button>
        <el-button v-if="sortBusy" text type="danger" @click="terminateSort">终止任务</el-button>
      </div>
      <el-alert
        v-if="sortResult"
        :title="sortResultLabel"
        :description="`耗时 ${sortResult.time.toFixed(0)} ms`"
        :type="sortResult.by === 'Worker' ? 'success' : 'error'"
        show-icon
        class="mt-16"
      />
      <div v-if="sortResult" class="sort-result mt-16">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="已排序条数">{{ sortCount.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ sortResult.time.toFixed(0) }} ms</el-descriptions-item>
          <el-descriptions-item label="前 10 个值（最小）">
            {{ sortResult.head.map(v => v.toFixed(6)).join(', ') }}
          </el-descriptions-item>
          <el-descriptions-item label="后 10 个值（最大）">
            {{ sortResult.tail.map(v => v.toFixed(6)).join(', ') }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <!-- 场景三：后台轮询 / 心跳 -->
    <div class="page-card mt-16">
      <div class="card-header">
        <span class="card-title">场景三 · 后台轮询（模拟实时监控）</span>
        <el-tag type="info" effect="light">定时任务</el-tag>
      </div>
      <p class="card-tip">
        Worker 后台按固定间隔“拉取”模拟指标，主线程只负责接收并渲染。适合实时监控、长轮询、心跳保活等场景。
      </p>
      <div class="demo-form">
        <span class="label">轮询间隔：</span>
        <el-input-number v-model="pollInterval" :min="200" :step="200" :max="5000" />
        <el-button v-if="!polling" type="primary" @click="startPolling">启动轮询</el-button>
        <el-button v-else type="danger" @click="stopPolling">停止轮询</el-button>
      </div>
      <div v-if="polling" class="metrics mt-16">
        <div class="metric-card">
          <div class="metric-label">已接收心跳</div>
          <div class="metric-value">{{ latest?.tick ?? 0 }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">模拟 CPU (%)</div>
          <div class="metric-value">{{ latest?.cpu ?? 0 }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">模拟 QPS</div>
          <div class="metric-value">{{ latest?.qps ?? 0 }}</div>
        </div>
      </div>
      <div v-if="polling" class="log-box mt-16">
        <div class="log-head">实时日志流（最近 8 条）</div>
        <div class="log-list">
          <div v-for="(line, i) in logs" :key="i" class="log-line">#{{ line.tick }} · {{ line.time }} · CPU {{ line.cpu }}% · QPS {{ line.qps }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { Cpu } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// ===== 公共：主线程心跳计数器（用于观察主线程是否被阻塞）=====
const heartCount = ref(0)
const frozen = ref(false)
let heartTimer = null
let lastHeart = 0
heartTimer = setInterval(() => {
  const now = performance.now()
  // 如果两次心跳间隔明显超过设定周期，说明主线程被阻塞过
  if (lastHeart && now - lastHeart > 320) {
    frozen.value = true
  } else {
    frozen.value = false
  }
  lastHeart = now
  heartCount.value++
}, 200)

// ===== 场景一：素数计算 =====
const primeMax = ref(500000)
const primeBusy = ref(false)
const mainBusy = ref(false)
const primeResult = ref(null)

const primeWorker = new Worker(new URL('./workers/prime.worker.js', import.meta.url))
primeWorker.onmessage = (e) => {
  primeResult.value = { ...e.data, by: 'Worker' }
  primeBusy.value = false
}

// 纯素数计算逻辑（与 worker 内一致），用于主线程对比
const computePrimes = (max) => {
  const primes = []
  for (let n = 2; n <= max; n++) {
    let isPrime = true
    const limit = Math.sqrt(n)
    for (let i = 2; i <= limit; i++) {
      if (n % i === 0) {
        isPrime = false
        break
      }
    }
    if (isPrime) primes.push(n)
  }
  return primes
}

const calcOnWorker = () => {
  primeResult.value = null
  primeBusy.value = true
  primeWorker.postMessage({ max: primeMax.value })
}

const calcOnMain = () => {
  primeResult.value = null
  mainBusy.value = true
  // 让 UI 先渲染一次“计算中”状态，再在主线程执行阻塞计算
  setTimeout(() => {
    const t0 = performance.now()
    const primes = computePrimes(primeMax.value)
    const time = performance.now() - t0
    primeResult.value = { count: primes.length, time, sample: primes.slice(0, 20), by: '主线程' }
    mainBusy.value = false
  }, 50)
}

const primeResultLabel = computed(() =>
  primeResult.value
    ? `${primeResult.value.by === 'Worker' ? 'Worker' : '主线程'}完成：共找到 ${primeResult.value.count} 个素数`
    : ''
)

// ===== 场景二：大数据排序 =====
const sortCount = ref(1000000)
const sortBusy = ref(false)
const sortMainBusy = ref(false)
const sortResult = ref(null)
let sortWorker = null

const sortInWorker = () => {
  if (sortWorker) sortWorker.terminate()
  sortResult.value = null
  sortBusy.value = true
  sortWorker = new Worker(new URL('./workers/sort.worker.js', import.meta.url))
  sortWorker.onmessage = (e) => {
    sortResult.value = { ...e.data, by: 'Worker' }
    sortBusy.value = false
  }
  sortWorker.postMessage({ count: sortCount.value })
}

// 主线程排序：生成并排序海量随机数组，与 worker 内逻辑一致，用于对比 UI 阻塞情况
const sortOnMain = () => {
  sortResult.value = null
  sortMainBusy.value = true
  // 让 UI 先渲染一次“计算中”状态，再在主线程执行阻塞计算
  setTimeout(() => {
    const t0 = performance.now()
    const arr = new Array(sortCount.value)
    for (let i = 0; i < arr.length; i++) arr[i] = Math.random()
    arr.sort((a, b) => a - b)
    const time = performance.now() - t0
    sortResult.value = { time, head: arr.slice(0, 10), tail: arr.slice(-10), by: '主线程' }
    sortMainBusy.value = false
  }, 50)
}

const sortResultLabel = computed(() =>
  sortResult.value
    ? `${sortResult.value.by === 'Worker' ? 'Worker' : '主线程'}完成：已排序 ${sortCount.value.toLocaleString()} 条`
    : ''
)

const terminateSort = () => {
  if (sortWorker) {
    sortWorker.terminate()
    sortWorker = null
  }
  sortBusy.value = false
  ElMessage.warning('已终止排序任务')
}

// ===== 场景三：后台轮询 =====
const pollInterval = ref(1000)
const polling = ref(false)
const latest = ref(null)
const logs = ref([])
let pollWorker = null

const startPolling = () => {
  if (pollWorker) pollWorker.terminate()
  logs.value = []
  latest.value = null
  polling.value = true
  pollWorker = new Worker(new URL('./workers/heartbeat.worker.js', import.meta.url))
  pollWorker.onmessage = (e) => {
    if (e.data.stopped) {
      polling.value = false
      return
    }
    latest.value = e.data
    logs.value.unshift({ ...e.data, time: new Date(e.data.time).toLocaleTimeString() })
    if (logs.value.length > 8) logs.value.pop()
  }
  pollWorker.postMessage({ cmd: 'start', interval: pollInterval.value })
}

const stopPolling = () => {
  if (pollWorker) {
    pollWorker.postMessage({ cmd: 'stop' })
    pollWorker.terminate()
    pollWorker = null
  }
  polling.value = false
}

// ===== 清理资源 =====
onBeforeUnmount(() => {
  clearInterval(heartTimer)
  primeWorker.terminate()
  if (sortWorker) sortWorker.terminate()
  if (pollWorker) pollWorker.terminate()
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
      max-width: 900px;
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

.sort-result {
  :deep(.el-descriptions__label) {
    width: 160px;
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
      font-size: 26px;
      font-weight: 700;
      color: #303133;
      font-variant-numeric: tabular-nums;
    }
  }
}

.log-box {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;

  .log-head {
    background: #f5f7fa;
    padding: 8px 12px;
    font-size: 12px;
    color: #606266;
    border-bottom: 1px solid #ebeef5;
  }

  .log-list {
    padding: 8px 12px;
    max-height: 200px;
    overflow-y: auto;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.8;
    color: #606266;
  }
}
</style>
