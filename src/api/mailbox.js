const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.123:3003'

// 简单 http helper compatible with uni.request
async function http(path, { method = 'GET', body, headers = {} } = {}){
  const url = BASE + path
  console.log(`[Mailbox API] ${method} ${url}`, { headers: Object.keys(headers), hasBody: !!body })
  
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      header: Object.assign({ 'Content-Type': 'application/json' }, headers),
      data: body,
      success: (res) => {
        console.log(`[Mailbox API] ${method} ${url} -> ${res.statusCode}`, res.data)
        resolve(res)
      },
      fail: (err) => {
        console.error(`[Mailbox API] ${method} ${url} -> FAIL`, err)
        reject(err)
      }
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

// 系统自动分配信件
export async function dailyAssignment({ token }){
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await http('/api/mailbox/daily-assignment', { method: 'POST', headers })
  if(res.statusCode && res.statusCode >= 200 && res.statusCode < 300) return res.data
  if(res.ok) return await res.json()
  
  // 处理错误响应
  let errorMessage = 'dailyAssignment failed'
  try {
    if(res.statusCode === 400) {
      const errorData = res.data || await res.json?.()
      errorMessage = errorData?.message || errorData?.error || '今日已领取过系统信件'
    } else if(res.statusCode === 401) {
      errorMessage = '未授权，请重新登录'
    } else if(res.statusCode === 403) {
      errorMessage = '无权限执行此操作'
    } else if(res.statusCode === 404) {
      errorMessage = '系统信件接口不存在'
    } else if(res.statusCode >= 500) {
      errorMessage = '服务器错误，请稍后重试'
    }
  } catch(e) {
    console.warn('解析系统信件错误响应失败:', e)
  }
  
  throw new Error(errorMessage)
}

// 获取信箱统计信息
export async function getMailboxStats({ token }){
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  
  try {
    console.log('[Mailbox] 尝试获取统计信息: /api/mailbox/stats')
    const res = await http('/api/mailbox/stats', { method: 'GET', headers })
    
    if(isSuccessfulMailboxResponse(res)){
      const payload = await extractMailboxPayload(res)
      console.log('[Mailbox] getMailboxStats success:', payload)
      return payload?.data || payload || {}
    }
    
    throw await buildMailboxError(res)
  } catch (error) {
    console.error('[Mailbox] getMailboxStats error:', error)
    // 这个接口失败不影响主要功能，返回默认统计信息
    return { unreadCount: 0, totalCount: 0 }
  }
}

// 获取接收的晚安列表
export async function getReceivedMessages({ token }){
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  
  try {
    console.log('[Mailbox] 获取接收的晚安列表: /api/mailbox/received')
    const res = await http('/api/mailbox/received', { method: 'GET', headers })
    
    if(isSuccessfulMailboxResponse(res)){
      const payload = await extractMailboxPayload(res)
      console.log('[Mailbox] getReceivedMessages success:', payload)
      return payload?.data || payload || []
    }
    
    throw await buildMailboxError(res)
  } catch (error) {
    console.error('[Mailbox] getReceivedMessages error:', error)
    throw error
  }
}

// 获取信件详情
export async function getMessageDetail({ token, threadId }){
  if (!threadId) {
    console.error('[Mailbox] getMessageDetail: threadId 为空')
    throw new Error('信件ID不能为空')
  }
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  
  try {
    console.log('[Mailbox] 获取信件详情:', threadId)
    const res = await http(`/api/mailbox/${threadId}`, { method: 'GET', headers })
    
    if(isSuccessfulMailboxResponse(res)){
      const payload = await extractMailboxPayload(res)
      console.log('[Mailbox] getMessageDetail success:', payload)
      return payload?.data || payload
    }
    
    throw await buildMailboxError(res)
  } catch (error) {
    console.error('[Mailbox] getMessageDetail error:', error)
    throw error
  }
}

// 标记信件为已读
export async function markMessageAsRead({ token, threadId }){
  if (!threadId) {
    console.error('[Mailbox] markMessageAsRead: threadId 为空')
    throw new Error('信件ID不能为空')
  }
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  
  try {
    console.log('[Mailbox] 标记信件已读:', threadId)
    const res = await http(`/api/mailbox/${threadId}/accept`, { method: 'POST', headers })
    
    if(isSuccessfulMailboxResponse(res)){
      const payload = await extractMailboxPayload(res)
      console.log('[Mailbox] markMessageAsRead success:', payload)
      return payload?.data || payload
    }
    
    throw await buildMailboxError(res)
  } catch (error) {
    console.error('[Mailbox] markMessageAsRead error:', error)
    throw error
  }
}

// 获取用户的所有信件列表
export async function getAllMails({ token, page = 1, limit = 20 }){
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.max(1, Number(limit) || 20)
  
  // 后端只支持以下接口
  const possibleUrls = [
    '/api/mailbox/mybox',  // 我的信箱
    '/api/mailbox/received',  // 接收的晚安
  ]
  
  let lastError = null
  
  for (const url of possibleUrls) {
    try {
      console.log('[Mailbox] 尝试获取所有信件接口:', url)
      const res = await http(url, { method: 'GET', headers })
      
      if(isSuccessfulMailboxResponse(res)){
        const payload = await extractMailboxPayload(res)
        console.log('[Mailbox] getAllMails success:', url, payload)
        return payload?.data || payload || []
      }
      
      lastError = res
      console.log('[Mailbox] 接口无效，尝试下一个:', url)
    } catch (error) {
      lastError = error
      console.log('[Mailbox] 接口调用失败，尝试下一个:', url, error.message)
    }
  }

  // 如果所有接口都失败
  console.error('[Mailbox] 所有接口失败')
  throw await buildMailboxError(lastError)
}

// 获取我的信箱快捷信息
export async function getMyMailboxInfo({ token }){
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  
  try {
    console.log('[Mailbox] 尝试获取信箱快捷信息: /api/mailbox/my-mailbox')
    const res = await http('/api/mailbox/my-mailbox', { method: 'GET', headers })
    
    if(isSuccessfulMailboxResponse(res)){
      const payload = await extractMailboxPayload(res)
      console.log('[Mailbox] getMyMailboxInfo success:', payload)
      return payload?.data || payload
    }
    
    throw await buildMailboxError(res)
  } catch (error) {
    console.error('[Mailbox] getMyMailboxInfo error:', error)
    // 这个接口失败不影响主要功能，返回空对象
    return {}
  }
}

// 获取我的信箱（调用 /api/mailbox/mybox）
// 注意：这个函数已不再使用，改用 getMyMails({ type: 'mybox' }) 来自动尝试多个接口路径
export async function getMyBox({ token, page = 1, limit = 20 }){
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  
  try {
    console.log('[Mailbox] 获取我的信箱: /api/mailbox/mybox')
    const res = await http('/api/mailbox/mybox', { method: 'GET', headers })
    
    if(isSuccessfulMailboxResponse(res)){
      const payload = await extractMailboxPayload(res)
      console.log('[Mailbox] getMyBox success:', payload)
      return payload?.data || payload || []
    }
    
    throw await buildMailboxError(res)
  } catch (error) {
    console.error('[Mailbox] getMyBox error:', error)
    throw error
  }
}

export async function getMyMails({ token, type = 'received', page = 1, limit = 20 }){
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const normalizedType = String(type || 'received').toLowerCase()
  const tab = mapMailboxType(normalizedType)
  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.max(1, Number(limit) || 20)
  const offset = Math.max(0, (safePage - 1) * safeLimit)
  const candidates = buildMailboxEndpoints({ tab, rawType: normalizedType, page: safePage, offset, limit: safeLimit })

  let lastError = null
  for(const path of candidates){
    try{
      const res = await http(path, { method: 'GET', headers })
      if(isSuccessfulMailboxResponse(res)){
        const payload = await extractMailboxPayload(res)
        return payload?.data ?? payload
      }
      lastError = res
    }catch(err){
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }

  throw await buildMailboxError(lastError)
}

function mapMailboxType(type){
  if(!type) return 'receive'
  if(type === 'sent' || type === 'send') return 'send'
  if(type === 'received' || type === 'receive') return 'receive'
  if(type === 'mybox' || type === 'my') return 'mybox'
  return type
}

function buildMailboxEndpoints({ tab, rawType, page, offset, limit }){
  // 手动构建查询字符串，避免使用 URLSearchParams（小程序不支持）
  const endpoints = []

  if(tab === 'mybox'){
    // 我的信箱：使用 /api/mailbox/mybox 接口（不带参数）
    endpoints.push('/api/mailbox/mybox')
  } else if(tab === 'receive' || tab === 'received'){
    // 接收的晚安：使用 received 接口
    endpoints.push('/api/mailbox/received')
  } else if(tab === 'send' || tab === 'sent'){
    // 发送的晚安：后端暂无专门接口，使用 mybox 代替
    console.warn('[Mailbox] 发送的晚安接口暂不支持，使用 mybox 接口')
    endpoints.push('/api/mailbox/mybox')
  } else {
    // 未知类型，尝试 received
    console.warn('[Mailbox] 未知类型:', tab, '，fallback 到 received')
    endpoints.push('/api/mailbox/received')
  }

  return endpoints
}

function isSuccessfulMailboxResponse(res){
  const status = resolveStatusCode(res)
  if(status !== null) return status >= 200 && status < 300
  if(typeof res?.ok === 'boolean') return res.ok
  return false
}

async function extractMailboxPayload(res){
  if(typeof res?.statusCode === 'number') return res.data
  if(typeof res?.json === 'function') return await res.json()
  return res
}

function resolveStatusCode(res){
  if(res && typeof res.statusCode === 'number') return res.statusCode
  if(res && typeof res.status === 'number') return res.status
  return null
}

async function buildMailboxError(res){
  if(res instanceof Error) return res

  let message = 'getMyMails failed'
  const status = resolveStatusCode(res)
  if(status === 401) message = '未授权，请重新登录'
  else if(status === 403) message = '暂无权限访问信箱'
  else if(status === 404) message = '信箱接口未配置'
  else if(typeof status === 'number' && status >= 500) message = '服务器繁忙，请稍后再试'

  try{
    const payload = res?.data ?? (typeof res?.json === 'function' ? await res.json() : null)
    const serverMessage = payload?.message || payload?.error || payload?.msg
    if(serverMessage) {
      message = serverMessage
      // 添加调试信息
      console.error('[Mailbox] 后端返回错误:', {
        status,
        message: serverMessage,
        fullPayload: payload
      })
    }
  }catch(e){
    console.error('[Mailbox] 解析错误响应失败:', e)
  }

  return new Error(message)
}
