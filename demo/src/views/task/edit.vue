<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">{{ isEdit ? '编辑任务' : '新增任务' }}</span>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        style="max-width: 720px"
        v-loading="loading"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="关联流程" prop="processName">
          <el-select v-model="form.processName" placeholder="请选择流程" style="width:100%">
            <el-option label="数据采集流程" value="数据采集流程" />
            <el-option label="报表生成流程" value="报表生成流程" />
            <el-option label="邮件处理流程" value="邮件处理流程" />
            <el-option label="文件整理流程" value="文件整理流程" />
            <el-option label="系统巡检流程" value="系统巡检流程" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行机器人" prop="robotName">
          <el-select v-model="form.robotName" placeholder="请选择机器人" style="width:100%">
            <el-option v-for="i in 10" :key="i" :label="`机器人节点 ${i}`" :value="`机器人节点 ${i}`" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="form.priority">
            <el-radio value="high">高</el-radio>
            <el-radio value="medium">中</el-radio>
            <el-radio value="low">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="触发方式" prop="triggerType">
          <el-radio-group v-model="form.triggerType">
            <el-radio value="manual">手动触发</el-radio>
            <el-radio value="scheduled">定时触发</el-radio>
            <el-radio value="api">API触发</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Cron表达式" v-if="form.triggerType==='scheduled'" prop="cron">
          <el-input v-model="form.cron" placeholder="如 0 0 * * *（每天0点）" />
          <div class="form-help">秒 分 时 日 月 周，支持 * / - , 等通配符</div>
        </el-form-item>
        <el-form-item label="超时时间(秒)">
          <el-input-number v-model="form.timeout" :min="60" :max="86400" />
        </el-form-item>
        <el-form-item label="失败重试次数">
          <el-input-number v-model="form.retryCount" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="任务参数">
          <el-input v-model="form.params" type="textarea" :rows="3" placeholder='JSON格式，如 {"key":"value"}' />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入任务描述" />
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
import { saveTask, getTaskList } from '@/api/task'

const { isEdit, id, goBack } = useEditPage('/task')

const loading = ref(false)
const saving = ref(false)
const formRef = ref()

const form = reactive({
  id: null,
  name: '',
  processName: '',
  robotName: '',
  priority: 'medium',
  triggerType: 'manual',
  cron: '',
  timeout: 3600,
  retryCount: 3,
  params: '',
  description: '',
})

const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  processName: [{ required: true, message: '请选择流程', trigger: 'change' }],
  robotName: [{ required: true, message: '请选择机器人', trigger: 'change' }],
  cron: [{ required: true, message: '请输入Cron表达式', trigger: 'blur' }],
}

const loadDetail = async () => {
  if (!id.value) return
  loading.value = true
  try {
    const res = await getTaskList({ page: 1, pageSize: 200 })
    const item = res.data.list.find(t => t.id === Number(id.value))
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
      await saveTask(form)
      ElMessage.success('保存成功')
      goBack()
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => loadDetail())
</script>

<style lang="scss" scoped>
.form-help {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
</style>
