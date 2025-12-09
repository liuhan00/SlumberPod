import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.128:3003'

function buildHeaders(){
  const auth = getAuthLocal()
  const t = auth?.token || auth?.access_token || null
  const headers = { 'Content-Type': 'application/json' }
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

// Unified search for audios and posts: GET /api/community/search?q=&page=&limit=&type=audio|post (type optional)
// 注意：已按照要求修改搜索接口路径，不再使用 /api/search
export async function searchAll({ q, page = 1, limit = 20, type = null } = {}){
  if(!q || !String(q).trim()) throw new Error('搜索关键词不能为空')
  // WeChat 小程序无 URLSearchParams，这里手动构建查询字符串
  const queryObj = { q: String(q).trim(), page, limit, type }
  const qs = Object.keys(queryObj)
    .filter(k => queryObj[k] !== undefined && queryObj[k] !== null && queryObj[k] !== '')
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String(queryObj[k]))}`)
    .join('&')
  // 修改搜索路径为社区搜索接口
  const url = BASE + '/api/community/search' + (qs ? ('?' + qs) : '')
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

// 获取热门搜索: GET /api/community/search/hot
// 注意：已按照要求修改热门搜索接口路径，不再使用 /api/search/hot
export async function getHotSearch(){
  // 修改热门搜索路径为社区搜索热门接口
  const url = BASE + '/api/community/search/hot'
  console.log('[search] GET hot search', url)

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'GET', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) throw new Error(j?.message || j?.error || 'get hot search failed')
    return j ?? []
  }

  return await new Promise((resolve, reject)=>{
    try{
      uni.request({ url, method:'GET', header: buildHeaders(), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
    }catch(e){ reject(e) }
  })
}

// 获取用户搜索历史: GET /api/community/search/history
// 注意：已按照要求修改搜索历史接口路径，不再使用 /api/search
export async function getSearchHistory(){
  // 修改搜索历史路径为社区搜索历史接口
  const url = BASE + '/api/community/search/history'
  console.log('[search] GET search history', url)

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'GET', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) throw new Error(j?.message || j?.error || 'get search history failed')
    return j ?? []
  }

  return await new Promise((resolve, reject)=>{
    try{
      uni.request({ url, method:'GET', header: buildHeaders(), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
    }catch(e){ reject(e) }
  })
}

// 记录搜索行为: POST /api/community/search/history
// 注意：已按照要求修改记录搜索接口路径，不再使用 /api/search
export async function recordSearch(query){
  // 修改记录搜索路径为社区搜索历史接口
  const url = BASE + '/api/community/search/history'
  console.log('[search] POST record search', url, query)

  const body = JSON.stringify({ query: query })

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'POST', headers: buildHeaders(), body })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) throw new Error(j?.message || j?.error || 'record search failed')
    return j ?? {}
  }

  // 构建包含Content-Type的headers
  const headers = buildHeaders()
  headers['Content-Type'] = 'application/json'
  
  // 将数据序列化为JSON字符串
  const data = JSON.stringify({ query: query })
  
  return await new Promise((resolve, reject)=>{
    try{
      uni.request({ url, method:'POST', header: headers, data: data, success(r){ resolve(r.data) }, fail(err){ reject(err) } })
    }catch(e){ reject(e) }
  })
}

// 清空搜索历史: DELETE /api/community/search/history
// 注意：已按照要求修改清空搜索历史接口路径，不再使用 /api/search
export async function clearSearchHistory(){
  // 修改清空搜索历史路径为社区搜索历史接口
  const url = BASE + '/api/community/search/history'
  console.log('[search] DELETE clear search history', url)

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'DELETE', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) throw new Error(j?.message || j?.error || 'clear search history failed')
    return j ?? {}
  }

  return await new Promise((resolve, reject)=>{
    try{
      uni.request({ url, method:'DELETE', header: buildHeaders(), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
    }catch(e){ reject(e) }
  })
}

// 删除单条搜索历史记录: DELETE /api/community/search/history/:recordId
export async function deleteSearchHistoryRecord(recordId){
  if(!recordId) throw new Error('missing recordId')
  const url = BASE + '/api/community/search/history/' + encodeURIComponent(recordId)
  console.log('[search] DELETE search history record', url)

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'DELETE', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) throw new Error(j?.message || j?.error || 'delete search history record failed')
    return j ?? {}
  }

  return await new Promise((resolve, reject)=>{
    try{
      uni.request({ url, method:'DELETE', header: buildHeaders(), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
    }catch(e){ reject(e) }
  })
}
