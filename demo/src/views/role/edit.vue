<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <span class="page-title">{{ isEdit ? '编辑角色' : '新增角色' }}</span>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="max-width: 680px"
        v-loading="loading"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code" :disabled="isEdit" placeholder="如 process_admin" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
          <span class="form-help">数值越小排序越靠前</span>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色描述" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入角色描述" />
        </el-form-item>

        <!-- 权限分配（编辑模式下展示） -->
        <el-divider content-position="left">权限分配</el-divider>
        <el-form-item label="菜单权限">
          <div class="perm-tree-wrapper">
            <div class="perm-toolbar">
              <el-button text type="primary" size="small" @click="checkAll">全选</el-button>
              <el-button text size="small" @click="uncheckAll">清空</el-button>
              <el-button text size="small" @click="expandAll">展开全部</el-button>
            </div>
            <el-tree
              ref="treeRef"
              :data="permTree"
              show-checkbox
              node-key="id"
              :default-checked-keys="defaultChecked"
              :default-expand-all="true"
              :props="{ label: 'label', children: 'children' }"
            />
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useEditPage } from '@/composables/useEditPage'
import { saveRole, getRoleList, getPermissionTree } from '@/api/role'

const { isEdit, id, goBack } = useEditPage('/role')

const loading = ref(false)
const saving = ref(false)
const formRef = ref()
const treeRef = ref()
const permTree = ref([])
const defaultChecked = ref([])

const form = reactive({
  id: null,
  name: '',
  code: '',
  sort: 0,
  status: 1,
  remark: '',
})

const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
}

const checkAll = () => {
  const allKeys = []
  permTree.value.forEach(n => {
    if (n.children) {
      n.children.forEach(c => allKeys.push(c.id))
    } else {
      allKeys.push(n.id)
    }
  })
  treeRef.value.setCheckedKeys(allKeys)
}

const uncheckAll = () => {
  treeRef.value.setCheckedKeys([])
}

const expandAll = () => {
  // 已默认展开，此函数预留
}

const loadDetail = async () => {
  loading.value = true
  try {
    const [roleRes, permRes] = await Promise.all([
      getRoleList({ page: 1, pageSize: 200 }),
      getPermissionTree(),
    ])
    permTree.value = permRes.data
    if (id.value) {
      const item = roleRes.data.list.find(r => r.id === Number(id.value))
      if (item) {
        Object.assign(form, item)
        // 根据角色code预设权限
        if (form.code === 'super_admin') {
          defaultChecked.value = permTree.value.flatMap(n => n.children?.map(c => c.id) || [])
        } else if (form.code === 'process_admin') {
          defaultChecked.value = [11,12,13,14,15,21,22,23,24,25,31,32,33,34,35,36,41,42]
        }
      }
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
      const checkedKeys = treeRef.value.getCheckedKeys()
      const halfChecked = treeRef.value.getHalfCheckedKeys()
      form.permissions = [...checkedKeys, ...halfChecked]
      await saveRole(form)
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
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.perm-tree-wrapper {
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 4px;

  .perm-toolbar {
    padding: 8px 12px;
    border-bottom: 1px solid #ebeef5;
    background: #f5f7fa;
  }
}
</style>
