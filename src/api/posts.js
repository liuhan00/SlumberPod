import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.139:3003'

function buildHeaders(token){
  const headers = { 'Content-Type': 'application/json' }
  const t = token || getAuthLocal()?.token || getAuthLocal()?.access_token || null
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

export async function createPost({ userId, title='', content='', imageUrls = [] }, token){
  const headers = buildHeaders(token)
  const url = BASE + '/api/posts'
  const body = JSON.stringify({ userId, title, content, imageUrls })
  
  // 兼容小程序环境：优先使用 fetch，否则使用 uni.request
  if (typeof fetch === 'function'){
    const res = await fetch(url, { method: 'POST', headers, body })
    const j = await res.json()
    if(!res.ok) throw new Error(j.message || j.error || 'create post failed')
    return j
  }
  
  // fallback to uni.request for WeChat mini program environment
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'POST',
      header: headers,
      data: { userId, title, content, imageUrls },
      success(res){
        if(res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)){
          const errorMsg = res.data?.message || res.data?.error || 'create post failed'
          return reject(new Error(errorMsg))
        }
        resolve(res.data)
      },
      fail(err){
        reject(err)
      }
    })
  })
}

export async function getPosts({ page = 1, limit = 10 } = {}){
  // URL constructor is not available in some mini program runtimes; build query string manually
  const url = BASE + '/api/posts?page=' + encodeURIComponent(page) + '&limit=' + encodeURIComponent(limit)
  const headers = buildHeaders()
  
  // 兼容小程序环境：优先使用 fetch，否则使用 uni.request
  if (typeof fetch === 'function'){
    const res = await fetch(url, { method: 'GET', headers })
    const j = await res.json()
    if(!res.ok) throw new Error(j.message || j.error || 'fetch posts failed')
    return j
  }
  
  // fallback to uni.request for WeChat mini program environment
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      header: headers,
      success(res){
        if(res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)){
          const errorMsg = res.data?.message || res.data?.error || 'fetch posts failed'
          return reject(new Error(errorMsg))
        }
        resolve(res.data)
      },
      fail(err){
        reject(err)
      }
    })
  })
}

// 获取最新帖子列表：/api/lastest
export async function getLatest(){
  const url = BASE + '/api/lastest'
  const headers = buildHeaders()
  
  // 兼容小程序环境：优先使用 fetch，否则使用 uni.request
  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'GET', headers })
    let j = null
    try{ j = await res.json() }catch(e){ j = res }
    if(!res.ok) throw new Error(j?.message || j?.error || 'fetch latest posts failed')
    return j
  }
  
  // fallback to uni.request for WeChat mini program environment
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      header: headers,
      success(res){
        if(res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)){
          const errorMsg = res.data?.message || res.data?.error || 'fetch latest posts failed'
          return reject(new Error(errorMsg))
        }
        resolve(res.data)
      },
      fail(err){
        reject(err)
      }
    })
  })
}

// 获取热门帖子列表：/api/hot
export async function getHot(){
  const url = BASE + '/api/hot'
  const headers = buildHeaders()
  
  // 兼容小程序环境：优先使用 fetch，否则使用 uni.request
  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'GET', headers })
    let j = null
    try{ j = await res.json() }catch(e){ j = res }
    if(!res.ok) throw new Error(j?.message || j?.error || 'fetch hot posts failed')
    return j
  }
  
  // fallback to uni.request for WeChat mini program environment
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      header: headers,
      success(res){
        if(res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)){
          const errorMsg = res.data?.message || res.data?.error || 'fetch hot posts failed'
          return reject(new Error(errorMsg))
        }
        resolve(res.data)
      },
      fail(err){
        reject(err)
      }
    })
  })
}
