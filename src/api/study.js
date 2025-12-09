import { getAuthLocal } from '@/store/auth'

const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.128:3003'

function buildHeaders() {
  const auth = getAuthLocal()
  const token = auth?.token || auth?.access_token || null
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

// 统一的请求函数，兼容小程序环境
async function httpFetch(url, options = {}) {
  console.log('[study API] 请求URL:', url, '选项:', options)
  
  // 如果 fetch 可用则使用 fetch，否则使用 uni.request
  if (typeof fetch === 'function') {
    console.log('[study API] 使用 fetch 发送请求')
    try {
      const res = await fetch(url, options)
      console.log('[study API] fetch 响应:', res)
      return res
    } catch (error) {
      console.error('[study API] fetch 请求失败:', error)
      throw new Error(`网络请求失败: ${error.message || '未知错误'}`)
    }
  }
  
  // 小程序环境使用 uni.request
  console.log('[study API] 使用 uni.request 发送请求')
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method || 'GET',
      header: options.headers || {},
      data: options.body ? JSON.parse(options.body) : undefined,
      success: (res) => {
        console.log('[study API] uni.request 成功响应:', res)
        // 模拟 fetch 的响应格式
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: async () => {
            console.log('[study API] 解析响应数据:', res.data)
            return res.data
          }
        })
      },
      fail: (err) => {
        console.error('[study API] uni.request 失败:', err)
        const errorMsg = err.errMsg || err.message || '网络请求失败'
        reject(new Error(errorMsg))
      }
    })
  })
}

// 开始/恢复计时
export async function startStudySession() {
  const url = `${BASE}/api/study-room/sessions/start`
  console.log('[study API] 开始/恢复计时请求:', url)
  const res = await httpFetch(url, { 
    method: 'POST', 
    headers: buildHeaders() 
  })
  const j = await res.json()
  console.log('[study API] 开始/恢复计时响应:', j)
  if (!res.ok) {
    const errorMsg = j.message || j.error || '开始学习计时失败'
    console.error('[study API] 开始学习计时失败，状态码:', res.status, '错误信息:', errorMsg)
    throw new Error(errorMsg)
  }
  return j.data || j
}

// 暂停计时
export async function pauseStudySession(sessionId) {
  const url = `${BASE}/api/study-room/sessions/${sessionId}/pause`
  console.log('[study API] 暂停计时请求:', url)
  const res = await httpFetch(url, { 
    method: 'POST', 
    headers: buildHeaders() 
  })
  const j = await res.json()
  console.log('[study API] 暂停计时响应:', j)
  if (!res.ok) {
    const errorMsg = j.message || j.error || '暂停学习计时失败'
    console.error('[study API] 暂停学习计时失败，状态码:', res.status, '错误信息:', errorMsg)
    throw new Error(errorMsg)
  }
  return j.data || j
}

// 结束计时
export async function endStudySession(sessionId) {
  const url = `${BASE}/api/study-room/sessions/${sessionId}/end`
  console.log('[study API] 结束计时请求:', url)
  const res = await httpFetch(url, { 
    method: 'POST', 
    headers: buildHeaders() 
  })
  const j = await res.json()
  console.log('[study API] 结束计时响应:', j)
  if (!res.ok) {
    const errorMsg = j.message || j.error || '结束学习计时失败'
    console.error('[study API] 结束学习计时失败，状态码:', res.status, '错误信息:', errorMsg)
    throw new Error(errorMsg)
  }
  return j.data || j
}

// 获取学习统计
export async function getStudyStats() {
  const url = `${BASE}/api/study-room/stats`
  console.log('[study API] 获取学习统计请求:', url)
  const res = await httpFetch(url, { 
    method: 'GET', 
    headers: buildHeaders() 
  })
  const j = await res.json()
  console.log('[study API] 获取学习统计响应:', j)
  if (!res.ok) {
    const errorMsg = j.message || j.error || '获取学习统计失败'
    console.error('[study API] 获取学习统计失败，状态码:', res.status, '错误信息:', errorMsg)
    throw new Error(errorMsg)
  }
  return j.data || j
}