import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.151:3003'

function buildHeaders(){
  const auth = getAuthLocal()
  const t = auth?.token || auth?.access_token || null
  const headers = { 'Content-Type': 'application/json' }
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

export async function getPlayHistory(userId){
  const url = `${BASE}/api/users/${userId}/play-history`
  const res = await fetch(url, { method: 'GET', headers: buildHeaders() })
  
  // 处理304状态码 - 表示内容未修改，返回空数组
  if(res.status === 304) return []
  if(res.status === 404) return []
  
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || 'fetch play history failed')
  return j.data || j || []
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
