// 后台轮询 Worker：在后台线程中按固定间隔定时“拉取”数据
// 用于演示后台定时任务 / 长连接心跳场景，主线程可自由操作
let timer = null
let tick = 0

self.onmessage = (e) => {
  const { cmd, interval = 1000 } = e.data

  if (cmd === 'start') {
    if (timer) clearInterval(timer)
    tick = 0
    timer = setInterval(() => {
      tick++
      // 模拟后端返回的实时指标
      self.postMessage({
        tick,
        cpu: +(Math.random() * 100).toFixed(2),
        qps: Math.floor(Math.random() * 1000) + 100,
        time: Date.now(),
      })
    }, interval)
  } else if (cmd === 'stop') {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    self.postMessage({ stopped: true })
  }
}
