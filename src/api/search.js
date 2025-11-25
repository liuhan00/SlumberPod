import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.150:3003'

function buildHeaders(){
  const auth = getAuthLocal()
  const t = auth?.token || auth?.access_token || null
  const headers = { 'Content-Type': 'application/json' }
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

// Unified search for audios and posts: GET /api/search?q=&page=&limit=&type=audio|post (type optional)
export async function searchAll({ q, page = 1, limit = 20, type = null } = {}){
  if(!q || !String(q).trim()) throw new Error('搜索关键词不能为空')
  // WeChat 小程序无 URLSearchParams，这里手动构建查询字符串
  const queryObj = { q: String(q).trim(), page, limit, type }
  const qs = Object.keys(queryObj)
    .filter(k => queryObj[k] !== undefined && queryObj[k] !== null && queryObj[k] !== '')
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String(queryObj[k]))}`)
    .join('&')
  const url = BASE + '/api/search' + (qs ? ('?' + qs) : '')
  console.log('[search] GET', url)

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'GET', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) throw new Error(j?.message || j?.error || 'search failed')
    return j ?? []
  }

  return await new Promise((resolve, reject)=>{
    try{
      uni.request({ url, method:'GET', header: buildHeaders(), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
    }catch(e){ reject(e) }
  })
}
