<template>
  <div class="page-container monitor-page">
    <!-- 顶部信息 -->
    <div class="page-card">
      <div class="page-header">
        <div class="header-left">
          <span class="page-title">{{ monitorData?.processName || '流程监控' }}</span>
          <el-tag class="ml-12" type="success" size="small" v-if="monitorData">
            {{ monitorData.processCode }} · v{{ monitorData.version }}
          </el-tag>
        </div>
        <div class="header-right">
          <el-radio-group v-model="efficiencyRange" size="small" @change="loadEfficiency">
            <el-radio-button value="7d">近7天</el-radio-button>
            <el-radio-button value="30d">近30天</el-radio-button>
            <el-radio-button value="90d">近90天</el-radio-button>
          </el-radio-group>
          <el-button :icon="Refresh" @click="loadMonitor" :loading="monitorLoading">刷新</el-button>
        </div>
      </div>

      <!-- 实时指标卡片 -->
      <el-row :gutter="16" v-if="monitorData">
        <el-col :span="4" v-for="m in metrics" :key="m.label">
          <div class="metric-card" :style="{ borderTop: `3px solid ${m.color}` }">
            <div class="metric-value" :style="{ color: m.color }">{{ m.value }}</div>
            <div class="metric-label">{{ m.label }}</div>
            <div class="metric-sub" v-if="m.sub">{{ m.sub }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 实时运行实例 -->
    <div class="page-card mt-16">
      <div class="card-header">
        <span class="card-title">
          实时运行实例
          <el-badge :value="monitorData?.runningCount || 0" type="primary" class="ml-8" />
        </span>
        <span class="live-indicator">
          <span class="live-dot"></span>实时
        </span>
      </div>

      <el-empty v-if="monitorData && monitorData.instances.length === 0" description="当前无运行中的实例" />

      <el-table v-else v-loading="monitorLoading" :data="monitorData?.instances || []" border stripe size="small">
        <el-table-column prop="instanceId" label="实例ID" width="180" show-overflow-tooltip />
        <el-table-column prop="robotName" label="执行机器人" width="130" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="instanceStatusType(row.status)" size="small" effect="light">
              <el-icon v-if="row.status==='running'" class="is-loading"><Loading /></el-icon>
              {{ instanceStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" min-width="200">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress
                :percentage="row.progress"
                :stroke-width="10"
                :color="progressColor(row.progress)"
                :format="(p) => `${p}%`"
              />
              <span class="step-text">{{ row.currentStep }}/{{ row.totalSteps }} 步</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="资源" width="140">
          <template #default="{ row }">
            <div class="resource-mini">
              <span class="r-item">CPU {{ row.cpu }}%</span>
              <span class="r-item">内存 {{ row.memory }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column label="已耗时" width="90">
          <template #default="{ row }">{{ formatDuration(row.elapsed) }}</template>
        </el-table-column>
        <el-table-column label="当前操作" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <el-icon class="mr-4"><Operation /></el-icon>{{ row.log }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 效能分析图表 -->
    <div v-loading="efficiencyLoading">
      <!-- 运行趋势 + 成功率 -->
      <el-row :gutter="16" class="mt-16">
        <el-col :span="16">
          <div class="page-card">
            <div class="card-header">
              <span class="card-title">运行趋势</span>
            </div>
            <v-chart class="chart" :option="trendOption" autoresize />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="page-card">
            <div class="card-header">
              <span class="card-title">执行结果占比</span>
            </div>
            <v-chart class="chart" :option="pieOption" autoresize />
          </div>
        </el-col>
      </el-row>

      <!-- 耗时趋势 + 小时分布 -->
      <el-row :gutter="16" class="mt-16">
        <el-col :span="12">
          <div class="page-card">
            <div class="card-header">
              <span class="card-title">耗时趋势（秒）</span>
            </div>
            <v-chart class="chart" :option="durationOption" autoresize />
          </div>
        </el-col>
        <el-col :span="12">
          <div class="page-card">
            <div class="card-header">
              <span class="card-title">执行时段分布</span>
            </div>
            <v-chart class="chart" :option="hourlyOption" autoresize />
          </div>
        </el-col>
      </el-row>

      <!-- 步骤效能 + 机器人分布 -->
      <el-row :gutter="16" class="mt-16">
        <el-col :span="14">
          <div class="page-card">
            <div class="card-header">
              <span class="card-title">步骤耗时分析</span>
            </div>
            <v-chart class="chart" :option="stepOption" autoresize />
          </div>
        </el-col>
        <el-col :span="10">
          <div class="page-card">
            <div class="card-header">
              <span class="card-title">机器人执行分布</span>
            </div>
            <v-chart class="chart" :option="robotOption" autoresize />
          </div>
        </el-col>
      </el-row>

      <!-- 步骤明细表 -->
      <div class="page-card mt-16" v-if="efficiencyData">
        <div class="card-header">
          <span class="card-title">步骤效能明细</span>
        </div>
        <el-table :data="efficiencyData.stepPerformance" border stripe size="small">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="stepName" label="步骤名称" min-width="120" />
          <el-table-column prop="runCount" label="执行次数" width="100" sortable />
          <el-table-column prop="avgDuration" label="平均耗时" width="100" sortable>
            <template #default="{ row }">{{ row.avgDuration }}s</template>
          </el-table-column>
          <el-table-column prop="failCount" label="失败次数" width="100" sortable>
            <template #default="{ row }">
              <span :style="{ color: row.failCount > 10 ? '#f56c6c' : '#606266' }">{{ row.failCount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="失败率" width="100">
            <template #default="{ row }">
              {{ row.runCount > 0 ? (row.failCount / row.runCount * 100).toFixed(1) : 0 }}%
            </template>
          </el-table-column>
          <el-table-column label="耗时占比" min-width="180">
            <template #default="{ row }">
              <el-progress
                :percentage="stepDurationPercent(row.avgDuration)"
                :stroke-width="8"
                :color="'#1a73e8'"
                :show-text="false"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Refresh, Loading, Operation } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  TooltipComponent, GridComponent, LegendComponent, DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { getProcessMonitor, getProcessEfficiency } from '@/api/process'

use([
  CanvasRenderer, BarChart, LineChart, PieChart,
  TooltipComponent, GridComponent, LegendComponent, DataZoomComponent
])

const route = useRoute()
const processId = computed(() => route.params.id)

const monitorData = ref(null)
const efficiencyData = ref(null)
const monitorLoading = ref(false)
const efficiencyLoading = ref(false)
const efficiencyRange = ref('7d')

// 实时轮询定时器
let pollTimer = null

// 格式化耗时
const formatDuration = (sec) => {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m${s}s`
}

// 指标卡片
const metrics = computed(() => {
  if (!monitorData.value) return []
  const d = monitorData.value
  return [
    { label: '运行中实例', value: d.runningCount, color: '#1a73e8', sub: '实时' },
    { label: '今日执行', value: d.todayRunCount, color: '#409eff', sub: `成功 ${d.todaySuccessCount}` },
    { label: '今日失败', value: d.todayFailCount, color: '#f56c6c', sub: d.todayFailCount > 0 ? '需关注' : '正常' },
    { label: '平均耗时', value: formatDuration(d.avgDuration), color: '#e6a23c' },
    { label: '平均CPU', value: d.avgCpu + '%', color: '#67c23a' },
    { label: '平均内存', value: d.avgMemory + '%', color: '#909399' },
  ]
})

// 实例状态
const instanceStatusType = (s) => ({ running: 'success', starting: 'warning', queued: 'info' }[s] || 'info')
const instanceStatusText = (s) => ({ running: '运行中', starting: '启动中', queued: '排队中' }[s] || s)
const progressColor = (p) => p >= 90 ? '#67c23a' : p >= 50 ? '#1a73e8' : '#e6a23c'

// 图表配置
const trendOption = computed(() => {
  if (!efficiencyData.value) return {}
  const d = efficiencyData.value.trendData
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['成功', '失败', '运行中'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: d.map(i => i.date), boundaryGap: false },
    yAxis: { type: 'value' },
    series: [
      { name: '成功', type: 'line', smooth: true, areaStyle: { opacity: 0.1 }, data: d.map(i => i.success), itemStyle: { color: '#67c23a' } },
      { name: '失败', type: 'line', smooth: true, data: d.map(i => i.failed), itemStyle: { color: '#f56c6c' } },
      { name: '运行中', type: 'line', smooth: true, data: d.map(i => i.running), itemStyle: { color: '#e6a23c' } },
    ],
  }
})

const pieOption = computed(() => {
  if (!efficiencyData.value) return {}
  const e = efficiencyData.value
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      data: [
        { value: e.totalSuccess, name: '成功', itemStyle: { color: '#67c23a' } },
        { value: e.totalFailed, name: '失败', itemStyle: { color: '#f56c6c' } },
      ],
      label: { formatter: '{b}\n{d}%' },
      emphasis: { label: { fontSize: 14, fontWeight: 'bold' } },
    }],
  }
})

const durationOption = computed(() => {
  if (!efficiencyData.value) return {}
  const d = efficiencyData.value.durationData
  const dates = efficiencyData.value.trendData.map(i => i.date)
  return {
    tooltip: { trigger: 'axis', formatter: (p) => {
      let s = p[0].axisValue + '<br/>'
      p.forEach(i => { s += `${i.marker}${i.seriesName}: ${i.value}s<br/>` })
      return s
    }},
    legend: { data: ['平均', '最大', '最小'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', name: '秒' },
    series: [
      { name: '平均', type: 'line', smooth: true, data: d.map(i => i.avg), itemStyle: { color: '#1a73e8' } },
      { name: '最大', type: 'line', smooth: true, data: d.map(i => i.max), itemStyle: { color: '#f56c6c' }, lineStyle: { type: 'dashed' } },
      { name: '最小', type: 'line', smooth: true, data: d.map(i => i.min), itemStyle: { color: '#67c23a' }, lineStyle: { type: 'dashed' } },
    ],
  }
})

const hourlyOption = computed(() => {
  if (!efficiencyData.value) return {}
  const dist = efficiencyData.value.hourlyDist
  return {
    tooltip: { trigger: 'axis', formatter: '{b}: {c} 次' },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: dist.map((_, h) => `${h}:00`), axisLabel: { interval: 1 } },
    yAxis: { type: 'value', name: '次数' },
    series: [{
      type: 'bar',
      data: dist.map((v, h) => ({
        value: v,
        itemStyle: { color: h >= 9 && h <= 18 ? '#1a73e8' : h >= 19 && h <= 22 ? '#e6a23c' : '#909399' },
      })),
      barWidth: '60%',
    }],
  }
})

const stepOption = computed(() => {
  if (!efficiencyData.value) return {}
  const steps = efficiencyData.value.stepPerformance
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p) => {
      const s = steps[p[0].dataIndex]
      return `${s.step}: ${s.stepName}<br/>平均耗时: ${s.avgDuration}s<br/>执行: ${s.runCount}次<br/>失败: ${s.failCount}次`
    }},
    grid: { left: '3%', right: '8%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: { type: 'value', name: '平均耗时(秒)' },
    yAxis: { type: 'category', data: steps.map(s => s.step).reverse(), axisLabel: { formatter: (v) => v } },
    series: [{
      type: 'bar',
      data: steps.map(s => s.avgDuration).reverse().map((v, i) => ({
        value: v,
        itemStyle: { color: v > 80 ? '#f56c6c' : v > 40 ? '#e6a23c' : '#67c23a' },
      })),
      barWidth: '60%',
      label: { show: true, position: 'right', formatter: '{c}s' },
    }],
  }
})

const robotOption = computed(() => {
  if (!efficiencyData.value) return []
  const r = efficiencyData.value.robotDist
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['执行次数', '成功率'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: r.map(i => i.robotName) },
    yAxis: [
      { type: 'value', name: '次数' },
      { type: 'value', name: '成功率%', max: 100, min: 80 },
    ],
    series: [
      { name: '执行次数', type: 'bar', data: r.map(i => i.runCount), itemStyle: { color: '#1a73e8' } },
      { name: '成功率', type: 'line', yAxisIndex: 1, data: r.map(i => i.successRate), itemStyle: { color: '#67c23a' } },
    ],
  }
})

// 步骤耗时占比
const maxStepDuration = computed(() => {
  if (!efficiencyData.value) return 1
  return Math.max(...efficiencyData.value.stepPerformance.map(s => s.avgDuration), 1)
})
const stepDurationPercent = (dur) => Math.round((dur / maxStepDuration.value) * 100)

// 加载实时监控数据
const loadMonitor = async () => {
  monitorLoading.value = true
  try {
    const res = await getProcessMonitor(processId.value)
    monitorData.value = res.data
  } finally {
    monitorLoading.value = false
  }
}

// 加载效能分析数据
const loadEfficiency = async () => {
  efficiencyLoading.value = true
  try {
    const res = await getProcessEfficiency(processId.value, { range: efficiencyRange.value })
    efficiencyData.value = res.data
  } finally {
    efficiencyLoading.value = false
  }
}

onMounted(() => {
  loadMonitor()
  loadEfficiency()
  // 每10秒轮询一次实时监控数据
  pollTimer = setInterval(() => {
    loadMonitor()
  }, 10000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style lang="scss" scoped>
.monitor-page {
  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .ml-12 { margin-left: 12px; }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.metric-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;
  border: 1px solid #ebeef5;
  border-top-width: 3px;
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .metric-value {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.4;
  }

  .metric-label {
    font-size: 13px;
    color: #909399;
    margin-top: 4px;
  }

  .metric-sub {
    font-size: 11px;
    color: #c0c4cc;
    margin-top: 2px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .ml-8 { margin-left: 8px; }

  .live-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #67c23a;

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #67c23a;
      animation: live-pulse 1.5s infinite;
    }
  }
}

@keyframes live-pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .step-text {
    font-size: 12px;
    color: #909399;
    white-space: nowrap;
  }
}

.resource-mini {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .r-item {
    font-size: 12px;
    color: #606266;
  }
}

.chart {
  height: 300px;
}

.mr-4 { margin-right: 4px; }
</style>
