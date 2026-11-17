<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">任务管理</span>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新建任务</el-button>
      </div>

      <div class="search-bar">
        <el-input v-model="query.keyword" placeholder="任务名称" clearable style="width:220px" @keyup.enter="loadData" />
        <el-select v-model="query.status" placeholder="状态" clearable style="width:120px">
          <el-option label="待执行" value="pending" />
          <el-option label="运行中" value="running" />
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
          <el-option label="已停止" value="stopped" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
        <el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border stripe style="width:100%">
        <el-table-column prop="name" label="任务名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="processName" label="关联流程" width="160" show-overflow-tooltip />
        <el-table-column prop="robotName" label="执行机器人" width="130" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="priorityType(row.priority)" size="small" effect="plain">{{ priorityText(row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="触发方式" width="100">
          <template #default="{ row }">{{ triggerText(row.triggerType) }}</template>
        </el-table-column>
        <el-table-column prop="cron" label="调度表达式" width="130" show-overflow-tooltip />
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column prop="creator" label="创建人" width="80" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" size="small" @click="handleStart(row)" v-if="['pending','stopped','failed'].includes(row.status)">启动</el-button>
            <el-button link type="warning" size="small" @click="handleStop(row)" v-if="['pending','running'].includes(row.status)">停止</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
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
import { Plus, Search, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTaskList, deleteTask, startTask, stopTask } from '@/api/task'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const query = reactive({ keyword: '', status: '', page: 1, pageSize: 10 })

const statusType = (s) => ({ pending:'info', running:'warning', success:'success', failed:'danger', stopped:'info' }[s]||'info')
const statusText = (s) => ({ pending:'待执行', running:'运行中', success:'成功', failed:'失败', stopped:'已停止' }[s]||s)
const priorityType = (p) => ({ high:'danger', medium:'warning', low:'info' }[p]||'info')
const priorityText = (p) => ({ high:'高', medium:'中', low:'低' }[p]||p)
const triggerText = (t) => ({ manual:'手动', scheduled:'定时', api:'API' }[t]||t)

const loadData = async () => {
  loading.value = true
  try {
    const res = await getTaskList(query)
    tableData.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => { query.keyword=''; query.status=''; query.page=1; loadData() }

const handleAdd = () => {
  router.push('/task/edit')
}

const handleEdit = (row) => {
  router.push(`/task/edit/${row.id}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除任务「${row.name}」吗？`, '提示', { type: 'warning' })
    .then(async () => { await deleteTask(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}

const handleStart = async (row) => {
  await startTask(row.id)
  ElMessage.success('任务已启动')
  loadData()
}

const handleStop = async (row) => {
  ElMessageBox.confirm(`确定要停止任务「${row.name}」吗？`, '提示', { type: 'warning' })
    .then(async () => { await stopTask(row.id); ElMessage.success('任务已停止'); loadData() })
    .catch(() => {})
}

onMounted(() => loadData())
</script>
