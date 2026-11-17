<template>
  <div class="not-found">
    <div class="content">
      <h1 class="code">404</h1>
      <p class="desc">抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;

  .content {
    text-align: center;

    .code {
      font-size: 120px;
      font-weight: 700;
      color: #1a73e8;
      margin-bottom: 16px;
    }

    .desc {
      font-size: 18px;
      color: #606266;
      margin-bottom: 24px;
    }
  }
}
</style>
