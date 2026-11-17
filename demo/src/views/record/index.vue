<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">流程运行记录</span>
        <el-button type="primary" :icon="Download" @click="handleExport">导出</el-button>
      </div>

      <div class="search-bar">
        <el-input v-model="query.keyword" placeholder="任务/流程名称" clearable style="width:220px" @keyup.enter="loadData" />
        <el-select v-model="query.status" placeholder="状态" clearable style="width:120px">
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
          <el-option label="运行中" value="running" />
          <el-option label="已停止" value="stopped" />
        </el-select>
        <el-date-picker
          v-model="query.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width:240px"
        />
        <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
        <el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border stripe style="width:100%">
        <el-table-column prop="taskName" label="任务名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="processName" label="流程名称" width="150" show-overflow-tooltip />
        <el-table-column prop="robotName" label="机器人" width="130" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column prop="endTime" label="结束时间" width="160" />
        <el-table-column label="耗时" width="100">
          <template #default="{ row }">
            <span v-if="row.duration">{{ formatDuration(row.duration) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="logCount" label="日志数" width="80" />
        <el-table-column label="错误信息" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span :style="{ color: row.errorMsg ? '#f56c6c' : '#909399' }">{{ row.errorMsg || '无' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleDetail(row)">详情</el-button>
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

    <el-dialog v-model="detailVisible" title="运行详情" width="680px">
      <el-descriptions :column="2" border v-if="detail">
        <el-descriptions-item label="任务名称" :span="2">{{ detail.taskName }}</el-descriptions-item>
        <el-descriptions-item label="流程名称">{{ detail.processName }}</el-descriptions-item>
        <el-descriptions-item label="机器人">{{ detail.robotName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(detail.status)" size="small">{{ statusText(detail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detail.duration ? formatDuration(detail.duration) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ detail.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ detail.endTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detail.operator }}</el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2">{{ detail.errorMsg || '无' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">执行日志</el-divider>
      <div class="log-content">
        <div class="log-line" v-for="(log, i) in mockLogs" :key="i">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-level" :class="log.level">{{ log.level.toUpperCase() }}</span>
          <span class="log-msg">{{ log.msg }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, RefreshLeft, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getRecordList } from '@/api/record'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const detailVisible = ref(false)
const detail = ref(null)

const query = reactive({ keyword: '', status: '', dateRange: [], page: 1, pageSize: 10 })

const statusType = (s) => ({ success:'success', failed:'danger', running:'warning', stopped:'info' }[s]||'info')
const statusText = (s) => ({ success:'成功', failed:'失败', running:'运行中', stopped:'已停止' }[s]||s)

const formatDuration = (sec) => {
  if (sec < 60) return `${sec}秒`
  const m = Math.floor(sec/60)
  const s = sec % 60
  if (m < 60) return `${m}分${s}秒`
  const h = Math.floor(m/60)
  return `${h}时${m%60}分`
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getRecordList(query)
    tableData.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => { query.keyword=''; query.status=''; query.dateRange=[]; query.page=1; loadData() }

const mockLogs = ref([
  { time: '10:30:01', level: 'info', msg: '任务开始执行' },
  { time: '10:30:02', level: 'info', msg: '连接机器人节点成功' },
  { time: '10:30:05', level: 'info', msg: '打开浏览器，访问目标页面' },
  { time: '10:30:10', level: 'info', msg: '页面加载完成，开始提取数据' },
  { time: '10:30:15', level: 'info', msg: '数据提取进度：50/100' },
  { time: '10:30:20', level: 'info', msg: '数据提取进度：100/100' },
  { time: '10:30:22', level: 'info', msg: '数据保存至数据库' },
  { time: '10:30:25', level: 'info', msg: '任务执行完成' },
])

const handleDetail = (row) => {
  detail.value = row
  detailVisible.value = true
}

const handleExport = () => {
  ElMessage.success('导出任务已提交，请稍后在下载中心查看')
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.log-content {
  max-height: 300px;
  overflow-y: auto;
  background: #1e1e1e;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;

  .log-line {
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
    color: #d4d4d4;

    .log-time { color: #888; }
    .log-level { width: 50px; }
    .log-level.info { color: #4fc3f7; }
    .log-level.warn { color: #ffb74d; }
    .log-level.error { color: #f06292; }
  }
}
</style>
