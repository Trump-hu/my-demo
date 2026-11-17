// 大文件 Hash Worker：采用"抽样指纹"方式计算文件特征值
// 只读取文件头部、中部、尾部各一小段字节参与计算，避免对超大文件做全量读取导致卡顿
// 这种抽样指纹常用于"秒传"场景的快速比对
const VIRTUAL_SLICE_LIMIT = 1024 * 1024

// 与主线程 VirtualFile.slice 保持一致：按文件内偏移生成确定性的虚拟内容
const virtualSlice = (size, start, end) => {
  const from = Math.max(0, Math.min(start, size))
  const to = Math.max(from, Math.min(end, size))
  const len = Math.min(to - from, VIRTUAL_SLICE_LIMIT)
  const buf = new Uint8Array(len)
  for (let i = 0; i < len; i++) buf[i] = (from + i) % 251
  return buf
}

self.onmessage = async (e) => {
  const { file, virtual, samplePositions, sampleSize } = e.data
  try {
    const enc = (s) => new TextEncoder().encode(s)
    // 文件元信息参与计算，保证不同文件即便抽样字节相同也能区分
    const info = file || virtual
    if (!info) throw new Error('缺少文件数据')
    const meta = enc(`${info.name}|${info.size}|${info.lastModified}`)
    const parts = [meta]

    for (const pos of samplePositions) {
      if (pos >= info.size) continue
      const end = Math.min(pos + sampleSize, info.size)
      if (file) {
        const buf = await file.slice(pos, end).arrayBuffer()
        parts.push(new Uint8Array(buf))
      } else {
        // 虚拟大文件：Worker 侧按元信息直接生成采样内容，无需传输数据
        parts.push(virtualSlice(info.size, pos, end))
      }
    }

    // 合并所有片段
    const totalLen = parts.reduce((s, p) => s + p.length, 0)
    const combined = new Uint8Array(totalLen)
    let off = 0
    for (const p of parts) {
      combined.set(p, off)
      off += p.length
    }

    const digest = await crypto.subtle.digest('SHA-256', combined)
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    self.postMessage({ hash })
  } catch (err) {
    self.postMessage({ error: err && err.message ? err.message : String(err) })
  }
}
