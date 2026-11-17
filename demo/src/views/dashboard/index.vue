<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="item in stats" :key="item.title">
        <div class="stat-card" :style="{ borderTop: `3px solid ${item.color}` }">
          <div class="stat-icon" :style="{ background: item.color + '1a', color: item.color }">
            <el-icon :size="28"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-title">{{ item.title }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="20" class="mt-16">
      <el-col :span="16">
        <div class="page-card">
          <div class="card-header">
            <span class="card-title">近7天任务执行趋势</span>
            <el-radio-group v-model="trendType" size="small">
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
            </el-radio-group>
          </div>
          <v-chart class="chart" :option="trendOption" autoresize />
        </div>
      </el-col>
      <el-col :span="8">
        <div class="page-card">
          <div class="card-header">
            <span class="card-title">任务状态分布</span>
          </div>
          <v-chart class="chart" :option="pieOption" autoresize />
        </div>
      </el-col>
    </el-row>

    <!-- 机器人状态 + 最近任务 -->
    <el-row :gutter="20" class="mt-16">
      <el-col :span="12">
        <div class="page-card">
          <div class="card-header">
            <span class="card-title">机器人状态</span>
            <el-link type="primary" :underline="false" @click="$router.push('/robot')">查看全部</el-link>
          </div>
          <div class="robot-status">
            <div class="robot-item" v-for="r in robotStats" :key="r.label">
              <div class="robot-dot" :style="{ background: r.color }"></div>
              <span class="robot-label">{{ r.label }}</span>
              <span class="robot-count">{{ r.count }} 台</span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="page-card">
          <div class="card-header">
            <span class="card-title">最近运行记录</span>
            <el-link type="primary" :underline="false" @click="$router.push('/record')">查看全部</el-link>
          </div>
          <el-table :data="recentRecords" size="small" :show-header="true" style="width:100%">
            <el-table-column prop="taskName" label="任务" min-width="120" show-overflow-tooltip />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startTime" label="时间" width="160" />
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TooltipComponent, GridComponent, LegendComponent, TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Share, Cpu, List, Document } from '@element-plus/icons-vue'

use([
  CanvasRenderer, LineChart, PieChart,
  TooltipComponent, GridComponent, LegendComponent, TitleComponent
])

const stats = ref([
  { title: '流程总数', value: 47, icon: 'Share', color: '#1a73e8' },
  { title: '在线机器人', value: 32, icon: 'Cpu', color: '#67c23a' },
  { title: '运行中任务', value: 8, icon: 'List', color: '#e6a23c' },
  { title: '今日执行次数', value: 156, icon: 'Document', color: '#f56c6c' },
])

const trendType = ref('week')

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['成功', '失败', '运行中'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '10%', top: '5%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: trendType.value === 'week'
      ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      : Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
  },
  yAxis: { type: 'value' },
  series: [
    { name: '成功', type: 'line', smooth: true, data: Array.from({ length: trendType.value === 'week' ? 7 : 30 }, () => Math.floor(Math.random() * 80 + 50)), itemStyle: { color: '#67c23a' } },
    { name: '失败', type: 'line', smooth: true, data: Array.from({ length: trendType.value === 'week' ? 7 : 30 }, () => Math.floor(Math.random() * 15 + 1)), itemStyle: { color: '#f56c6c' } },
    { name: '运行中', type: 'line', smooth: true, data: Array.from({ length: trendType.value === 'week' ? 7 : 30 }, () => Math.floor(Math.random() * 10 + 2)), itemStyle: { color: '#e6a23c' } },
  ],
}))

const pieOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: [
        { value: 1048, name: '成功', itemStyle: { color: '#67c23a' } },
        { value: 35, name: '失败', itemStyle: { color: '#f56c6c' } },
        { value: 12, name: '运行中', itemStyle: { color: '#e6a23c' } },
        { value: 8, name: '已停止', itemStyle: { color: '#909399' } },
      ],
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
    },
  ],
}

const robotStats = [
  { label: '在线', count: 28, color: '#67c23a' },
  { label: '忙碌', count: 4, color: '#e6a23c' },
  { label: '离线', count: 6, color: '#909399' },
]

const recentRecords = ref([
  { taskName: '每日数据采集任务', status: 'success', startTime: '2026-08-09 10:30:00' },
  { taskName: '周报生成任务', status: 'running', startTime: '2026-08-09 10:25:00' },
  { taskName: '邮件自动回复', status: 'failed', startTime: '2026-08-09 10:20:00' },
  { taskName: '文件备份任务', status: 'success', startTime: '2026-08-09 10:15:00' },
  { taskName: '订单批量处理', status: 'success', startTime: '2026-08-09 10:10:00' },
])

const statusType = (s) => ({ success: 'success', failed: 'danger', running: 'warning', stopped: 'info' }[s] || 'info')
const statusText = (s) => ({ success: '成功', failed: '失败', running: '运行中', stopped: '已停止' }[s] || s)
</script>

<style lang="scss" scoped>
.stat-row {
  margin-bottom: 0;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-info {
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #303133;
    }

    .stat-title {
      font-size: 13px;
      color: #909399;
      margin-top: 4px;
    }
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
}

.chart {
  height: 320px;
}

.robot-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px 0;

  .robot-item {
    display: flex;
    align-items: center;
    gap: 10px;

    .robot-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .robot-label {
      flex: 1;
      font-size: 14px;
      color: #606266;
    }

    .robot-count {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }
}
</style>
