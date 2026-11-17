<template>
  <div class="file-previewer">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="toolbar">
      <el-button type="primary" @click="pickFile">
        <el-icon><Upload /></el-icon>选择文件
      </el-button>
      <el-button @click="pickFolder">
        <el-icon><FolderOpened /></el-icon>选择文件夹
      </el-button>
      <span class="tip">支持：图片 / PDF / Word(.docx) / Excel(.xlsx/.xls) / 文本 / 音视频 / 压缩包等</span>
      <el-button v-if="currentName || folderMode" text type="danger" @click="clear" style="margin-left:auto">
        清空
      </el-button>
      <input ref="fileInputRef" type="file" class="hidden-input" @change="onFileChange" />
      <input ref="folderInputRef" type="file" class="hidden-input" webkitdirectory directory multiple @change="onFolderChange" />
    </div>

    <el-row :gutter="16" class="preview-row">
      <!-- 文件夹树 -->
      <el-col v-if="folderMode" :span="7">
        <div class="tree-panel">
          <div class="panel-title">文件结构（{{ treeFiles.length }} 个文件）</div>
          <el-scrollbar class="tree-scroll">
            <div
              v-for="r in visibleRows"
              :key="r.key"
              class="tree-row"
              :class="{ active: r.type==='file' && r.file.webkitRelativePath === currentPath }"
              :style="{ paddingLeft: r.depth * 14 + 8 + 'px' }"
              @click="r.type === 'dir' ? toggleDir(r.key) : previewFile(r.file)"
            >
              <el-icon v-if="r.type === 'dir'" class="caret" :class="{ open: isExpanded(r.key) }"><ArrowRight /></el-icon>
              <el-icon v-else class="caret placeholder"></el-icon>
              <el-icon class="ficon"><Folder v-if="r.type==='dir'" /><Document v-else /></el-icon>
              <span class="tname">{{ r.name }}</span>
            </div>
            <el-empty v-if="!treeFiles.length" description="空文件夹" :image-size="60" />
          </el-scrollbar>
        </div>
      </el-col>

      <!-- 预览区 -->
      <el-col :span="folderMode ? 17 : 24">
        <div class="preview-panel">
          <!-- 文件信息 -->
          <div v-if="currentName" class="meta-bar">
            <el-icon :size="20" color="#1a73e8"><Document /></el-icon>
            <span class="mname" :title="currentName">{{ currentName }}</span>
            <span class="msize">{{ formatSize(currentSize) }}</span>
            <el-tag size="small" effect="plain">{{ categoryLabel }}</el-tag>
            <el-button text type="primary" @click="downloadCurrent">
              <el-icon><Download /></el-icon>下载
            </el-button>
          </div>

          <!-- 预览内容 -->
          <div class="preview-body">
            <div v-if="loading" class="center-hint">
              <el-icon class="is-loading" :size="28"><Loading /></el-icon>
              <span>解析中…</span>
            </div>

            <div v-else-if="error" class="center-hint error">
              <el-icon :size="28"><CircleClose /></el-icon>
              <span>{{ error }}</span>
            </div>

            <div v-else-if="!currentName" class="center-hint empty">
              <el-icon :size="40"><FolderOpened /></el-icon>
              <span>请选择文件或文件夹进行预览</span>
            </div>

            <!-- 图片 -->
            <div v-else-if="category === 'image'" class="media-wrap">
              <img :src="previewSrc" class="preview-img" />
            </div>

            <!-- PDF -->
            <iframe v-else-if="category === 'pdf'" :src="previewSrc" class="preview-frame"></iframe>

            <!-- 音频 -->
            <div v-else-if="category === 'audio'" class="media-wrap">
              <audio :src="previewSrc" controls></audio>
            </div>

            <!-- 视频 -->
            <div v-else-if="category === 'video'" class="video-view">
              <video
                ref="videoElRef"
                class="video-el"
                :src="previewSrc"
                controls
                playsinline
                controlslist="nodownload"
                @error="onMediaError"
              ></video>
              <div v-if="mediaError" class="media-error">
                <el-icon><Warning /></el-icon>
                <span>{{ mediaError }}</span>
              </div>
            </div>

            <!-- 不支持解码的视频格式 -->
            <div v-else-if="category === 'video-unsupported'" class="center-hint">
              <el-icon :size="40"><VideoPlay /></el-icon>
              <span>{{ mediaError || '该视频格式浏览器无法直接播放' }}</span>
              <el-button type="primary" @click="downloadCurrent">
                <el-icon><Download /></el-icon>下载查看
              </el-button>
            </div>

            <!-- 纯文本 -->
            <pre v-else-if="category === 'plain'" class="text-preview">{{ textContent }}</pre>

            <!-- 代码（彩色高亮） -->
            <div v-else-if="category === 'code'" class="code-view">
              <div class="code-toolbar">
                <el-icon><Tickets /></el-icon>
                <span class="lang-badge">{{ codeLang || '自动识别' }}</span>
                <span v-if="textTruncated" class="code-trunc">已截断</span>
              </div>
              <pre class="code-block"><code class="hljs" v-html="codeHtml"></code></pre>
            </div>

            <!-- Word -->
            <div v-else-if="category === 'docx'" class="doc-preview" v-html="docHtml || '<p class=ph>暂无内容</p>'"></div>

            <!-- Excel -->
            <div v-else-if="category === 'xlsx'" class="xlsx-preview">
              <el-tabs v-if="sheets.length" v-model="activeSheet" type="card" @tab-change="onTabChange">
                <el-tab-pane v-for="(s, i) in sheets" :key="s" :label="s" :name="i" />
              </el-tabs>
              <div class="xlsx-table" v-html="sheetHtml"></div>
            </div>

            <!-- 其他/不支持 -->
            <div v-else class="center-hint">
              <el-icon :size="40"><Files /></el-icon>
              <span>该类型（{{ categoryLabel }}）无法在浏览器直接预览</span>
              <el-button type="primary" @click="downloadCurrent">
                <el-icon><Download /></el-icon>下载查看
              </el-button>
            </div>
          </div>

          <div v-if="textTruncated" class="truncated-tip">文本过长，仅显示前 200,000 字符</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, shallowRef, watch, onBeforeUnmount, nextTick } from 'vue'
import 'highlight.js/styles/github.css'
import {
  Upload, FolderOpened, Folder, ArrowRight, Document, Download,
  CircleClose, Files, Loading, Warning, Tickets, VideoPlay,
} from '@element-plus/icons-vue'

const props = defineProps({
  // 外部传入文件时可直接预览（如上传记录页的预览弹窗）
  initialFile: { type: Object, default: null },
  showToolbar: { type: Boolean, default: true },
})

const fileInputRef = ref(null)
const folderInputRef = ref(null)

const folderMode = ref(false)
const treeFiles = ref([]) // 原始 File 列表（含 webkitRelativePath）
const treeRows = ref([]) // 扁平化树行
const expanded = ref(new Set())

const currentFile = shallowRef(null)
const currentName = ref('')
const currentSize = ref(0)
const currentPath = ref('')
const category = ref('other')
const previewSrc = ref('')
const textContent = ref('')
const textTruncated = ref(false)
const codeHtml = ref('')
const codeLang = ref('')
const mediaError = ref('')
const videoElRef = ref(null)
const docHtml = ref('')
const sheets = ref([])
const activeSheet = ref(0)
const sheetHtml = ref('')
const loading = ref(false)
const error = ref('')

let workbook = null
let xlsxLib = null

const extOf = (name) => (name.split('.').pop() || '').toLowerCase()

// 代码扩展名 → highlight.js 语言名（未命中则自动识别）
const LANG_MAP = {
  js: 'javascript', mjs: 'javascript', jsx: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  json: 'json',
  html: 'xml', htm: 'xml', xml: 'xml', vue: 'xml', svg: 'xml',
  css: 'css', scss: 'scss', less: 'less',
  md: 'markdown',
  py: 'python',
  java: 'java',
  go: 'go',
  rs: 'rust',
  c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cc: 'cpp',
  sh: 'bash', bash: 'bash',
  sql: 'sql',
  yaml: 'yaml', yml: 'yaml',
  php: 'php',
  rb: 'ruby',
  kt: 'kotlin',
  swift: 'swift',
  dart: 'dart',
  gradle: 'groovy',
  dockerfile: 'dockerfile',
}
const isCodeExt = (ext) => !!LANG_MAP[ext] || ['js', 'ts', 'jsx', 'tsx', 'json', 'css', 'scss', 'less', 'html', 'htm', 'xml', 'vue', 'svg', 'md', 'py', 'java', 'go', 'rs', 'c', 'h', 'cpp', 'hpp', 'cc', 'sh', 'bash', 'sql', 'yaml', 'yml', 'php', 'rb', 'kt', 'swift', 'dart', 'gradle', 'dockerfile'].includes(ext)

const categorize = (name) => {
  const ext = extOf(name)
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (isCodeExt(ext)) return 'code'
  if (['txt', 'log', 'csv', 'ini', 'conf', 'env', 'properties'].includes(ext)) return 'plain'
  if (ext === 'docx') return 'docx'
  if (['xlsx', 'xls'].includes(ext)) return 'xlsx'
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) return 'audio'
  if (['mp4', 'webm', 'mov', 'm4v','mkv'].includes(ext)) return 'video'
  if (['avi', 'flv', 'wmv', 'ts', 'rmvb'].includes(ext)) return 'video-unsupported'
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return 'archive'
  return 'other'
}
const categoryLabel = computed(() => {
  const map = {
    image: '图片', pdf: 'PDF', code: '代码', plain: '文本', docx: 'Word',
    xlsx: 'Excel', audio: '音频', video: '视频', 'video-unsupported': '视频', archive: '压缩包', other: '未知类型',
  }
  return map[category.value] || '未知类型'
})

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

// ===== 选择入口 =====
const pickFile = () => fileInputRef.value && fileInputRef.value.click()
const pickFolder = () => folderInputRef.value && folderInputRef.value.click()

const onFileChange = (e) => {
  const f = e.target.files && e.target.files[0]
  if (f) {
    folderMode.value = false
    previewFile(f)
  }
  e.target.value = ''
}
const onFolderChange = (e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  folderMode.value = true
  clearPreview()
  treeFiles.value = files
  buildTree(files)
  // 默认预览第一个文件
  const first = files.find((f) => categorize(f.name) !== 'other') || files[0]
  if (first) previewFile(first)
  e.target.value = ''
}

// ===== 文件夹树 =====
const buildTree = (files) => {
  const root = { dirs: {}, files: [] }
  for (const f of files) {
    const parts = f.webkitRelativePath.split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const d = parts[i]
      node.dirs[d] = node.dirs[d] || { name: d, dirs: {}, files: [] }
      node = node.dirs[d]
    }
    node.files.push(f)
  }
  const rows = []
  const walk = (node, depth, parentKey) => {
    const dirs = Object.values(node.dirs).sort((a, b) => a.name.localeCompare(b.name))
    for (const d of dirs) {
      const key = (parentKey ? parentKey + '/' : '') + d.name
      rows.push({ key, name: d.name, type: 'dir', depth, childCount: Object.keys(d.dirs).length + d.files.length })
      walk(d, depth + 1, key)
    }
    node.files.sort((a, b) => a.name.localeCompare(b.name)).forEach((f) => {
      rows.push({ key: f.webkitRelativePath, name: f.name, type: 'file', depth, file: f })
    })
  }
  walk(root, 0, '')
  treeRows.value = rows
  // 默认展开顶层目录
  const topDirs = rows.filter((r) => r.type === 'dir' && r.depth === 0).map((r) => r.key)
  expanded.value = new Set(topDirs)
}

const isExpanded = (key) => expanded.value.has(key)
const toggleDir = (key) => {
  const s = new Set(expanded.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  expanded.value = s
}

const visibleRows = computed(() => {
  const exp = expanded.value
  const res = []
  for (const r of treeRows.value) {
    if (r.depth === 0) {
      res.push(r)
      continue
    }
    const parts = r.key.split('/')
    let ok = true
    for (let i = 1; i < parts.length; i++) {
      const anc = parts.slice(0, i).join('/')
      if (!exp.has(anc)) {
        ok = false
        break
      }
    }
    if (ok) res.push(r)
  }
  return res
})

// ===== 预览 =====
const clearPreview = () => {
  if (previewSrc.value) URL.revokeObjectURL(previewSrc.value)
  previewSrc.value = ''
  textContent.value = ''
  textTruncated.value = false
  codeHtml.value = ''
  codeLang.value = ''
  mediaError.value = ''
  docHtml.value = ''
  sheets.value = []
  sheetHtml.value = ''
  workbook = null
  error.value = ''
}

const onMediaError = () => {
  mediaError.value = '该视频编码浏览器无法解码（如 H.265/HEVC），请下载后使用本地播放器查看。'
}

// 读取文本并截断（代码与纯文本共用）
const readTruncated = async (f) => {
  let txt = await f.text()
  const MAX = 200000
  if (txt.length > MAX) {
    txt = txt.slice(0, MAX)
    textTruncated.value = true
  } else {
    textTruncated.value = false
  }
  return txt
}

const previewFile = async (f) => {
  clearPreview()
  currentFile.value = f
  currentName.value = f.name
  currentSize.value = f.size
  currentPath.value = f.webkitRelativePath || f.name
  const cat = categorize(f.name)
  category.value = cat

  const needsUrl = ['image', 'pdf', 'audio', 'video'].includes(cat)
  if (needsUrl) {
    previewSrc.value = URL.createObjectURL(f)
    return
  }

  // 浏览器无法解码的视频格式（mkv/avi 等）直接给出提示
  if (cat === 'video-unsupported') {
    mediaError.value = '该视频格式浏览器无法直接播放，请下载后使用本地播放器查看。'
    return
  }

  if (cat === 'plain') {
    loading.value = true
    try {
      textContent.value = await readTruncated(f)
    } catch (e) {
      error.value = '文本读取失败：' + (e.message || e)
    } finally {
      loading.value = false
    }
    return
  }

  if (cat === 'code') {
    loading.value = true
    try {
      const txt = await readTruncated(f)
      const ext = extOf(f.name)
      const lang = LANG_MAP[ext] || ''
      const mod = await import('highlight.js')
      const hljs = mod.default || mod
      let result
      if (lang && hljs.getLanguage(lang)) {
        result = hljs.highlight(txt, { language: lang })
        codeLang.value = lang
      } else {
        result = hljs.highlightAuto(txt)
        codeLang.value = result.language || ''
      }
      codeHtml.value = result.value
    } catch (e) {
      error.value = '代码高亮失败：' + (e.message || e)
    } finally {
      loading.value = false
    }
    return
  }

  if (cat === 'docx') {
    loading.value = true
    try {
      const buf = await f.arrayBuffer()
      const mod = await import('mammoth/mammoth.browser')
      const mammoth = mod.default || mod
      const res = await mammoth.convertToHtml({ arrayBuffer: buf })
      docHtml.value = res.value || '<p class="ph">文档无可见内容</p>'
    } catch (e) {
      error.value = 'Word 解析失败：' + (e.message || e)
    } finally {
      loading.value = false
    }
    return
  }

  if (cat === 'xlsx') {
    loading.value = true
    try {
      const buf = await f.arrayBuffer()
      const mod = await import('xlsx')
      xlsxLib = mod.default || mod
      workbook = xlsxLib.read(buf, { type: 'array' })
      sheets.value = workbook.SheetNames || []
      activeSheet.value = 0
      renderSheet()
    } catch (e) {
      error.value = 'Excel 解析失败：' + (e.message || e)
    } finally {
      loading.value = false
    }
    return
  }

  // archive / other → 占位提示
}

const renderSheet = () => {
  if (!workbook || !xlsxLib || !sheets.value.length) return
  const name = sheets.value[activeSheet.value]
  const sheet = workbook.Sheets[name]
  sheetHtml.value = xlsxLib.utils.sheet_to_html(sheet, { editable: false })
}

// 修正 tab-change 事件名：Element Plus 用 @tab-change，参数为 pane name
const onTabChange = (name) => {
  activeSheet.value = Number(name)
  renderSheet()
}

const downloadCurrent = () => {
  if (!currentFile.value) return
  const url = URL.createObjectURL(currentFile.value)
  const a = document.createElement('a')
  a.href = url
  a.download = currentName.value
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const clear = () => {
  clearPreview()
  folderMode.value = false
  treeFiles.value = []
  treeRows.value = []
  expanded.value = new Set()
  currentFile.value = null
  currentName.value = ''
  currentSize.value = 0
  currentPath.value = ''
  category.value = 'other'
}

// 外部（如上传记录页）传入文件时自动预览，换文件时重新解析
watch(
  () => props.initialFile,
  (f) => {
    if (f) previewFile(f)
    else clear()
  },
  { immediate: true },
)

defineExpose({ previewFile, clear })

onBeforeUnmount(() => {
  if (previewSrc.value) URL.revokeObjectURL(previewSrc.value)
})
</script>

<style lang="scss" scoped>
.file-previewer {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #ebeef5;

  .tip {
    font-size: 12px;
    color: #909399;
  }
}

.hidden-input {
  display: none;
}

.preview-row {
  min-height: 420px;
}

.tree-panel {
  border-right: 1px solid #ebeef5;
  height: 100%;
  min-height: 420px;
  display: flex;
  flex-direction: column;

  .panel-title {
    padding: 10px 14px;
    font-size: 13px;
    color: #606266;
    border-bottom: 1px solid #f0f0f0;
    background: #fff;
  }

  .tree-scroll {
    flex: 1;
  }

  .tree-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    font-size: 13px;
    color: #303133;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      background: #f5f7fa;
    }

    &.active {
      background: #ecf5ff;
      color: #1a73e8;
    }

    .caret {
      font-size: 12px;
      transition: transform 0.2s;

      &.open {
        transform: rotate(90deg);
      }

      &.placeholder {
        visibility: hidden;
      }
    }

    .ficon {
      font-size: 14px;
      color: #909399;
      flex-shrink: 0;
    }

    .tname {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.preview-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 420px;

  .meta-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-bottom: 1px solid #f0f0f0;
    background: #fff;

    .mname {
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      max-width: 40%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .msize {
      font-size: 12px;
      color: #909399;
    }

    .el-button {
      margin-left: auto;
    }
  }

  .preview-body {
    flex: 1;
    overflow: auto;
    background: #fff;
  }
}

.center-hint {
  height: 100%;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #909399;
  font-size: 13px;
  padding: 24px;

  &.error {
    color: #f56c6c;
  }

  &.empty {
    color: #c0c4cc;
  }
}

.media-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  min-height: 320px;

  .preview-img {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    border-radius: 4px;
  }

  audio {
    width: 100%;
    max-width: 720px;
  }
}

.video-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  min-height: 320px;

  .video-el {
    max-width: 100%;
    max-height: 70vh;
    background: #000;
    border-radius: 6px;
    outline: none;
  }

  .media-error {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #e6a23c;
  }
}

.code-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 320px;

  .code-toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #f5f7fa;
    border-bottom: 1px solid #ebeef5;

    .lang-badge {
      font-size: 12px;
      color: #606266;
      font-family: 'Courier New', monospace;
    }

    .code-trunc {
      margin-left: auto;
      font-size: 11px;
      color: #e6a23c;
    }
  }

  .code-block {
    margin: 0;
    padding: 16px;
    overflow: auto;
    max-height: 70vh;
    background: #fff;

    :deep(code.hljs) {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.6;
      background: transparent;
      padding: 0;
      white-space: pre;
    }
  }
}

.preview-frame {
  width: 100%;
  height: 70vh;
  border: none;
}

.text-preview {
  margin: 0;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
}

.doc-preview {
  padding: 24px 32px;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  max-width: 820px;
  margin: 0 auto;

  :deep(h1) { font-size: 22px; margin: 16px 0 8px; }
  :deep(h2) { font-size: 18px; margin: 14px 0 6px; }
  :deep(h3) { font-size: 16px; margin: 12px 0 6px; }
  :deep(p) { margin: 8px 0; }
  :deep(table) { border-collapse: collapse; width: 100%; margin: 12px 0; }
  :deep(td), :deep(th) { border: 1px solid #dcdfe6; padding: 6px 10px; }
  :deep(img) { max-width: 100%; }
  :deep(.ph) { color: #909399; }
}

.xlsx-preview {
  .xlsx-table {
    overflow: auto;
    padding: 12px;

    :deep(table) {
      border-collapse: collapse;
      font-size: 12px;

      td, th {
        border: 1px solid #ebeef5;
        padding: 4px 8px;
        white-space: nowrap;
        min-width: 60px;
        max-width: 320px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      tr:first-child td, tr:first-child th {
        background: #f5f7fa;
        font-weight: 600;
      }
    }
  }
}

.truncated-tip {
  padding: 8px 16px;
  font-size: 12px;
  color: #e6a23c;
  background: #fdf6ec;
  border-top: 1px solid #f5dab1;
}
</style>
