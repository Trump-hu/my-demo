<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">流程管理</span>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新建流程</el-button>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input v-model="query.keyword" placeholder="流程名称/编号" clearable style="width:220px" @keyup.enter="loadData" />
        <el-select v-model="query.category" placeholder="流程分类" clearable style="width:160px">
          <el-option label="数据采集" value="数据采集" />
          <el-option label="文档处理" value="文档处理" />
          <el-option label="系统运维" value="系统运维" />
          <el-option label="业务自动化" value="业务自动化" />
        </el-select>
        <el-select v-model="query.status" placeholder="状态" clearable style="width:120px">
          <el-option label="已发布" value="published" />
          <el-option label="草稿" value="draft" />
          <el-option label="已下线" value="offline" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
        <el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button>
      </div>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="tableData" border stripe style="width:100%">
        <el-table-column prop="code" label="流程编号" width="120" />
        <el-table-column prop="name" label="流程名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="runCount" label="运行次数" width="100" />
        <el-table-column label="成功率" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.successRate >= 95 ? '#67c23a' : row.successRate >= 85 ? '#e6a23c' : '#f56c6c' }">
              {{ row.successRate }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="80" />
        <el-table-column prop="updateTime" label="更新时间" width="160" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleMonitor(row)">
              <el-icon><Monitor /></el-icon>监控
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" size="small" @click="handlePublish(row)" v-if="row.status==='draft'">发布</el-button>
            <el-button link type="warning" size="small" @click="handleRun(row)">运行</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, RefreshLeft, Monitor } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProcessList, saveProcess, deleteProcess } from '@/api/process'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const query = reactive({
  keyword: '',
  category: '',
  status: '',
  page: 1,
  pageSize: 10,
})

const statusType = (s) => ({ published: 'success', draft: 'info', offline: 'danger' }[s] || 'info')
const statusText = (s) => ({ published: '已发布', draft: '草稿', offline: '已下线' }[s] || s)

const loadData = async () => {
  loading.value = true
  try {
    const res = await getProcessList(query)
    tableData.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  query.keyword = ''
  query.category = ''
  query.status = ''
  query.page = 1
  loadData()
}

// 跳转监控页（打开新Tab）
const handleMonitor = (row) => {
  router.push(`/process/monitor/${row.id}`)
}

// 跳转新增页（打开新Tab）
const handleAdd = () => {
  router.push('/process/edit')
}

// 跳转编辑页（打开新Tab）
const handleEdit = (row) => {
  router.push(`/process/edit/${row.id}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除流程「${row.name}」吗？`, '提示', {
    type: 'warning',
  }).then(async () => {
    await deleteProcess(row.id)
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

const handlePublish = (row) => {
  ElMessageBox.confirm(`确定要发布流程「${row.name}」吗？`, '提示', {
    type: 'warning',
  }).then(async () => {
    await saveProcess({ ...row, status: 'published' })
    ElMessage.success('发布成功')
    loadData()
  }).catch(() => {})
}

const handleRun = (row) => {
  ElMessage.success(`流程「${row.name}」已开始运行`)
}

onMounted(() => loadData())
</script>
