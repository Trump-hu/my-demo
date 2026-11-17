// 通用Mock数据生成工具

// 随机整数
export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// 随机选择
export const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// 格式化日期时间
export const formatDateTime = (date) => {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 模拟分页延迟
export const mockDelay = (data, delay = 300) =>
  new Promise((resolve) => {
    setTimeout(() => resolve({ code: 200, ...data }), delay)
  })

// 分页处理
export const paginate = (list, page = 1, pageSize = 10) => {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return {
    list: list.slice(start, end),
    total: list.length,
    page,
    pageSize,
  }
}
