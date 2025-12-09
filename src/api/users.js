import { getAuthLocal, getAuthToken, validateJwtToken } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.128:3003'

function buildHeaders(){
  const auth = getAuthLocal()
  const t = auth?.token || auth?.access_token || null
  const headers = { 'Content-Type': 'application/json' }
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

// 上传用户头像
export async function uploadAvatar(file) {
  console.log('[API] uploadAvatar called with file:', file)
  const auth = getAuthLocal()
  console.log('[API] Auth info:', auth)
  
  // 使用改进后的 getAuthToken 函数获取 token
  const authToken = getAuthToken()
  const token = authToken?.access_token || null
  
  console.log('[API] Token:', token)
  console.log('[API] AuthToken:', authToken)
  
  // 验证token格式
  if (token) {
    const isValid = validateJwtToken(token)
    console.log('[API] Token validation result:', isValid)
    if (!isValid) {
      console.warn('[API] Token format is invalid')
    }
  }
  
  if (!token) {
    const error = new Error('未登录，无法上传头像')
    console.error('[API] Auth error:', error)
    throw error
  }
  
  const url = `${BASE}/api/users/avatar/upload`
  console.log('[API] Upload URL:', url)
  
  // 兼容小程序环境 - 使用uni.request
  if (typeof uni !== 'undefined') {
    console.log('[API] Using uni.request for file upload')
    return new Promise((resolve, reject) => {
      // 获取文件路径
      let filePath = file
      if (typeof file === 'object' && file.path) {
        filePath = file.path
      } else if (typeof file === 'object' && file.uri) {
        filePath = file.uri
      }
      console.log('[API] File path:', filePath)
      
      // 构建请求头
      const header = {}
      if (token) {
        header.Authorization = `Bearer ${token}`
      }
      
      // 添加更多调试信息
      console.log('[API] Final header for uni.request:', header)
      
      // 添加请求前的调试信息
      console.log('[API] About to send request with:')
      console.log('[API]   URL:', url)
      console.log('[API]   FilePath:', filePath)
      console.log('[API]   Header:', header)
      
      // 使用uni.uploadFile上传文件（这是小程序中上传文件的正确方式）
      uni.uploadFile({
        url,
        filePath,
        name: 'avatar',
        header,
        success: (res) => {
          console.log('[API] Upload success:', res)
          console.log('[API] Response headers:', res.header)
          console.log('[API] Response data:', res.data)
          
          // 尝试解析响应数据
          let responseData = null
          try {
            responseData = JSON.parse(res.data)
            console.log('[API] Parsed response data:', responseData)
          } catch (parseError) {
            console.log('[API] Failed to parse response data:', parseError)
            responseData = res.data
          }
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData)
          } else {
            // 特殊处理401错误，提供更多有用信息
            if (res.statusCode === 401) {
              console.error('[API] 401 Unauthorized - Token might be invalid or expired')
              console.error('[API] Token used:', token.substring(0, 20) + '...')
              console.error('[API] Server response:', responseData)
            }
            
            const error = new Error(`上传失败: ${res.statusCode}`)
            console.error('[API] Upload error:', error)
            reject(error)
          }
        },
        fail: (err) => {
          console.error('[API] Upload fail:', err)
          reject(new Error(`上传失败: ${err.errMsg || err.message || JSON.stringify(err)}`))
        }
      })
    })
  }
  
  // Web 环境使用 fetch 和 FormData
  console.log('[API] Using fetch with FormData')
  // 创建 FormData 对象
  const formData = new FormData()
  formData.append('avatar', file)
  
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(), // 使用标准的buildHeaders函数
    body: formData
  })
  
  console.log('[API] Fetch response:', res)
  const result = await res.json()
  console.log('[API] Fetch result:', result)
  
  if (!res.ok) {
    const error = new Error(result.message || '上传头像失败')
    console.error('[API] Fetch error:', error)
    throw error
  }
  
  return result
}

export async function getPlayHistory(userId){
  const url = `${BASE}/api/users/${userId}/play-history`
  
  // 使用 fetch (Web环境)
  if (typeof fetch === 'function'){
    const res = await fetch(url, { method: 'GET', headers: buildHeaders() })
    
    // 处理304状态码 - 表示内容未修改，返回空数组
    if(res.status === 304) return []
    if(res.status === 404) return []
    
    const j = await res.json()
    if(!res.ok) throw new Error(j.message || 'fetch play history failed')
    return j.data || j || []
  }
  
  // uni-app fallback (小程序环境)
  return await new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      header: buildHeaders(),
      success(r){
        const ok = r.statusCode >= 200 && r.statusCode < 300
        if(r.statusCode === 304 || r.statusCode === 404){
          resolve([])
          return
        }
        if(!ok){
          const msg = r.data?.message || r.data?.error || `fetch play history failed: ${r.statusCode}`
          reject(new Error(msg))
          return
        }
        resolve(r.data?.data || r.data || [])
      },
      fail(err){ reject(err) }
    })
  })
}

export async function getFavorites(userId){
  const url = `${BASE}/api/users/${userId}/favorites`
  const res = await fetch(url, { method: 'GET', headers: buildHeaders() })
  if(res.status === 304) return []
  if(res.status === 404) return []
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || 'fetch favorites failed')
  return j.data || j || []
}

export async function addFavorite(userId, payload){
  const url = `${BASE}/api/users/${userId}/favorites`
  const res = await fetch(url, { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) })
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || 'add favorite failed')
  return j.data || j || {}
}

export async function removeFavorite(userId, favoriteId){
  const url = `${BASE}/api/users/${userId}/favorites/${favoriteId}`
  const res = await fetch(url, { method: 'DELETE', headers: buildHeaders() })
  if(res.status === 404) return null
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || 'remove favorite failed')
  return j.data || j || null
}

// 更新用户资料
export async function updateProfile(profileData) {
  const url = `${BASE}/api/users/profile`
  const headers = buildHeaders()
  
  // 兼容小程序环境
  if (typeof uni !== 'undefined' && uni.request) {
    return new Promise((resolve, reject) => {
      uni.request({
        url,
        method: 'PUT',
        header: headers,
        data: profileData,
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            const errorMsg = res.data?.message || res.data?.error || `更新资料失败: ${res.statusCode}`
            reject(new Error(errorMsg))
          }
        },
        fail(err) {
          reject(new Error(`网络请求失败: ${err.errMsg || err.message || JSON.stringify(err)}`))
        }
      })
    })
  }
  
  // Web环境使用fetch
  const res = await fetch(url, { 
    method: 'PUT', 
    headers, 
    body: JSON.stringify(profileData) 
  })
  
  const j = await res.json()
  if (!res.ok) throw new Error(j.message || j.error || '更新资料失败')
  return j
}

// 获取用户资料
export async function getProfile() {
  const url = `${BASE}/api/users/profile`
  const headers = buildHeaders()
  
  // 兼容小程序环境
  if (typeof uni !== 'undefined' && uni.request) {
    return new Promise((resolve, reject) => {
      uni.request({
        url,
        method: 'GET',
        header: headers,
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            const errorMsg = res.data?.message || res.data?.error || `获取资料失败: ${res.statusCode}`
            reject(new Error(errorMsg))
          }
        },
        fail(err) {
          reject(new Error(`网络请求失败: ${err.errMsg || err.message || JSON.stringify(err)}`))
        }
      })
    })
  }
  
  // Web环境使用fetch
  const res = await fetch(url, { method: 'GET', headers })
  
  const j = await res.json()
  if (!res.ok) throw new Error(j.message || j.error || '获取资料失败')
  return j
}
