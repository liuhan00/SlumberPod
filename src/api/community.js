import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.236.92:3003'

function buildHeaders(token){
  const headers = { 'Content-Type': 'application/json' }
  const t = token || getAuthLocal()?.token || getAuthLocal()?.access_token || null
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

// 获取帖子列表：/api/community?page=&limit=
export async function getCommunityList({ page = 1, limit = 20 } = {}){
  const url = BASE + '/api/community?page=' + encodeURIComponent(page) + '&limit=' + encodeURIComponent(limit)
  try{
    if (typeof fetch === 'function'){
      const res = await fetch(url, { method:'GET', headers: buildHeaders() })
      let j = null
      try{ j = await res.json() }catch(e){ j = res }
      if(!res.ok) throw new Error(j?.message || j?.error || 'fetch community list failed')
      return j
    }
    // uni.request 兜底
    return await new Promise((resolve, reject)=>{
      try{
        uni.request({ url, method:'GET', header: buildHeaders(), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
      }catch(e){ reject(e) }
    })
  }catch(e){ throw e }
}

// 发送帖子：/api/community (POST)
export async function createPost({ title, content, category = 'general' } = {}){
  const url = BASE + '/api/community'
  const body = JSON.stringify({ title, content, category })
  
  try{
    if (typeof fetch === 'function'){
      const res = await fetch(url, { method:'POST', headers: buildHeaders(), body })
      let j = null
      try{ j = await res.json() }catch(e){ j = res }
      if(!res.ok) throw new Error(j?.message || j?.error || 'create post failed')
      return j
    }
    // uni.request 兜底
    return await new Promise((resolve, reject)=>{
      try{
        uni.request({ 
          url, 
          method:'POST', 
          header: buildHeaders(), 
          data: JSON.parse(body),
          success(r){ resolve(r.data) }, 
          fail(err){ reject(err) } 
        })
      }catch(e){ reject(e) }
    })
  }catch(e){ throw e }
}

// 获取帖子详情：/api/community/:id
export async function getCommunityDetail(id){
  if(!id && id !== 0) throw new Error('invalid id')
  const url = BASE + '/api/community/' + encodeURIComponent(id)
  try{
    if (typeof fetch === 'function'){
      const res = await fetch(url, { method:'GET', headers: buildHeaders() })
      let j = null
      try{ j = await res.json() }catch(e){ j = res }
      if(!res.ok) throw new Error(j?.message || j?.error || 'fetch community detail failed')
      return j
    }
    return await new Promise((resolve, reject)=>{
      try{
        uni.request({ url, method:'GET', header: buildHeaders(), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
      }catch(e){ reject(e) }
    })
  }catch(e){ throw e }
}
