<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" class="setting-tabs">
      <el-tab-pane label="基础设置" name="basic">
        <div class="page-card" v-loading="loading">
          <el-form :model="settingForm" label-width="160px" style="max-width:600px">
            <el-form-item label="系统名称">
              <el-input v-model="settingForm.systemName" />
            </el-form-item>
            <el-form-item label="系统Logo">
              <el-input v-model="settingForm.logo" placeholder="Logo URL" />
            </el-form-item>
            <el-form-item label="系统描述">
              <el-input v-model="settingForm.description" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="版权信息">
              <el-input v-model="settingForm.copyright" />
            </el-form-item>
            <el-form-item label="备案号">
              <el-input v-model="settingForm.icp" placeholder="如：京ICP备XXXXXXXX号" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSave">保存</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="任务设置" name="task">
        <div class="page-card">
          <el-form :model="taskSetting" label-width="180px" style="max-width:600px">
            <el-form-item label="最大并发任务数">
              <el-input-number v-model="taskSetting.maxConcurrency" :min="1" :max="100" />
            </el-form-item>
            <el-form-item label="任务超时时间(秒)">
              <el-input-number v-model="taskSetting.timeout" :min="60" :max="86400" />
            </el-form-item>
            <el-form-item label="失败重试次数">
              <el-input-number v-model="taskSetting.retryCount" :min="0" :max="10" />
            </el-form-item>
            <el-form-item label="重试间隔(秒)">
              <el-input-number v-model="taskSetting.retryInterval" :min="1" :max="3600" />
            </el-form-item>
            <el-form-item label="自动清理日志(天)">
              <el-input-number v-model="taskSetting.logRetention" :min="1" :max="365" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSave">保存</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="通知设置" name="notify">
        <div class="page-card">
          <el-form :model="notifySetting" label-width="180px" style="max-width:600px">
            <el-form-item label="邮件通知">
              <el-switch v-model="notifySetting.emailEnabled" />
            </el-form-item>
            <el-form-item label="SMTP服务器">
              <el-input v-model="notifySetting.smtpServer" placeholder="如 smtp.exmail.qq.com" />
            </el-form-item>
            <el-form-item label="发件人邮箱">
              <el-input v-model="notifySetting.emailFrom" placeholder="发件人邮箱地址" />
            </el-form-item>
            <el-form-item label="企业微信通知">
              <el-switch v-model="notifySetting.wechatEnabled" />
            </el-form-item>
            <el-form-item label="Webhook地址">
              <el-input v-model="notifySetting.wechatWebhook" placeholder="企业微信机器人Webhook" />
            </el-form-item>
            <el-form-item label="通知触发条件">
              <el-checkbox-group v-model="notifySetting.events">
                <el-checkbox value="task_success">任务成功</el-checkbox>
                <el-checkbox value="task_failed">任务失败</el-checkbox>
                <el-checkbox value="robot_offline">机器人离线</el-checkbox>
                <el-checkbox value="system_error">系统异常</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSave">保存</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="安全设置" name="security">
        <div class="page-card">
          <el-form :model="securitySetting" label-width="180px" style="max-width:600px">
            <el-form-item label="密码最小长度">
              <el-input-number v-model="securitySetting.pwdMinLen" :min="6" :max="32" />
            </el-form-item>
            <el-form-item label="密码复杂度">
              <el-checkbox-group v-model="securitySetting.pwdRules">
                <el-checkbox value="upper">包含大写字母</el-checkbox>
                <el-checkbox value="lower">包含小写字母</el-checkbox>
                <el-checkbox value="number">包含数字</el-checkbox>
                <el-checkbox value="special">包含特殊字符</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="登录失效时间(分钟)">
              <el-input-number v-model="securitySetting.sessionTimeout" :min="10" :max="1440" />
            </el-form-item>
            <el-form-item label="最大登录失败次数">
              <el-input-number v-model="securitySetting.maxLoginFail" :min="3" :max="10" />
            </el-form-item>
            <el-form-item label="账号锁定时间(分钟)">
              <el-input-number v-model="securitySetting.lockDuration" :min="5" :max="60" />
            </el-form-item>
            <el-form-item label="是否开启验证码">
              <el-switch v-model="securitySetting.captcha" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSave">保存</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const activeTab = ref('basic')

const settingForm = reactive({
  systemName: 'RPA 管理平台',
  logo: '',
  description: '企业级机器人流程自动化管理系统',
  copyright: 'Copyright © 2026 RPA管理平台. All Rights Reserved.',
  icp: '京ICP备2026000001号',
})

const taskSetting = reactive({
  maxConcurrency: 20,
  timeout: 3600,
  retryCount: 3,
  retryInterval: 60,
  logRetention: 30,
})

const notifySetting = reactive({
  emailEnabled: true,
  smtpServer: 'smtp.exmail.qq.com',
  emailFrom: 'noreply@rpa.com',
  wechatEnabled: false,
  wechatWebhook: '',
  events: ['task_failed', 'robot_offline', 'system_error'],
})

const securitySetting = reactive({
  pwdMinLen: 8,
  pwdRules: ['upper', 'lower', 'number'],
  sessionTimeout: 120,
  maxLoginFail: 5,
  lockDuration: 30,
  captcha: true,
})

const handleSave = () => {
  ElMessage.success('设置保存成功')
}
</script>

<style lang="scss" scoped>
.setting-tabs {
  :deep(.el-tabs__header) {
    background: #fff;
    padding: 0 20px;
    margin: 0;
  }

  :deep(.el-tabs__content) {
    padding: 0;
  }
}
</style>
