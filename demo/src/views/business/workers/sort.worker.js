// 大数据排序 Worker：在后台线程中生成并排序海量随机数组
// 用于演示大数据处理场景，避免排序过程卡死主线程
self.onmessage = (e) => {
  const { count } = e.data
  const t0 = performance.now()
  const arr = new Array(count)
  for (let i = 0; i < count; i++) {
    arr[i] = Math.random()
  }
  arr.sort((a, b) => a - b)
  const time = performance.now() - t0
  self.postMessage({
    time,
    head: arr.slice(0, 10),
    tail: arr.slice(-10),
  })
}
