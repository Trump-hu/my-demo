<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">{{ isEdit ? '编辑用户' : '新增用户' }}</span>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="max-width: 720px"
        v-loading="loading"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" :disabled="isEdit" placeholder="请输入用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="form.nickname" placeholder="请输入昵称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="dept">
              <el-select v-model="form.dept" placeholder="请选择部门" style="width:100%">
                <el-option label="技术部" value="技术部" />
                <el-option label="运营部" value="运营部" />
                <el-option label="财务部" value="财务部" />
                <el-option label="市场部" value="市场部" />
                <el-option label="人事部" value="人事部" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="form.role" placeholder="请选择角色" style="width:100%">
                <el-option label="超级管理员" value="超级管理员" />
                <el-option label="流程管理员" value="流程管理员" />
                <el-option label="操作员" value="操作员" />
                <el-option label="查看者" value="查看者" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="初始密码" v-if="!isEdit" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入初始密码" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useEditPage } from '@/composables/useEditPage'
import { saveUser, getUserList } from '@/api/user'

const { isEdit, id, goBack } = useEditPage('/user')

const loading = ref(false)
const saving = ref(false)
const formRef = ref()

const form = reactive({
  id: null,
  username: '',
  nickname: '',
  email: '',
  phone: '',
  dept: '',
  role: '',
  status: 1,
  password: '',
  remark: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
  dept: [{ required: true, message: '请选择部门', trigger: 'change' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }],
}

const loadDetail = async () => {
  if (!id.value) return
  loading.value = true
  try {
    const res = await getUserList({ page: 1, pageSize: 200 })
    const item = res.data.list.find(u => u.id === Number(id.value))
    if (item) {
      Object.assign(form, item)
    }
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      await saveUser(form)
      ElMessage.success('保存成功')
      goBack()
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => loadDetail())
</script>
