const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.150:3003'

// 简单 http helper compatible with uni.request
async function http(path, { method = 'GET', body, headers = {} } = {}){
  const url = BASE + path
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      header: Object.assign({ 'Content-Type': 'application/json' }, headers),
      data: body,
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
  // #endif

  // #ifndef MP-WEIXIN
  return fetch(url, { method, headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: body ? JSON.stringify(body) : undefined })
  // #endif
}

export async function sendMail({ content, token }){
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await http('/api/mailbox/deliver', { method: 'POST', body: { content }, headers })
  // uni.request 返回对象 { statusCode, data }
  if(res.statusCode && res.statusCode >= 200 && res.statusCode < 300) return res.data
  // fetch 返回 Response
  if(res.ok) return await res.json()
  
  // 处理错误响应
  let errorMessage = 'sendMail failed'
  try {
    if(res.statusCode === 400) {
      const errorData = res.data || await res.json?.()
      errorMessage = errorData?.message || errorData?.error || '请求数据格式错误'
    } else if(res.statusCode === 401) {
      errorMessage = '未授权，请重新登录'
    } else if(res.statusCode === 403) {
      errorMessage = '无权限执行此操作'
    } else if(res.statusCode === 404) {
      errorMessage = '接口不存在'
    } else if(res.statusCode >= 500) {
      errorMessage = '服务器错误，请稍后重试'
    }
  } catch(e) {
    console.warn('解析错误响应失败:', e)
  }
  
  throw new Error(errorMessage)
}

export async function pickMail({ token }){
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await http('/api/mailbox/pick', { method: 'POST', headers })
  if(res.statusCode && res.statusCode >= 200 && res.statusCode < 300) return res.data
  if(res.ok) return await res.json()
  throw new Error('pickMail failed')
}

export async function getMyMails({ token, type = 'received', page = 1, limit = 20 }){
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const q = `?type=${encodeURIComponent(type)}&page=${page}&limit=${limit}`
  const res = await http('/api/mailbox/my' + q, { method: 'GET', headers })
  if(res.statusCode && res.statusCode >= 200 && res.statusCode < 300) return res.data
  if(res.ok) return await res.json()
  throw new Error('getMyMails failed')
}
