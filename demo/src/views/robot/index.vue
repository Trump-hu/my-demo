<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">机器人管理</span>
        <el-button type="primary" :icon="Plus" @click="handleAdd">添加机器人</el-button>
      </div>

      <div class="search-bar">
        <el-input v-model="query.keyword" placeholder="名称/编号/IP" clearable style="width:220px" @keyup.enter="loadData" />
        <el-select v-model="query.status" placeholder="状态" clearable style="width:120px">
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="忙碌" value="busy" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
        <el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border stripe style="width:100%">
        <el-table-column prop="code" label="编号" width="110" />
        <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="os" label="操作系统" width="170" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="资源使用" min-width="220">
          <template #default="{ row }">
            <div class="resource-bar">
              <div class="resource-item">
                <span class="r-label">CPU</span>
                <el-progress :percentage="row.cpu" :color="progressColor(row.cpu)" :stroke-width="6" />
              </div>
              <div class="resource-item">
                <span class="r-label">内存</span>
                <el-progress :percentage="row.memory" :color="progressColor(row.memory)" :stroke-width="6" />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="processCount" label="运行进程" width="90" />
        <el-table-column prop="lastHeartbeat" label="最后心跳" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="handleRestart(row)">重启</el-button>
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
import { getRobotList, deleteRobot } from '@/api/robot'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const query = reactive({ keyword: '', status: '', page: 1, pageSize: 10 })

const statusType = (s) => ({ online: 'success', offline: 'info', busy: 'warning' }[s] || 'info')
const statusText = (s) => ({ online: '在线', offline: '离线', busy: '忙碌' }[s] || s)
const progressColor = (v) => v >= 80 ? '#f56c6c' : v >= 60 ? '#e6a23c' : '#67c23a'

const loadData = async () => {
  loading.value = true
  try {
    const res = await getRobotList(query)
    tableData.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => { query.keyword=''; query.status=''; query.page=1; loadData() }

const handleAdd = () => {
  router.push('/robot/edit')
}

const handleEdit = (row) => {
  router.push(`/robot/edit/${row.id}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除机器人「${row.name}」吗？`, '提示', { type: 'warning' })
    .then(async () => { await deleteRobot(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}

const handleRestart = (row) => {
  ElMessageBox.confirm(`确定要重启机器人「${row.name}」吗？`, '提示', { type: 'warning' })
    .then(() => { ElMessage.success('重启指令已发送') })
    .catch(() => {})
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.resource-bar {
  display: flex;
  gap: 16px;

  .resource-item {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;

    .r-label {
      font-size: 12px;
      color: #909399;
      width: 32px;
    }
  }
}
</style>
