// 统一响应格式：{ code, message, data }
// code === 200 表示成功，前端 request.js 拦截器据此判断

export function success(res, data = null, message = 'success', statusCode = 200) {
  return res.status(statusCode).json({
    code: 200,
    message,
    data,
  });
}

export function fail(res, message = 'error', statusCode = 400, code = 400, extra = {}) {
  return res.status(statusCode).json({
    code,
    message,
    data: null,
    ...extra,
  });
}

// 分页响应：data 内包含 { list, total, page, pageSize }
export function paginate(res, { list, total, page, pageSize }) {
  return res.status(200).json({
    code: 200,
    message: 'success',
    data: {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  });
}
