<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">文件上传记录</span>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>

      <div class="search-bar">
        <el-input
          v-model="query.keyword"
          placeholder="文件名"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 150px" @change="handleSearch">
          <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
        <el-table-column label="大小" width="110">
          <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分片进度" width="180">
          <template #default="{ row }">
            <el-progress
              v-if="row.totalChunks"
              :percentage="chunkPercent(row)"
              :status="row.status === 'completed' ? 'success' : row.status === 'failed' ? 'exception' : ''"
              :stroke-width="8"
            />
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="文件指纹" width="170">
          <template #default="{ row }">
            <span class="hash" :title="row.hash">{{ shortHash(row.hash) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="上传时间" width="170" />
        <el-table-column prop="updateTime" label="更新时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              :disabled="row.status !== 'completed'"
              :loading="previewingId === row.id"
              @click="handlePreview(row)"
            >
              预览
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              :disabled="row.status !== 'completed'"
              :loading="downloadingId === row.id"
              @click="handleDownload(row)"
            >
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="previewVisible" :title="previewName" width="70%" top="6vh" destroy-on-close>
      <FilePreviewer v-if="previewTarget" :initial-file="previewTarget" :show-toolbar="false" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, RefreshLeft, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getUploadList, fetchUploadFile } from '@/api/upload'
import FilePreviewer from './components/FilePreviewer.vue'

// 受浏览器内存限制，过大的文件只提供下载
const PREVIEW_MAX_SIZE = 100 * 1024 * 1024

const statusOptions = [
  { value: 'completed', label: '已完成', type: 'success' },
  { value: 'uploading', label: '上传中', type: 'warning' },
  { value: 'merging', label: '合并中', type: 'warning' },
  { value: 'failed', label: '失败', type: 'danger' },
]
const statusMap = Object.fromEntries(statusOptions.map((s) => [s.value, s]))

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const query = reactive({ keyword: '', status: '', page: 1, pageSize: 10 })

const previewVisible = ref(false)
const previewTarget = ref(null)
const previewName = ref('')
const previewingId = ref(null)
const downloadingId = ref(null)

const formatSize = (bytes) => {
  const n = Number(bytes) || 0
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

const chunkPercent = (row) => {
  if (!row.totalChunks) return 0
  return Math.min(100, Math.round((row.uploadedChunks / row.totalChunks) * 100))
}

const shortHash = (hash) => (hash ? hash.slice(0, 12) + '…' : '—')

const loadData = async () => {
  loading.value = true
  try {
    const res = await getUploadList({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      status: query.status || undefined,
    })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.page = 1
  loadData()
}

const resetQuery = () => {
  query.keyword = ''
  query.status = ''
  query.page = 1
  loadData()
}

const fetchBlob = async (row) => {
  const blob = await fetchUploadFile(row.id)
  if (!(blob instanceof Blob)) throw new Error('响应内容不是文件')
  return blob
}

const handleDownload = async (row) => {
  downloadingId.value = row.id
  try {
    const blob = await fetchBlob(row)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = row.fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (e) {
    ElMessage.error('文件下载失败')
  } finally {
    downloadingId.value = null
  }
}

const handlePreview = async (row) => {
  if (Number(row.fileSize) > PREVIEW_MAX_SIZE) {
    ElMessage.warning('文件较大，建议下载后查看')
    return
  }
  previewingId.value = row.id
  try {
    const blob = await fetchBlob(row)
    previewTarget.value = new File([blob], row.fileName, { type: blob.type || 'application/octet-stream' })
    previewName.value = row.fileName
    previewVisible.value = true
  } catch (e) {
    ElMessage.error('文件加载失败')
  } finally {
    previewingId.value = null
  }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.muted {
  color: #c0c4cc;
}

.hash {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #606266;
}
</style>
