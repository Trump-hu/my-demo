<template>
  <div class="page-container">
    <!-- 简介 -->
    <div class="page-card intro-card">
      <div class="intro-head">
        <el-icon :size="32" color="#1a73e8"><UploadFilled /></el-icon>
        <div>
          <h2>大文件上传实际使用场景</h2>
          <p class="intro-desc">
            大文件直接整包上传存在易超时、断网即失败、无法续传等问题。生产中通常采用
            <b>切片上传 + 断点续传 + 并发上传 + 秒传</b> 的组合方案。本页演示完整流程，
            并通过 Web Worker 计算文件指纹，避免主线程阻塞。
          </p>
        </div>
      </div>
      <div class="intro-tags">
        <el-tag v-for="t in scenarios" :key="t" type="info" effect="plain">{{ t }}</el-tag>
      </div>
    </div>

    <!-- 方法对比 -->
    <div class="page-card mt-16">
      <div class="card-header">
        <span class="card-title">上传方法对比</span>
        <el-tag type="info" effect="light">不同方法</el-tag>
      </div>
      <el-table :data="methods" border size="small" class="mt-16">
        <el-table-column prop="name" label="方法" width="160">
          <template #default="{ row }">
            <el-tag :type="row.tagType" effect="light">{{ row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resume" label="断点续传" width="120" align="center">
          <template #default="{ row }">
            <el-icon :color="row.resume ? '#67c23a' : '#f56c6c'">
              <CircleCheck v-if="row.resume" /><CircleClose v-else />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="concurrent" label="并发上传" width="120" align="center">
          <template #default="{ row }">
            <el-icon :color="row.concurrent ? '#67c23a' : '#f56c6c'">
              <CircleCheck v-if="row.concurrent" /><CircleClose v-else />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="bigFriendly" label="大文件友好" width="130" align="center">
          <template #default="{ row }">
            <el-rate v-model="row.bigFriendly" disabled size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="complexity" label="实现复杂度" width="130" align="center" />
        <el-table-column prop="desc" label="说明" />
      </el-table>
    </div>

    <!-- 核心演示：切片上传 -->
    <div class="page-card mt-16">
      <div class="card-header">
        <span class="card-title">场景 · 切片上传 + 断点续传 + 并发 + 秒传</span>
        <el-tag type="warning" effect="light">核心演示</el-tag>
      </div>
      <p class="card-tip">
        选择本地文件或生成一个模拟大文件，配置切片大小与并发数。流程：Web Worker 计算文件指纹 →
        请求后端做秒传/断点续传检查 → 并发上传分片（真实请求 /api/upload/chunk，失败自动重试）→
        暂停后继续（服务端已保存的分片会跳过）→ 合并分片（/api/upload/merge）。
      </p>

      <!-- 配置区 -->
      <div class="demo-form">
        <el-button type="primary" @click="pickFile">
          <el-icon><Upload /></el-icon>选择文件
        </el-button>
        <el-button @click="genFakeFile">生成模拟大文件</el-button>
        <input ref="fileInputRef" type="file" class="hidden-input" @change="onFileChange" />
        <el-select v-model="fakeSize" style="width: 140px" placeholder="模拟大小">
            <el-option label="50 MB" :value="50" />
            <el-option label="100 MB" :value="100" />
          <el-option label="200 MB" :value="200" />
          <el-option label="500 MB" :value="500" />
        </el-select>
        <span class="label">切片大小：</span>
        <el-select v-model="chunkSize" style="width: 130px" :disabled="uploading || hashing">
            <el-option label="5 MB" :value="5" />
            <el-option label="10 MB" :value="10" />
            <el-option label="20 MB" :value="20" />
            <el-option label="50 MB" :value="50" />
            <el-option label="100 MB" :value="100" />
        </el-select>
        <span class="label">并发数：</span>
        <el-input-number v-model="concurrency" :min="1" :max="10" />
        <span class="label">模拟失败率：</span>
        <el-input-number v-model="failRate" :min="0" :max="50" :step="5" />%
      </div>

      <!-- 文件信息 -->
      <div v-if="file" class="file-info mt-16">
        <div class="fi-main">
          <el-icon :size="28" color="#1a73e8"><Document /></el-icon>
          <div class="fi-text">
            <div class="fi-name">{{ file.name }}</div>
            <div class="fi-meta">
              {{ formatSize(file.size) }} · {{ chunkList.length }} 个分片（{{ formatSize(chunkSize * 1024 * 1024) }} / 片）
            </div>
          </div>
          <div class="fi-hash">
            <span class="fi-hash-label">文件指纹</span>
            <span class="fi-hash-value" :class="hashStatus">{{ hashDisplay }}</span>
          </div>
        </div>
        <div class="fi-progress">
          <el-progress
            :percentage="overallProgress"
            :status="progressStatus"
            :stroke-width="14"
            :text-inside="true"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="file" class="actions mt-16">
        <el-button
          type="primary"
          :disabled="!canStart || uploading || merging"
          :loading="hashing || merging"
          @click="start"
        >
          {{ merging ? '合并中…' : hashing ? '计算指纹中…' : '开始上传' }}
        </el-button>
        <el-button type="warning" :disabled="!uploading" @click="pause">暂停</el-button>
        <el-button type="success" :disabled="!paused || merging" @click="resume">继续</el-button>
        <el-button :disabled="!file || merging || (uploading && !paused)" @click="reset()">重置</el-button>
      </div>

      <!-- 状态提示 -->
      <el-alert
        v-if="instantHit"
        class="mt-16"
        type="success"
        :closable="false"
        show-icon
        title="秒传成功"
        description="服务器已存在相同指纹的文件，本次上传被跳过。"
      />
      <el-alert
        v-if="completed && !instantHit"
        class="mt-16"
        type="success"
        :closable="false"
        show-icon
        title="上传完成"
        :description="`全部 ${chunkList.length} 个分片上传成功，服务端已合并。`"
      />

      <!-- 分片列表 -->
      <div v-if="chunkList.length" class="chunk-grid mt-16">
        <div
          v-for="c in chunkList"
          :key="c.index"
          class="chunk-cell"
          :class="c.status"
          :title="`分片 #${c.index + 1}：${statusText(c)}`"
        >
          <span class="cc-idx">{{ c.index + 1 }}</span>
          <span class="cc-progress">{{ Math.round(c.progress) }}%</span>
        </div>
        <div class="legend">
          <span class="lg-item"><i class="dot pending"></i>待上传</span>
          <span class="lg-item"><i class="dot uploading"></i>上传中</span>
          <span class="lg-item"><i class="dot success"></i>已完成</span>
          <span class="lg-item"><i class="dot skipped"></i>已跳过</span>
          <span class="lg-item"><i class="dot error"></i>失败</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, shallowRef, watch, onBeforeUnmount } from 'vue'
import { UploadFilled, Upload, Document, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { checkUpload, uploadChunk, mergeUpload } from '@/api/upload'

// ===== 方法对比数据 =====
const scenarios = ['切片上传', '断点续传', '并发上传', '秒传', 'Web Worker 计算指纹']
const methods = [
  { name: '普通直传', resume: false, concurrent: false, bigFriendly: 1, complexity: '低', desc: '整文件一次请求，简单但大文件易超时、断网即失败、无法续传。', tagType: 'info' },
  { name: '切片上传', resume: true, concurrent: true, bigFriendly: 4, complexity: '中', desc: '将文件切为多个分片分别上传，可并发、可重试，大文件友好。', tagType: '' },
  { name: '断点续传', resume: true, concurrent: true, bigFriendly: 5, complexity: '中高', desc: '基于切片，上传前/暂停后查询已完成分片并跳过，网络中断可恢复。', tagType: 'success' },
  { name: '秒传', resume: true, concurrent: true, bigFriendly: 5, complexity: '高', desc: '通过文件指纹比对，若服务端已存在相同文件则直接完成，无需传输。', tagType: 'warning' },
]

// ===== 配置 =====
const fakeSize = ref(50)
const chunkSize = ref(5)
const concurrency = ref(3)
const failRate = ref(0)

// 每次开始/重置自增，用于作废旧的上传流程，避免旧任务污染新任务
let runToken = 0

// ===== 文件与分片 =====
const fileInputRef = ref(null)
const file = shallowRef(null)
const chunkList = ref([]) // { index, start, end, status, progress, retries }
const fileHash = ref('')
const hashing = ref(false)
const uploading = ref(false)
const paused = ref(false)
const completed = ref(false)
const instantHit = ref(false)
const merging = ref(false)

const hashStatus = computed(() => (fileHash.value ? 'ok' : hashing.value ? 'loading' : 'pending'))
const hashDisplay = computed(() => {
  if (fileHash.value) return fileHash.value.slice(0, 16) + '…'
  if (hashing.value) return '计算中…'
  return '尚未计算'
})

const totalChunks = computed(() => chunkList.value.length)
const doneChunks = computed(() => chunkList.value.filter((c) => c.status === 'success' || c.status === 'skipped').length)
const overallProgress = computed(() => {
  if (!totalChunks.value) return 0
  if (instantHit.value) return 100
  return Math.round((doneChunks.value / totalChunks.value) * 100)
})
const progressStatus = computed(() => {
  if (completed.value || instantHit.value) return 'success'
  if (chunkList.value.some((c) => c.status === 'error')) return 'exception'
  return ''
})
const canStart = computed(() => !!file.value && !completed.value && !instantHit.value)

const statusText = (c) => ({
  pending: '待上传', uploading: '上传中', success: '已完成', skipped: '已跳过（断点续传）', error: '失败',
}[c.status] || c.status)

// ===== 工具函数 =====
const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

// ===== 服务端状态 =====
// 秒传与断点续传状态由后端维护（/api/upload/check 返回已上传分片）

// ===== 文件选择 / 生成 =====
const pickFile = () => fileInputRef.value && fileInputRef.value.click()
const onFileChange = (e) => {
  const f = e.target.files && e.target.files[0]
  if (f) setFile(f)
  e.target.value = ''
}

// 轻量"虚拟大文件"：size 与真实体积一致，slice 时才按需生成数据，不预先占用内存
const PATTERN_LEN = 251
const FILE_PATTERN = new Uint8Array(PATTERN_LEN)
for (let i = 0; i < PATTERN_LEN; i++) FILE_PATTERN[i] = i

class VirtualFile {
  constructor(name, size) {
    this.name = name
    this.size = size
    this.type = 'application/octet-stream'
    this.lastModified = 0 // 固定值：同样大小生成的文件指纹一致，便于演示秒传
  }

  slice(start = 0, end = this.size) {
    const from = Math.max(0, Math.min(start, this.size))
    const to = Math.max(from, Math.min(end, this.size))
    const len = to - from
    const buf = new Uint8Array(len)
    // 内容只与文件内绝对偏移有关（位置 % 251），与 Worker 中的生成逻辑保持一致
    let offset = 0
    while (offset < len) {
      const shift = (from + offset) % PATTERN_LEN
      const take = Math.min(PATTERN_LEN - shift, len - offset)
      buf.set(FILE_PATTERN.subarray(shift, shift + take), offset)
      offset += take
    }
    return new Blob([buf], { type: this.type })
  }
}

const genFakeFile = () => {
  const size = fakeSize.value * 1024 * 1024
  setFile(new VirtualFile(`fake-${fakeSize.value}MB.bin`, size))
}

const setFile = (f) => {
  reset(true)
  file.value = f
  buildChunks(f)
}

const buildChunks = (f) => {
  const size = chunkSize.value * 1024 * 1024
  const total = f.size
  const list = []
  let index = 0
  for (let start = 0; start < total; start += size) {
    const end = Math.min(start + size, total)
    list.push({ index, start, end, status: 'pending', progress: 0, retries: 0 })
    index++
  }
  chunkList.value = list
}

// ===== Web Worker 计算文件指纹 =====
let hashWorker = null
let hashAbort = null

// 重置时要能打断进行中的指纹计算，否则 Promise 永远不会 settle
const abortHash = (reason) => {
  if (hashWorker) {
    hashWorker.terminate()
    hashWorker = null
  }
  if (hashAbort) {
    const reject = hashAbort
    hashAbort = null
    reject(reason || new Error('已取消'))
  }
}

const computeHash = () =>
  new Promise((resolve, reject) => {
    if (!file.value) return reject(new Error('无文件'))
    const f = file.value
    const sampleSize = 1024 * 64 // 每段取样 64KB
    const positions = [0, Math.floor(f.size / 2), Math.max(0, f.size - sampleSize)]
    const worker = new Worker(new URL('./workers/file-hash.worker.js', import.meta.url))
    hashWorker = worker
    hashAbort = reject
    const finish = (fn, arg) => {
      worker.terminate()
      if (hashWorker === worker) hashWorker = null
      if (hashAbort === reject) hashAbort = null
      fn(arg)
    }
    worker.onmessage = (e) => {
      if (e.data.error) finish(reject, new Error(e.data.error))
      else finish(resolve, e.data.hash)
    }
    worker.onerror = (err) => finish(reject, err)
    // VirtualFile 不是真正的 File（方法无法被结构化克隆），只把元信息交给 Worker 自行生成采样数据
    const payload = { samplePositions: positions, sampleSize }
    if (f instanceof VirtualFile) {
      payload.virtual = { name: f.name, size: f.size, lastModified: f.lastModified }
    } else {
      payload.file = f
    }
    worker.postMessage(payload)
  })

// ===== 上传流程 =====
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const toBytes = (mb) => mb * 1024 * 1024

// 正在进行的分片请求，暂停 / 重置时统一中断
const activeControllers = new Set()
const abortActiveRequests = () => {
  activeControllers.forEach((c) => c.abort())
  activeControllers.clear()
}

// 上传单个分片：真实请求 /api/upload/chunk，由 axios 的 onUploadProgress 驱动进度
const uploadOne = async (chunk, hash, isCanceled) => {
  if (isCanceled()) return 'canceled'
  // 模拟失败率：发请求前主动失败一次，用于演示失败重试
  if (failRate.value > 0 && Math.random() * 100 < failRate.value) {
    chunk.status = 'error'
    return 'error'
  }

  const controller = new AbortController()
  activeControllers.add(controller)
  chunk.status = 'uploading'
  chunk.progress = 0
  try {
    await uploadChunk({
      hash,
      index: chunk.index,
      totalChunks: chunkList.value.length,
      chunkSize: toBytes(chunkSize.value),
      fileName: file.value.name,
      fileSize: file.value.size,
      blob: file.value.slice(chunk.start, chunk.end),
      signal: controller.signal,
      onProgress: (p) => {
        chunk.progress = Math.max(chunk.progress, p)
      },
    })
    chunk.progress = 100
    chunk.status = 'success'
    return 'success'
  } catch (e) {
    if (isCanceled() || controller.signal.aborted) {
      // 暂停时中断的分片服务端不会保留，继续时需重新上传
      chunk.status = 'pending'
      chunk.progress = 0
      return 'paused'
    }
    chunk.status = 'error'
    return 'error'
  } finally {
    activeControllers.delete(controller)
  }
}

// 带重试的分片上传：失败后最多重试 2 次
const uploadWithRetry = async (chunk, hash, isCanceled) => {
  const maxRetry = 2
  for (let attempt = 0; attempt <= maxRetry; attempt++) {
    if (attempt > 0) {
      chunk.progress = 0
      chunk.status = 'pending'
      await sleep(300)
    }
    if (isCanceled()) return 'canceled'
    chunk.retries = attempt
    const result = await uploadOne(chunk, hash, isCanceled)
    if (result !== 'error') return result
  }
  return 'error'
}

// 并发池：myRun 与 runToken 不一致说明流程已作废（重置或新任务接管）
const runPool = async (hash, myRun) => {
  const isCanceled = () => myRun !== runToken || paused.value
  const pendingChunks = chunkList.value.filter((c) => c.status === 'pending')
  let cursor = 0
  const workers = new Array(Math.max(1, concurrency.value)).fill(0).map(async () => {
    while (cursor < pendingChunks.length) {
      if (isCanceled()) return
      const c = pendingChunks[cursor++]
      await uploadWithRetry(c, hash, isCanceled)
    }
  })
  await Promise.all(workers)
}

const start = async () => {
  if (!file.value) return
  const myRun = ++runToken
  paused.value = false
  instantHit.value = false
  completed.value = false

  // 1. 计算指纹
  if (!fileHash.value) {
    hashing.value = true
    let hash = ''
    try {
      hash = await computeHash()
    } catch (e) {
      if (myRun !== runToken) return // 被重置打断，静默退出
      hashing.value = false
      ElMessage.error('计算文件指纹失败：' + (e.message || e))
      return
    }
    if (myRun !== runToken) return
    hashing.value = false
    fileHash.value = hash
  }

  // 2. 秒传 + 断点续传检查（真实请求后端）
  let remote
  try {
    const res = await checkUpload({
      hash: fileHash.value,
      fileName: file.value.name,
      fileSize: file.value.size,
      chunkSize: toBytes(chunkSize.value),
    })
    remote = res.data || {}
  } catch (e) {
    // 错误提示已由 request 拦截器统一弹出
    return
  }
  if (myRun !== runToken) return

  if (remote.exists) {
    instantHit.value = true
    chunkList.value.forEach((c) => { c.status = 'skipped'; c.progress = 100 })
    ElMessage.success('秒传成功：服务端已存在相同文件')
    return
  }

  // 3. 断点续传：服务端已保存的分片直接跳过
  const uploaded = new Set(remote.uploadedChunks || [])
  chunkList.value.forEach((c) => {
    if (uploaded.has(c.index)) {
      c.status = 'skipped'
      c.progress = 100
      return
    }
    if (c.status !== 'pending' || c.progress >= 100) {
      c.status = 'pending'
      c.progress = 0
    }
  })

  // 4. 并发上传
  uploading.value = true
  await runPool(fileHash.value, myRun)
  if (myRun !== runToken) return // 已被重置/新任务接管，不要改动状态
  uploading.value = false

  // 5. 结果处理：全部分片就绪后请求合并
  if (paused.value) return
  const hasError = chunkList.value.some((c) => c.status === 'error')
  if (hasError) {
    ElMessage.error('分片上传失败，可点击"继续"重试失败分片')
    return
  }
  const allDone = chunkList.value.every((c) => c.status === 'success' || c.status === 'skipped')
  if (!allDone || !chunkList.value.length) return

  merging.value = true
  try {
    await mergeUpload(fileHash.value)
    if (myRun !== runToken) return
    completed.value = true
    ElMessage.success('上传完成')
  } catch (e) {
    // 错误提示已由 request 拦截器统一弹出
  } finally {
    if (myRun === runToken) merging.value = false
  }
}

const pause = () => {
  paused.value = true
  abortActiveRequests()
  ElMessage.info('已暂停，已完成的分片会被保留')
}
const resume = () => {
  paused.value = false
  start()
}
const reset = (silent = false) => {
  runToken++ // 作废进行中的上传流程
  abortHash()
  abortActiveRequests()
  uploading.value = false
  merging.value = false
  paused.value = false
  hashing.value = false
  completed.value = false
  instantHit.value = false
  fileHash.value = ''
  chunkList.value = []
  if (!silent) file.value = null
}

// 切片大小变化后需要重建分片列表，否则分片数量与显示不一致
watch(chunkSize, () => {
  if (!file.value || uploading.value || paused.value) return
  completed.value = false
  instantHit.value = false
  buildChunks(file.value)
})

onBeforeUnmount(() => {
  runToken++
  abortHash()
  abortActiveRequests()
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

      b {
        color: #303133;
      }
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

.hidden-input {
  display: none;
}

.file-info {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  background: #fafbfc;

  .fi-main {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;
  }

  .fi-text {
    flex: 1;
  }

  .fi-name {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    word-break: break-all;
  }

  .fi-meta {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .fi-hash {
    text-align: right;

    .fi-hash-label {
      display: block;
      font-size: 12px;
      color: #909399;
      margin-bottom: 2px;
    }

    .fi-hash-value {
      font-family: 'Courier New', monospace;
      font-size: 13px;

      &.ok { color: #67c23a; }
      &.loading { color: #e6a23c; }
      &.pending { color: #c0c4cc; }
    }
  }
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.chunk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 6px;

  .chunk-cell {
    aspect-ratio: 1;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #fff;
    border: 1px solid transparent;
    transition: all 0.2s;

    .cc-idx { font-weight: 700; }
    .cc-progress { opacity: 0.85; }

    &.pending { background: #dcdfe6; color: #606266; }
    &.uploading { background: #e6a23c; }
    &.success { background: #67c23a; }
    &.skipped { background: #95d475; border: 1px dashed #67c23a; }
    &.error { background: #f56c6c; }
  }

  .legend {
    grid-column: 1 / -1;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 8px;
    font-size: 12px;
    color: #606266;

    .lg-item { display: flex; align-items: center; gap: 6px; }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      display: inline-block;
      &.pending { background: #dcdfe6; }
      &.uploading { background: #e6a23c; }
      &.success { background: #67c23a; }
      &.skipped { background: #95d475; border: 1px dashed #67c23a; }
      &.error { background: #f56c6c; }
    }
  }
}
</style>
