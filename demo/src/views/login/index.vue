<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>

    <div class="login-wrapper">
      <div class="login-left">
        <div class="brand">
          <div class="brand-logo">
            <svg viewBox="0 0 32 32" width="48" height="48">
              <rect width="32" height="32" rx="6" fill="#fff" />
              <text x="16" y="22" font-size="18" font-family="Arial" font-weight="bold" fill="#1a73e8" text-anchor="middle">R</text>
            </svg>
          </div>
          <h1 class="brand-title">RPA 管理平台</h1>
          <p class="brand-desc">企业级机器人流程自动化管理系统</p>
        </div>
        <div class="features">
          <div class="feature-item">
            <el-icon :size="24"><Share /></el-icon>
            <span>流程编排</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><Cpu /></el-icon>
            <span>机器人调度</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><Monitor /></el-icon>
            <span>任务监控</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><DataAnalysis /></el-icon>
            <span>运行分析</span>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-box">
          <h2 class="login-title">欢迎登录</h2>
          <p class="login-subtitle">请输入您的账号和密码</p>

          <el-form
            ref="formRef"
            :model="loginForm"
            :rules="rules"
            size="large"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                show-password
                clearable
              />
            </el-form-item>
            <div class="login-options">
              <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
              <el-link type="primary" :underline="false">忘记密码？</el-link>
            </div>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form>

          <div class="login-tip">
            <span>测试账号：admin / admin123</span>
          </div>
        </div>
      </div>
    </div>

    <div class="login-footer">
      Copyright © 2026 RPA管理平台. All Rights Reserved.
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Share, Cpu, Monitor, DataAnalysis } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: 'admin',
  password: 'admin123',
  remember: true,
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.login(loginForm)
      ElMessage.success('登录成功')
      const redirect = router.currentRoute.value.query.redirect || '/'
      router.push(redirect)
    } catch (err) {
      ElMessage.error('登录失败，请检查账号密码')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #01579b 100%);
  display: flex;
  flex-direction: column;
}

.login-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  .bg-shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.08;
    background: #fff;
  }

  .shape-1 {
    width: 600px;
    height: 600px;
    top: -200px;
    right: -100px;
  }

  .shape-2 {
    width: 400px;
    height: 400px;
    bottom: -100px;
    left: -100px;
  }

  .shape-3 {
    width: 300px;
    height: 300px;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

.login-wrapper {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-left {
  flex: 1;
  max-width: 480px;
  color: #fff;
  padding: 40px;

  .brand {
    margin-bottom: 60px;

    .brand-title {
      font-size: 32px;
      font-weight: 700;
      margin: 16px 0 8px;
    }

    .brand-desc {
      font-size: 14px;
      opacity: 0.8;
    }
  }

  .features {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      backdrop-filter: blur(10px);
      font-size: 14px;
      transition: all 0.3s;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
      }
    }
  }
}

.login-right {
  width: 420px;
  padding: 0 20px;
}

.login-box {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  .login-title {
    font-size: 24px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 8px;
  }

  .login-subtitle {
    font-size: 14px;
    color: #909399;
    margin-bottom: 32px;
  }

  .login-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .login-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    letter-spacing: 4px;
  }

  .login-tip {
    margin-top: 24px;
    text-align: center;
    font-size: 12px;
    color: #c0c4cc;
  }
}

.login-footer {
  position: relative;
  z-index: 1;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  padding: 20px;
}

@media (max-width: 768px) {
  .login-left {
    display: none;
  }
  .login-right {
    width: 100%;
    max-width: 400px;
  }
}
</style>
