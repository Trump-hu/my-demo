<template>
  <div class="page-container">
    <!-- 简介 -->
    <div class="page-card intro-card">
      <div class="intro-head">
        <el-icon :size="32" color="#1a73e8"><View /></el-icon>
        <div>
          <h2>文件预览实际使用场景</h2>
          <p class="intro-desc">
            在业务系统中，用户上传后常需要即时预览文件内容。本页演示纯前端的多类型文件预览方案：
            支持文件夹结构浏览，以及图片、PDF、Word、Excel、文本、音视频、压缩包等常见格式，
            Word / Excel 在浏览器内通过 mammoth / SheetJS 解析渲染，无需后端参与。
          </p>
        </div>
      </div>
      <div class="intro-tags">
        <el-tag v-for="t in scenarios" :key="t" type="info" effect="plain">{{ t }}</el-tag>
      </div>
    </div>

    <!-- 支持类型一览 -->
    <div class="page-card mt-16">
      <div class="card-header">
        <span class="card-title">支持预览的文件类型</span>
        <el-tag type="info" effect="light">多类型</el-tag>
      </div>
      <div class="type-grid mt-16">
        <div v-for="t in types" :key="t.name" class="type-card">
          <el-icon :size="26" :color="t.color"><component :is="t.icon" /></el-icon>
          <div class="tc-name">{{ t.name }}</div>
          <div class="tc-desc">{{ t.desc }}</div>
        </div>
      </div>
    </div>

    <!-- 预览器 -->
    <div class="page-card mt-16">
      <div class="card-header">
        <span class="card-title">文件预览</span>
        <el-tag type="warning" effect="light">交互演示</el-tag>
      </div>
      <p class="card-tip">
        点击「选择文件」预览单个文件，或「选择文件夹」浏览目录结构并预览其中文件。Word / Excel 解析库为按需加载。
      </p>
      <FilePreviewer />
    </div>
  </div>
</template>

<script setup>
import { View, Picture, Document, Files, Headset, VideoPlay, Box, Tickets } from '@element-plus/icons-vue'
import FilePreviewer from './components/FilePreviewer.vue'

const scenarios = ['文件夹结构', '图片', 'PDF', 'Word', 'Excel', '文本', '音视频', '压缩包']

const types = [
  { name: '文件夹', desc: '目录树浏览 + 文件预览', icon: Files, color: '#1a73e8' },
  { name: '图片', desc: 'png/jpg/gif/webp/svg 等', icon: Picture, color: '#67c23a' },
  { name: 'PDF', desc: '浏览器原生渲染', icon: Document, color: '#f56c6c' },
  { name: 'Word', desc: '.docx 由 mammoth 解析', icon: Document, color: '#409eff' },
  { name: 'Excel', desc: '.xlsx/.xls 由 SheetJS 解析', icon: Tickets, color: '#e6a23c' },
  { name: '文本', desc: 'txt/json/csv/md/代码 等', icon: Files, color: '#909399' },
  { name: '音频', desc: 'mp3/wav/ogg 等', icon: Headset, color: '#9254de' },
  { name: '视频', desc: 'mp4/webm 等', icon: VideoPlay, color: '#13c2c2' },
  { name: '压缩包', desc: 'zip/rar 等（提供下载）', icon: Box, color: '#8c8c8c' },
]
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

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;

  .type-card {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 16px;
    background: #fafbfc;
    text-align: center;
    transition: all 0.2s;

    &:hover {
      border-color: #1a73e8;
      box-shadow: 0 2px 12px rgba(26, 115, 232, 0.1);
    }

    .tc-name {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-top: 8px;
    }

    .tc-desc {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }
  }
}
</style>
