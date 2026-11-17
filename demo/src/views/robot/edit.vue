<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">{{ isEdit ? '编辑机器人' : '新增机器人' }}</span>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="max-width: 680px"
        v-loading="loading"
      >
        <el-form-item label="机器人名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入机器人名称" />
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="form.ip" placeholder="请输入IP地址，如 192.168.1.100" />
        </el-form-item>
        <el-form-item label="操作系统" prop="os">
          <el-select v-model="form.os" placeholder="请选择操作系统" style="width:100%">
            <el-option label="Windows 10" value="Windows 10" />
            <el-option label="Windows 11" value="Windows 11" />
            <el-option label="Windows Server 2019" value="Windows Server 2019" />
            <el-option label="Windows Server 2022" value="Windows Server 2022" />
          </el-select>
        </el-form-item>
        <el-form-item label="机房位置" prop="location">
          <el-input v-model="form.location" placeholder="请输入机房位置，如 机房A-01" />
        </el-form-item>
        <el-form-item label="备注说明" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注说明" />
        </el-form-item>

        <!-- 编辑模式展示运行信息 -->
        <template v-if="isEdit">
          <el-divider content-position="left">运行状态</el-divider>
          <el-form-item label="CPU使用率">
            <el-progress :percentage="form.cpu || 0" :stroke-width="14" />
          </el-form-item>
          <el-form-item label="内存使用率">
            <el-progress :percentage="form.memory || 0" :stroke-width="14" />
          </el-form-item>
          <el-form-item label="磁盘使用率">
            <el-progress :percentage="form.disk || 0" :stroke-width="14" />
          </el-form-item>
          <el-form-item label="最后心跳">
            <span>{{ form.lastHeartbeat || '-' }}</span>
          </el-form-item>
        </template>

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
import { saveRobot, getRobotList } from '@/api/robot'

const { isEdit, id, goBack } = useEditPage('/robot')

const loading = ref(false)
const saving = ref(false)
const formRef = ref()

const form = reactive({
  id: null,
  name: '',
  ip: '',
  os: '',
  location: '',
  remark: '',
  cpu: 0,
  memory: 0,
  disk: 0,
  lastHeartbeat: '',
})

const rules = {
  name: [{ required: true, message: '请输入机器人名称', trigger: 'blur' }],
  ip: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: 'IP地址格式不正确', trigger: 'blur' },
  ],
  os: [{ required: true, message: '请选择操作系统', trigger: 'change' }],
}

const loadDetail = async () => {
  if (!id.value) return
  loading.value = true
  try {
    const res = await getRobotList({ keyword: '', page: 1, pageSize: 200 })
    const item = res.data.list.find(r => r.id === Number(id.value))
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
      await saveRobot(form)
      ElMessage.success('保存成功')
      goBack()
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => loadDetail())
</script>
