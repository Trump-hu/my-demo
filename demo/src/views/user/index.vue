<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">用户管理</span>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
      </div>

      <div class="search-bar">
        <el-input v-model="query.keyword" placeholder="用户名/昵称/邮箱" clearable style="width:240px" @keyup.enter="loadData" />
        <el-select v-model="query.dept" placeholder="部门" clearable style="width:140px">
          <el-option label="技术部" value="技术部" />
          <el-option label="运营部" value="运营部" />
          <el-option label="财务部" value="财务部" />
          <el-option label="市场部" value="市场部" />
          <el-option label="人事部" value="人事部" />
        </el-select>
        <el-select v-model="query.status" placeholder="状态" clearable style="width:100px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
        <el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border stripe style="width:100%">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="dept" label="部门" width="100" />
        <el-table-column prop="role" label="角色" width="120" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="lastLogin" label="最后登录" width="160" />
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="handleResetPwd(row)">重置密码</el-button>
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
import { getUserList, deleteUser, resetPassword } from '@/api/user'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const query = reactive({ keyword: '', dept: '', status: '', page: 1, pageSize: 10 })

const loadData = async () => {
  loading.value = true
  try {
    const res = await getUserList(query)
    tableData.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => { query.keyword=''; query.dept=''; query.status=''; query.page=1; loadData() }

const handleAdd = () => {
  router.push('/user/edit')
}

const handleEdit = (row) => {
  router.push(`/user/edit/${row.id}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除用户「${row.username}」吗？`, '提示', { type: 'warning' })
    .then(async () => { await deleteUser(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}

const handleResetPwd = (row) => {
  ElMessageBox.confirm(`确定要重置用户「${row.username}」的密码吗？`, '提示', { type: 'warning' })
    .then(async () => { await resetPassword(row.id); ElMessage.success('密码已重置') })
    .catch(() => {})
}

const handleStatusChange = (row) => {
  ElMessage.success(`用户「${row.username}」已${row.status === 1 ? '启用' : '禁用'}`)
}

onMounted(() => loadData())
</script>
