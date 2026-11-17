<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">{{ isEdit ? '编辑流程' : '新增流程' }}</span>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="max-width: 680px"
        v-loading="loading"
      >
        <el-form-item label="流程名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入流程名称" />
        </el-form-item>
        <el-form-item label="流程分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类" style="width:100%">
            <el-option label="数据采集" value="数据采集" />
            <el-option label="文档处理" value="文档处理" />
            <el-option label="系统运维" value="系统运维" />
            <el-option label="业务自动化" value="业务自动化" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="draft">草稿</el-radio>
            <el-radio value="published">已发布</el-radio>
            <el-radio value="offline">已下线</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="form.version" placeholder="如 v1.0.0" />
        </el-form-item>
        <el-form-item label="流程描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入流程描述" />
        </el-form-item>
        <el-form-item label="流程步骤">
          <div class="steps-editor">
            <div class="step-item" v-for="(step, idx) in form.steps" :key="idx">
              <el-input v-model="step.name" placeholder="步骤名称" style="flex:1" />
              <el-select v-model="step.type" placeholder="步骤类型" style="width:160px">
                <el-option label="打开页面" value="open_url" />
                <el-option label="点击元素" value="click" />
                <el-option label="输入文本" value="input" />
                <el-option label="等待" value="wait" />
                <el-option label="数据提取" value="extract" />
                <el-option label="条件判断" value="condition" />
              </el-select>
              <el-button type="danger" :icon="Delete" circle size="small" @click="removeStep(idx)" />
            </div>
            <el-button type="primary" plain :icon="Plus" @click="addStep">添加步骤</el-button>
          </div>
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
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useEditPage } from '@/composables/useEditPage'
import { saveProcess, getProcessDetail } from '@/api/process'

const { isEdit, id, goBack } = useEditPage('/process')

const loading = ref(false)
const saving = ref(false)
const formRef = ref()

const form = reactive({
  id: null,
  name: '',
  category: '',
  status: 'draft',
  version: 'v1.0.0',
  description: '',
  steps: [],
})

const rules = {
  name: [{ required: true, message: '请输入流程名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
}

const addStep = () => {
  form.steps.push({ name: '', type: '' })
}

const removeStep = (idx) => {
  form.steps.splice(idx, 1)
}

const loadDetail = async () => {
  if (!id.value) return
  loading.value = true
  try {
    const res = await getProcessDetail(id.value)
    if (res.data) {
      Object.assign(form, res.data)
      if (!form.steps) form.steps = []
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
      await saveProcess(form)
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
.steps-editor {
  width: 100%;

  .step-item {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    align-items: center;
  }
}
</style>
