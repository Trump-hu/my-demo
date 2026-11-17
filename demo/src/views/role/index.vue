<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">角色管理</span>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button>
      </div>

      <div class="search-bar">
        <el-input v-model="query.keyword" placeholder="角色名称/编码" clearable style="width:220px" @keyup.enter="loadData" />
        <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
        <el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border stripe style="width:100%">
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="name" label="角色名称" width="160" />
        <el-table-column prop="code" label="角色编码" width="160" />
        <el-table-column prop="remark" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="userCount" label="用户数" width="100" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handlePermission(row)">分配权限</el-button>
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

    <!-- 权限分配弹窗 -->
    <el-dialog v-model="permVisible" title="分配权限" width="500px">
      <div class="perm-role-name" v-if="currentRole">
        角色：{{ currentRole.name }}
      </div>
      <el-tree
        ref="treeRef"
        :data="permTree"
        show-checkbox
        node-key="id"
        :default-checked-keys="defaultChecked"
        :props="{ label: 'label', children: 'children' }"
      />
      <template #footer>
        <el-button @click="permVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSavePerm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoleList, deleteRole, getPermissionTree } from '@/api/role'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const permVisible = ref(false)
const currentRole = ref(null)
const treeRef = ref()
const permTree = ref([])
const defaultChecked = ref([])

const query = reactive({ keyword: '', page: 1, pageSize: 10 })

const loadData = async () => {
  loading.value = true
  try {
    const res = await getRoleList(query)
    tableData.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => { query.keyword=''; query.page=1; loadData() }

const handleAdd = () => {
  router.push('/role/edit')
}

const handleEdit = (row) => {
  router.push(`/role/edit/${row.id}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除角色「${row.name}」吗？`, '提示', { type: 'warning' })
    .then(async () => { await deleteRole(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}

const handlePermission = async (row) => {
  currentRole.value = row
  if (permTree.value.length === 0) {
    const res = await getPermissionTree()
    permTree.value = res.data
  }
  defaultChecked.value = row.code === 'super_admin'
    ? permTree.value.flatMap(n => n.children?.map(c => c.id) || [])
    : row.code === 'process_admin'
      ? [11,12,13,14,15,21,22,23,24,25,31,32,33,34,35,36,41,42]
      : []
  permVisible.value = true
}

const handleSavePerm = () => {
  ElMessage.success('权限保存成功')
  permVisible.value = false
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.perm-role-name {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  color: #303133;
}
</style>
