<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">{{ isEdit ? '编辑图片合成' : '新增图片合成' }}</span>
        <div class="header-ops">
          <el-button @click="goBack">返回</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        </div>
      </div>

      <el-steps :active="step" align-center finish-status="success" class="steps">
        <el-step title="底图设置" />
        <el-step title="添加插画" />
        <el-step title="添加文字" />
      </el-steps>

      <div v-loading="loadingDetail" class="editor-body">
        <div class="config-panel">
          <!-- 第一步：底图 -->
          <div v-show="step === 0">
            <el-form label-width="96px">
              <el-form-item label="名称" required>
                <el-input
                  v-model="form.name"
                  maxlength="50"
                  show-word-limit
                  placeholder="请输入合成图片名称"
                  style="max-width: 320px"
                />
              </el-form-item>

              <el-form-item label="类型">
                <el-select v-model="form.type" style="width: 180px">
                  <el-option v-for="t in IMAGE_TYPES" :key="t" :label="t" :value="t" />
                </el-select>
              </el-form-item>

              <el-form-item label="底图">
                <div class="base-box">
                  <img v-if="config.base" :src="config.base" class="base-thumb" alt="底图" />
                  <div v-else class="base-empty">
                    <el-icon :size="26"><Picture /></el-icon>
                    <span>空白底图</span>
                  </div>
                  <div class="base-ops">
                    <el-button @click="pickBaseFile">{{ config.base ? '更换底图' : '选择底图' }}</el-button>
                    <el-button v-if="config.base" @click="config.base = null">移除</el-button>
                    <el-button v-if="config.base" text type="primary" @click="useBaseSize">使用原图尺寸</el-button>
                    <span class="hint">不选择底图时按设置的宽高生成空白画布</span>
                  </div>
                  <input ref="baseInputRef" type="file" accept="image/*" class="hidden-input" @change="onBaseChange" />
                </div>
              </el-form-item>

              <el-form-item label="宽度">
                <el-input-number v-model="form.width" :min="100" :max="5000" :step="10" />
                <span class="unit">px</span>
              </el-form-item>
              <el-form-item label="高度">
                <el-input-number v-model="form.height" :min="100" :max="5000" :step="10" />
                <span class="unit">px</span>
              </el-form-item>
              <el-form-item label="质量">
                <el-slider v-model="form.quality" :min="10" :max="100" show-input style="max-width: 380px" />
              </el-form-item>
            </el-form>
            <p class="panel-tip">质量用于保存时导出 JPEG 的压缩质量，数值越高越清晰、体积越大。</p>
          </div>

          <!-- 第二步：插画 -->
          <div v-show="step === 1">
            <div class="block-title">
              <span>内置插画</span>
              <span class="sub">点击添加到画布</span>
            </div>
            <div class="emoji-grid">
              <button v-for="e in BUILTIN_EMOJIS" :key="e" type="button" class="emoji-btn" @click="addEmoji(e)">
                {{ e }}
              </button>
            </div>

            <div class="block-title">
              <span>本地上传插画</span>
              <el-button size="small" :icon="Upload" @click="pickIllustrationFiles">上传图片</el-button>
              <input
                ref="illusInputRef"
                type="file"
                accept="image/*"
                multiple
                class="hidden-input"
                @change="onIllustrationChange"
              />
            </div>

            <div v-if="config.illustrations.length" class="item-list">
              <div v-for="(it, i) in config.illustrations" :key="it.id" class="item-row">
                <div class="it-thumb">
                  <img v-if="it.type === 'image'" :src="it.src" alt="插画" />
                  <span v-else class="it-emoji">{{ it.emoji }}</span>
                </div>
                <div class="it-fields">
                  <div class="field-line">
                    <span class="fl">X 位置</span>
                    <el-input-number v-model="it.x.value" :step="1" controls-position="right" />
                    <el-select v-model="it.x.unit" style="width: 76px">
                      <el-option label="%" value="%" />
                      <el-option label="px" value="px" />
                    </el-select>
                  </div>
                  <div class="field-line">
                    <span class="fl">Y 位置</span>
                    <el-input-number v-model="it.y.value" :step="1" controls-position="right" />
                    <el-select v-model="it.y.unit" style="width: 76px">
                      <el-option label="%" value="%" />
                      <el-option label="px" value="px" />
                    </el-select>
                  </div>
                  <div class="field-line">
                    <span class="fl">大小</span>
                    <el-input-number v-model="it.width.value" :min="0" :step="1" controls-position="right" />
                    <el-select v-model="it.width.unit" style="width: 76px">
                      <el-option label="%" value="%" />
                      <el-option label="px" value="px" />
                    </el-select>
                  </div>
                </div>
                <el-button link type="danger" @click="config.illustrations.splice(i, 1)">删除</el-button>
              </div>
            </div>
            <el-empty v-else description="还没有添加插画" :image-size="70" />
            <p class="panel-tip">位置与大小都支持百分比（相对画布宽/高）和 px 两种单位。</p>
          </div>

          <!-- 第三步：文字 -->
          <div v-show="step === 2">
            <div class="block-title">
              <span>文字列表</span>
              <el-button size="small" :icon="Plus" @click="addText">添加文字</el-button>
            </div>

            <div v-if="config.texts.length" class="item-list">
              <div v-for="(t, i) in config.texts" :key="t.id" class="text-item">
                <div class="text-head">
                  <el-input v-model="t.content" type="textarea" :rows="1" autosize placeholder="文字内容" />
                  <el-button link type="danger" @click="config.texts.splice(i, 1)">删除</el-button>
                </div>
                <div class="text-fields">
                  <div class="field-line">
                    <span class="fl">字号</span>
                    <el-input-number v-model="t.fontSize" :min="8" :max="400" controls-position="right" />
                    <span class="unit">px</span>
                  </div>
                  <div class="field-line">
                    <span class="fl">颜色</span>
                    <el-color-picker v-model="t.color" />
                  </div>
                  <div class="field-line">
                    <span class="fl">样式</span>
                    <el-checkbox v-model="t.bold">加粗</el-checkbox>
                    <el-checkbox v-model="t.italic">斜体</el-checkbox>
                  </div>
                  <div class="field-line">
                    <span class="fl">X 位置</span>
                    <el-input-number v-model="t.x.value" :step="1" controls-position="right" />
                    <el-select v-model="t.x.unit" style="width: 76px">
                      <el-option label="%" value="%" />
                      <el-option label="px" value="px" />
                    </el-select>
                  </div>
                  <div class="field-line">
                    <span class="fl">Y 位置</span>
                    <el-input-number v-model="t.y.value" :step="1" controls-position="right" />
                    <el-select v-model="t.y.unit" style="width: 76px">
                      <el-option label="%" value="%" />
                      <el-option label="px" value="px" />
                    </el-select>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="还没有添加文字" :image-size="70" />
          </div>

          <div class="step-actions">
            <el-button v-if="step > 0" @click="step--">上一步</el-button>
            <el-button v-if="step < 2" type="primary" @click="step++">下一步</el-button>
            <el-button v-else type="primary" :loading="saving" @click="handleSave">保存</el-button>
            <span class="step-tip">第 {{ step + 1 }} / 3 步</span>
          </div>
        </div>

        <div class="preview-panel">
          <div class="preview-title">
            合成预览
            <span class="dim">{{ form.width }} × {{ form.height }} · 质量 {{ form.quality }}%</span>
          </div>
          <div class="canvas-wrap">
            <canvas ref="canvasRef" class="preview-canvas"></canvas>
          </div>
          <ul class="preview-info">
            <li>底图：{{ config.base ? '已选择' : '空白画布' }}</li>
            <li>插画：{{ config.illustrations.length }} 个</li>
            <li>文字：{{ config.texts.length }} 段</li>
          </ul>
          <p class="preview-tip">预览按比例缩放显示，保存时按 {{ form.width }}×{{ form.height }} 导出。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Upload, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getImageTemplateDetail, saveImageTemplate } from '@/api/imageTemplate'
import { IMAGE_TYPES } from './constants'

const BUILTIN_EMOJIS = [
  '🎉', '⭐', '❤️', '🔥', '🌈', '🚀', '📌', '☁️',
  '🌸', '✨', '🎈', '🏆', '💡', '📷', '🎨', '🍀',
  '🌻', '🦋', '🐱', '🐶', '🍎', '☀️', '🌙', '⚡',
]

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const step = ref(0)
const saving = ref(false)
const loadingDetail = ref(false)
const canvasRef = ref(null)
const baseInputRef = ref(null)
const illusInputRef = ref(null)

const form = reactive({ name: '', type: '图片', width: 1200, height: 800, quality: 90 })
const config = reactive({ base: null, illustrations: [], texts: [] })

let idSeq = 0
const nextId = () => `i${Date.now().toString(36)}${++idSeq}`

// ===== 图片读取（压缩后转 dataURL，避免请求体过大）=====
const fileToDataUrl = (file, { maxSize = 2000, keepAlpha = false, quality = 0.9 } = {}) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      resolve({
        dataUrl: canvas.toDataURL(keepAlpha ? 'image/png' : 'image/jpeg', quality),
        width: img.width,
        height: img.height,
      })
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('图片读取失败'))
    }
    img.src = objectUrl
  })

// ===== 底图 =====
const pickBaseFile = () => baseInputRef.value && baseInputRef.value.click()
const onBaseChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  const hadBase = !!config.base
  try {
    const img = await fileToDataUrl(file, { maxSize: 2000 })
    config.base = img.dataUrl
    if (!hadBase) {
      form.width = Math.min(5000, Math.max(100, img.width))
      form.height = Math.min(5000, Math.max(100, img.height))
    }
    ElMessage.success('底图已设置')
  } catch (err) {
    ElMessage.error('底图读取失败，请更换图片')
  }
}
const useBaseSize = async () => {
  if (!config.base) return
  const img = await loadImage(config.base)
  if (!img) return
  form.width = Math.min(5000, Math.max(100, img.width))
  form.height = Math.min(5000, Math.max(100, img.height))
}

// ===== 插画 =====
const pickIllustrationFiles = () => illusInputRef.value && illusInputRef.value.click()
const addEmoji = (emoji) => {
  config.illustrations.push({
    id: nextId(),
    type: 'emoji',
    emoji,
    x: { value: 50, unit: '%' },
    y: { value: 50, unit: '%' },
    width: { value: 8, unit: '%' },
  })
}
const onIllustrationChange = async (e) => {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  for (const file of files) {
    try {
      const img = await fileToDataUrl(file, { maxSize: 800, keepAlpha: true })
      config.illustrations.push({
        id: nextId(),
        type: 'image',
        src: img.dataUrl,
        x: { value: 10, unit: '%' },
        y: { value: 10, unit: '%' },
        width: { value: 20, unit: '%' },
      })
    } catch (err) {
      ElMessage.error(`${file.name} 读取失败`)
    }
  }
}

// ===== 文字 =====
const addText = () => {
  config.texts.push({
    id: nextId(),
    content: '示例文字',
    fontSize: 36,
    color: '#2c3e50',
    bold: true,
    italic: false,
    x: { value: 10, unit: '%' },
    y: { value: 10, unit: '%' },
  })
}

// ===== 绘制 =====
const imageCache = new Map()

const loadImage = (src) => {
  if (!src) return Promise.resolve(null)
  if (imageCache.has(src)) return imageCache.get(src)
  const task = new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
  imageCache.set(src, task)
  return task
}

const pxOf = (pos, base) => {
  const value = Number(pos && pos.value) || 0
  return pos && pos.unit === 'px' ? value : (value / 100) * base
}

const paint = async (ctx, scale) => {
  const w = Math.max(1, Math.round(form.width * scale))
  const h = Math.max(1, Math.round(form.height * scale))
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  if (config.base) {
    const img = await loadImage(config.base)
    if (img) {
      // cover：铺满画布并居中裁剪，避免底图变形
      const ratio = Math.max(w / img.width, h / img.height)
      const dw = img.width * ratio
      const dh = img.height * ratio
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
    }
  }

  for (const it of config.illustrations) {
    const x = pxOf(it.x, form.width) * scale
    const y = pxOf(it.y, form.height) * scale
    const widthPx = Math.max(1, pxOf(it.width, form.width) * scale)
    if (it.type === 'image') {
      const img = await loadImage(it.src)
      if (!img) continue
      const ratio = img.height / img.width
      ctx.drawImage(img, x, y, widthPx, widthPx * ratio)
    } else {
      ctx.font = `${widthPx}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = '#000'
      ctx.fillText(it.emoji, x, y)
    }
  }

  for (const t of config.texts) {
    const fontSize = Math.max(1, Number(t.fontSize) || 16)
    ctx.font = `${t.italic ? 'italic ' : ''}${t.bold ? 'bold ' : ''}${fontSize * scale}px "Microsoft YaHei", "PingFang SC", sans-serif`
    ctx.fillStyle = t.color || '#2c3e50'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    const x = pxOf(t.x, form.width) * scale
    const y = pxOf(t.y, form.height) * scale
    const lineHeight = fontSize * scale * 1.25
    String(t.content || '')
      .split('\n')
      .forEach((line, idx) => ctx.fillText(line, x, y + idx * lineHeight))
  }
}

let drawChain = Promise.resolve()
const drawPreview = async () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const w = Math.max(1, Number(form.width) || 1)
  const h = Math.max(1, Number(form.height) || 1)
  const scale = Math.min(640 / w, 420 / h, 1)
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext('2d')
  await paint(ctx, scale)
}

const scheduleDraw = () => {
  drawChain = drawChain.then(drawPreview).catch(() => {})
}

watch([() => form.width, () => form.height, () => form.quality, config], scheduleDraw, { deep: true })

// ===== 保存 =====
const exportDataUrl = async () => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Number(form.width) || 1)
  canvas.height = Math.max(1, Number(form.height) || 1)
  const ctx = canvas.getContext('2d')
  await paint(ctx, 1)
  const quality = Math.min(1, Math.max(0.1, (Number(form.quality) || 90) / 100))
  return canvas.toDataURL('image/jpeg', quality)
}

const handleSave = async () => {
  if (!form.name.trim()) {
    step.value = 0
    ElMessage.warning('请输入合成图片名称')
    return
  }
  saving.value = true
  try {
    const preview = await exportDataUrl()
    const payload = {
      name: form.name.trim(),
      type: form.type,
      width: form.width,
      height: form.height,
      quality: form.quality,
      config: {
        base: config.base,
        illustrations: config.illustrations,
        texts: config.texts,
      },
      preview,
    }
    if (isEdit.value) payload.id = Number(route.params.id)

    // 服务端请求体限制 30MB，留出余量提前提示
    if (JSON.stringify(payload).length > 24 * 1024 * 1024) {
      ElMessage.error('素材过大，请减少插画数量或降低图片尺寸')
      return
    }

    await saveImageTemplate(payload)
    ElMessage.success('保存成功')
    router.push('/business/image-compose')
  } catch (err) {
    // 错误提示已由 request 拦截器统一弹出
  } finally {
    saving.value = false
  }
}

const goBack = () => router.push('/business/image-compose')

// ===== 编辑回显 =====
const normalizeIllustrations = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    id: it.id || nextId(),
    type: it.type === 'emoji' ? 'emoji' : 'image',
    src: it.src || '',
    emoji: it.emoji || '',
    x: { value: Number(it.x && it.x.value) || 0, unit: it.x && it.x.unit === 'px' ? 'px' : '%' },
    y: { value: Number(it.y && it.y.value) || 0, unit: it.y && it.y.unit === 'px' ? 'px' : '%' },
    width: {
      value: Number(it.width && it.width.value) || 10,
      unit: it.width && it.width.unit === 'px' ? 'px' : '%',
    },
  }))

const normalizeTexts = (arr) =>
  (Array.isArray(arr) ? arr : []).map((t) => ({
    id: t.id || nextId(),
    content: t.content || '',
    fontSize: Number(t.fontSize) || 36,
    color: t.color || '#2c3e50',
    bold: !!t.bold,
    italic: !!t.italic,
    x: { value: Number(t.x && t.x.value) || 0, unit: t.x && t.x.unit === 'px' ? 'px' : '%' },
    y: { value: Number(t.y && t.y.value) || 0, unit: t.y && t.y.unit === 'px' ? 'px' : '%' },
  }))

onMounted(async () => {
  scheduleDraw()
  if (!isEdit.value) return
  loadingDetail.value = true
  try {
    const res = await getImageTemplateDetail(route.params.id)
    const data = res.data || {}
    form.name = data.name || ''
    form.type = data.type || '图片'
    form.width = Number(data.width) || 1200
    form.height = Number(data.height) || 800
    form.quality = Number(data.quality) || 90
    const cfg = data.config || {}
    config.base = cfg.base || null
    config.illustrations = normalizeIllustrations(cfg.illustrations)
    config.texts = normalizeTexts(cfg.texts)
    scheduleDraw()
  } catch {
    // 错误提示已由拦截器弹出
  } finally {
    loadingDetail.value = false
  }
})
</script>

<style lang="scss" scoped>
.header-ops {
  display: flex;
  gap: 8px;
}

.steps {
  margin: 8px 0 24px;
}

.editor-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.config-panel {
  flex: 1;
  min-width: 0;
}

.preview-panel {
  width: 460px;
  flex-shrink: 0;
  position: sticky;
  top: 12px;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 14px;
  background: #fafbfc;
}

.preview-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;

  .dim {
    font-size: 12px;
    font-weight: 400;
    color: #909399;
  }
}

.canvas-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  padding: 10px;
  min-height: 240px;
}

.preview-canvas {
  max-width: 100%;
  height: auto;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.preview-info {
  margin: 12px 0 0;
  padding-left: 18px;
  font-size: 12px;
  color: #606266;
  line-height: 22px;
}

.preview-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: #909399;
}

.base-box {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.base-thumb {
  width: 150px;
  max-height: 100px;
  object-fit: contain;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
}

.base-empty {
  width: 150px;
  height: 100px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #c0c4cc;
  font-size: 12px;
  background: #fafbfc;
}

.base-ops {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .hint {
    font-size: 12px;
    color: #909399;
  }
}

.unit {
  margin-left: 8px;
  font-size: 13px;
  color: #606266;
}

.panel-tip {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 4px 0 12px;

  .sub {
    font-size: 12px;
    font-weight: 400;
    color: #909399;
  }
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
  gap: 8px;
  margin-bottom: 20px;
}

.emoji-btn {
  height: 40px;
  font-size: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #1a73e8;
    background: #f0f7ff;
  }
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.item-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafbfc;
}

.it-thumb {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .it-emoji {
    font-size: 26px;
  }
}

.it-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.field-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .fl {
    width: 52px;
    flex-shrink: 0;
    font-size: 12px;
    color: #606266;
  }

  :deep(.el-input-number) {
    width: 130px;
  }
}

.text-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafbfc;
}

.text-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.text-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px 16px;
}

.step-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f2f3f5;

  .step-tip {
    margin-left: auto;
    font-size: 12px;
    color: #909399;
  }
}

.hidden-input {
  display: none;
}

@media (max-width: 1200px) {
  .editor-body {
    flex-direction: column;
  }

  .preview-panel {
    width: 100%;
    position: static;
  }
}
</style>
