// 素数计算 Worker：在后台线程中计算 [2, max] 范围内的所有素数
// 用于演示 CPU 密集型任务不阻塞主线程 UI
self.onmessage = (e) => {
  const { max } = e.data
  const t0 = performance.now()
  const primes = []
  for (let n = 2; n <= max; n++) {
    let isPrime = true
    const limit = Math.sqrt(n)
    for (let i = 2; i <= limit; i++) {
      if (n % i === 0) {
        isPrime = false
        break
      }
    }
    if (isPrime) primes.push(n)
  }
  const time = performance.now() - t0
  // 回传：素数个数、耗时、前 20 个素数作为示例
  self.postMessage({
    count: primes.length,
    time,
    sample: primes.slice(0, 20),
  })
}
