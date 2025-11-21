import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env?.VITE_API_BASE || 'http://192.168.1.139:3003'

function buildHeaders(){
  const auth = getAuthLocal()
  const token = auth?.token || auth?.access_token || null
  const headers = { 'Content-Type': 'application/json' }
  if(token) headers.Authorization = `Bearer ${token}`
  return headers
}

function request({ url, method = 'GET', data }) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      data,
      header: buildHeaders(),
      success: (res) => {
        const status = res.statusCode
        const body = res.data
        if (status >= 200 && status < 300) {
          resolve({ status, data: body })
        } else {
          reject(body || { message: `HTTP ${status}` })
        }
      },
      fail: (err) => reject(err || { message: 'network error' })
    })
  })
}

export async function listFavorites({ offset = 0, limit = 200 } = {}){
  const url = `${BASE}/api/favorites?offset=${encodeURIComponent(offset)}&limit=${encodeURIComponent(limit)}`
  try{
    const res = await request({ url, method: 'GET' })
    const j = res?.data
    // 后端返回 { items, total }
    if (Array.isArray(j?.items)) return j.items
    // 兼容返回数组或 { data: [] }
    if (Array.isArray(j?.data)) return j.data
    if (Array.isArray(j)) return j
    return []
  }catch(e){
    if(e?.status === 404) return []
    throw new Error(e?.message || 'fetch favorites failed')
  }
}

export async function addFavorite(payload){
  const url = `${BASE}/api/favorites`
  const res = await request({ url, method: 'POST', data: payload })
  const j = res?.data
  return j?.data || j || {}
}

export async function removeFavorite(audioId){
  const url = `${BASE}/api/favorites/${audioId}`
  try{
    const res = await request({ url, method: 'DELETE' })
    const j = res?.data
    // 期望 { favorited: false }
    return j?.favorited === false ? j : (j?.data || j || null)
  }catch(e){
    if(e?.status === 404) return null
    throw new Error(e?.message || 'remove favorite failed')
  }
}

// 按收藏记录ID删除（部分后端实现要求用记录ID而不是音频ID）
export async function removeFavoriteByRecordId(recordId){
  const url = `${BASE}/api/favorites/${recordId}`
  try{
    const res = await request({ url, method: 'DELETE' })
    const j = res?.data
    return j?.favorited === false ? j : (j?.data || j || null)
  }catch(e){
    if(e?.status === 404) return null
    throw new Error(e?.message || 'remove favorite by id failed')
  }
}

export async function checkFavorite(audioId){
  const url = `${BASE}/api/favorites/${audioId}`
  try{
    const res = await request({ url, method: 'GET' })
    const j = res?.data
    // 期望 { favorited: boolean }
    if (typeof j?.favorited === 'boolean') return { favorited: j.favorited }
    // 兼容历史 { exists: boolean }
    if (typeof j?.exists === 'boolean') return { favorited: j.exists }
    return { favorited: false }
  }catch(e){
    if(e?.status === 404) return { favorited: false }
    throw new Error(e?.message || 'check favorite failed')
  }
}


