/**
 * 解析分页参数
 * @param {object} query - req.query
 * @returns {{ page:number, pageSize:number, offset:number, limit:number }}
 */
export function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let pageSize = parseInt(query.pageSize, 10);
  if (!page || page < 1) page = 1;
  if (!pageSize || pageSize < 1) pageSize = 10;
  if (pageSize > 200) pageSize = 200;
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}
