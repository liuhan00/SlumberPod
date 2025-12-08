import { getAuthLocal } from '@/store/auth'

const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.162:3003'

function buildHeaders() {
  const auth = getAuthLocal()
  const token = auth?.token || auth?.access_token || null
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

// 统一的请求函数，兼容小程序环境
async function httpFetch(url, options = {}) {
  console.log('[studyHistory API] 请求URL:', url, '选项:', options)
  
  // 如果 fetch 可用则使用 fetch，否则使用 uni.request
  if (typeof fetch === 'function') {
    console.log('[studyHistory API] 使用 fetch 发送请求')
    try {
      const res = await fetch(url, options)
      console.log('[studyHistory API] fetch 响应:', res)
      return res
    } catch (error) {
      console.error('[studyHistory API] fetch 请求失败:', error)
      throw new Error(`网络请求失败: ${error.message || '未知错误'}`)
    }
  }
  
  // 小程序环境使用 uni.request
  console.log('[studyHistory API] 使用 uni.request 发送请求')
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method || 'GET',
      header: options.headers || {},
      data: options.body ? JSON.parse(options.body) : undefined,
      success: (res) => {
        console.log('[studyHistory API] uni.request 成功响应:', res)
        // 模拟 fetch 的响应格式
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: async () => {
            console.log('[studyHistory API] 解析响应数据:', res.data)
            return res.data
          }
        })
      },
      fail: (err) => {
        console.error('[studyHistory API] uni.request 失败:', err)
        const errorMsg = err.errMsg || err.message || '网络请求失败'
        reject(new Error(errorMsg))
      }
    })
  })
}

// 获取学习历史记录
export async function getStudyHistory({ page = 1, limit = 20 } = {}) {
  const url = `${BASE}/api/study-room/history?page=${page}&limit=${limit}`
  console.log('[studyHistory API] 获取学习历史请求:', url)
  
  try {
    const res = await httpFetch(url, { 
      method: 'GET', 
      headers: buildHeaders() 
    })
    
    const j = await res.json()
    console.log('[studyHistory API] 获取学习历史响应:', j)
    
    if (!res.ok) {
      const errorMsg = j.message || j.error || '获取学习历史失败'
      console.error('[studyHistory API] 获取学习历史失败，状态码:', res.status, '错误信息:', errorMsg)
      throw new Error(errorMsg)
    }
    
    // 返回数据，兼容不同的数据结构
    return j.data || j.items || j.list || j || []
  } catch (error) {
    console.error('[studyHistory API] 获取学习历史异常:', error)
    throw error
  }
}