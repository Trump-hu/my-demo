<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">图片合成</span>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增合成</el-button>
      </div>

      <div class="search-bar">
        <el-input
          v-model="query.keyword"
          placeholder="合成图片名称"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="query.type" placeholder="全部类型" clearable style="width: 130px" @change="handleSearch">
          <el-option v-for="t in IMAGE_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button>
      </div>

      <div v-loading="loading" class="card-wrap">
        <el-empty v-if="!loading && !list.length" description="暂无合成图片" />
        <div v-else class="card-grid">
          <div v-for="item in list" :key="item.id" class="item-card">
            <div class="thumb">
              <el-image
                v-if="thumbs[item.id]"
                :src="item.image"
                :preview-src-list="[thumbs[item.id]]"
                :alt="item.name"
                fit="cover"
                preview-teleported
                hide-on-click-modal
                class="thumb-img"
                title="点击查看大图"
              />
              <el-icon v-else class="thumb-placeholder"><Picture /></el-icon>
              <span class="dim">{{ item.width }} × {{ item.height }}</span>
            </div>
            <div class="right">
              <div class="info">
                <div class="name-row">
                  <span class="name" :title="item.name">{{ item.name }}</span>
                  <el-tag :type="typeTag(item.type)" size="small" effect="light">{{ item.type }}</el-tag>
                </div>
                <div class="meta-row">
                  <span class="label">大小</span>
                  <span class="value">{{ formatSize(item.fileSize) }}</span>
                </div>
                <div class="meta-row">
                  <span class="label">创建人</span>
                  <span class="value">{{ item.creatorName || '—' }}</span>
                </div>
                <div class="meta-row">
                  <span class="label">更新人</span>
                  <span class="value">{{ item.updaterName || '—' }}</span>
                </div>
                <div class="meta-row">
                  <span class="label">创建时间</span>
                  <span class="value">{{ item.createTime }}</span>
                </div>
                <div class="meta-row">
                  <span class="label">更新时间</span>
                  <span class="value">{{ item.updateTime }}</span>
                </div>
              </div>
              <div class="ops">
                <el-button link type="primary" size="small" @click="handleEdit(item)">编辑</el-button>
                <el-button
                  link
                  type="primary"
                  size="small"
                  :loading="copyingId === item.id"
                  @click="handleCopy(item)"
                >
                  复制
                </el-button>
                <el-button link type="danger" size="small" @click="handleDelete(item)">删除</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, RefreshLeft, Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getImageTemplateList, deleteImageTemplate, copyImageTemplate, fetchImageTemplatePreview } from '@/api/imageTemplate'
import { IMAGE_TYPES, typeTag } from './constants'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const copyingId = ref(null)
const query = reactive({ keyword: '', type: '', page: 1, pageSize: 12 })
const thumbs = ref({})
const thumbUrls = new Set()

const formatSize = (bytes) => {
  const n = Number(bytes) || 0
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

const loadThumbs = async (rows) => {
  // 预览图需要携带 token，逐个取 blob 再转成本地 URL
  for (const row of rows) {
    if (thumbs.value[row.id] || !row.hasPreview) continue
    try {
      const blob = await fetchImageTemplatePreview(row.id)
      if (!(blob instanceof Blob)) continue
      const url = URL.createObjectURL(blob)
      thumbUrls.add(url)
      thumbs.value = { ...thumbs.value, [row.id]: url }
    } catch {
      // 预览图加载失败时保留占位图标
    }
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getImageTemplateList({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      type: query.type || undefined,
    })
    list.value = res.data.list || []
    total.value = res.data.total || 0
    loadThumbs(list.value)
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
  query.type = ''
  query.page = 1
  loadData()
}

const handleAdd = () => {
  router.push('/business/image-compose/edit')
}

const handleEdit = (row) => {
  router.push(`/business/image-compose/edit/${row.id}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除「${row.name}」吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteImageTemplate(row.id)
      ElMessage.success('删除成功')
      if (list.value.length === 1 && query.page > 1) query.page--
      loadData()
    })
    .catch(() => {})
}

// 一键复制：直接生成一条「原名-副本」的记录，无需进入编辑页
const handleCopy = async (row) => {
  copyingId.value = row.id
  try {
    await copyImageTemplate(row.id)
    ElMessage.success('复制成功')
    loadData()
  } catch (e) {
    // 错误提示已由 request 拦截器统一弹出
  } finally {
    copyingId.value = null
  }
}

let firstActivate = true
onMounted(loadData)
// 页面被 keep-alive 缓存，从编辑页返回时需要重新拉取列表
onActivated(() => {
  if (firstActivate) {
    firstActivate = false
    return
  }
  loadData()
})

onBeforeUnmount(() => {
  thumbUrls.forEach((url) => URL.revokeObjectURL(url))
  thumbUrls.clear()
})
</script>

<style lang="scss" scoped>
.card-wrap {
  min-height: 220px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.item-card {
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  background: #fff;
  transition: all 0.2s;

  &:hover {
    border-color: #1a73e8;
    box-shadow: 0 4px 16px rgba(26, 115, 232, 0.12);
  }
}

.thumb {
  position: relative;
  width: 192px;
  height: 144px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;

  .thumb-img {
    display: block;
    // width: 100%;
    // height: 100%;
    // object-fit: cover;
    cursor: zoom-in;

    :deep(.el-image__inner) {
      width: 100%;
      height: 100%;
    }
  }

  .thumb-placeholder {
    font-size: 32px;
    color: #c0c4cc;
  }

  .dim {
    position: absolute;
    right: 6px;
    bottom: 6px;
    padding: 1px 6px;
    font-size: 10px;
    line-height: 16px;
    color: #fff;
    background: rgba(0, 0, 0, 0.45);
    border-radius: 8px;
    pointer-events: none;
  }
}

.right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.info {
  min-width: 0;

  .name-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    min-width: 0;
  }

  .name {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    font-size: 11px;
    line-height: 18px;

    .label {
      color: #909399;
      flex-shrink: 0;
    }

    .value {
      color: #606266;
      text-align: right;
      line-height: 16px;
      word-break: break-all;
      overflow: hidden;
    }
  }
}

.ops {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: auto;
  padding-top: 6px;
}

// 一行最多 4 个卡片，小屏依次减少
@media (max-width: 1199px) {
  .card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
