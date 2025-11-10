import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.43.89:3003'

function buildHeaders(token){
  const headers = { 'Content-Type': 'application/json' }
  const t = token || getAuthLocal()?.token || getAuthLocal()?.access_token || null
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

export async function createPost({ userId, title='', content='', imageUrls = [] }, token){
  const headers = buildHeaders(token)
  const res = await fetch(BASE + '/api/posts', {
    method: 'POST', headers, body: JSON.stringify({ userId, title, content, imageUrls })
  })
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || j.error || 'create post failed')
  return j
}

export async function getPosts({ page = 1, limit = 10 } = {}){
  // URL constructor is not available in some mini program runtimes; build query string manually
  const url = BASE + '/api/posts?page=' + encodeURIComponent(page) + '&limit=' + encodeURIComponent(limit)
  const res = await fetch(url, { method: 'GET', headers: buildHeaders() })
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || j.error || 'fetch posts failed')
  return j
}

// 获取最新帖子列表：/api/lastest
export async function getLatest(){
  const url = BASE + '/api/lastest'
  const res = await fetch(url, { method:'GET', headers: buildHeaders() })
  let j = null
  try{ j = await res.json() }catch(e){ j = res }
  if(!res.ok) throw new Error(j?.message || j?.error || 'fetch latest posts failed')
  return j
}

// 获取热门帖子列表：/api/hot
export async function getHot(){
  const url = BASE + '/api/hot'
  const res = await fetch(url, { method:'GET', headers: buildHeaders() })
  let j = null
  try{ j = await res.json() }catch(e){ j = res }
  if(!res.ok) throw new Error(j?.message || j?.error || 'fetch hot posts failed')
  return j
}
