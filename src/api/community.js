import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.135:3003'

function buildHeaders(token){
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
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
export async function createPost({ title, content, coverImage, image, audioId, audio_id, audioUrl } = {}){
  const url = BASE + '/api/community'
  // 单次提交，避免多次回退导致重复创建
  const payload = {
    title: title ?? '',
    content: content ?? '',
    // 附带客户端幂等键，后端可用来去重（即使不识别也无副作用）
    client_nonce: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
  const img = coverImage ?? image ?? ''
  const aid = audioId ?? audio_id
  if(img) payload.cover_image = img
  if(aid != null) payload.audio_id = aid
  if(audioUrl) payload.audio_url = audioUrl

    const body = JSON.stringify(payload)
    console.log('[community.createPost] POST', url, payload)
    
    // fetch 分支
    if (typeof fetch === 'function'){
      const res = await fetch(url, { method:'POST', headers: buildHeaders(), body })
      let data = null
      try{ data = await res.json() }catch(e){ try{ const txt = await res.text(); data = { errorText: txt } }catch(_){} }
      if(!res.ok){
        const msg = data?.message || data?.error || data?.errorText || `create post failed: ${res.status}`
      throw new Error(msg)
      }
    return data ?? {}
    }
    
    // 小程序 uni.request 分支
  return await new Promise((resolve, reject) => {
      try{
        uni.request({ 
          url, method:'POST', header: buildHeaders(), data: JSON.parse(body),
          success(r){ 
          if(r.statusCode >= 200 && r.statusCode < 300){
            resolve(r.data ?? {})
          }else{
            reject(new Error(r.data?.message || r.data?.error || `create post failed: ${r.statusCode}`))
          }
        },
        fail(err){ reject(new Error(String(err))) }
    })
    }catch(e){ reject(e) }
  })
}

// 获取帖子详情：/api/community/:id
export async function getCommunityDetail(id){
  if(!id && id !== 0) throw new Error('invalid id')
  // 清理ID，去除可能的前缀
  let cleanId = id
  if (typeof id === 'string' && id.startsWith('p')) {
    cleanId = id.replace('p', '')
  }
  const url = BASE + '/api/community/' + encodeURIComponent(cleanId)
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

// 获取热门帖子（按点赞数排序）：/api/community/hot
export async function getHotPosts(){
  const url = BASE + '/api/community/hot'
  try{
    if (typeof fetch === 'function'){
      const res = await fetch(url, { method:'GET', headers: buildHeaders() })
      let j = null
      try{ j = await res.json() }catch(e){ j = res }
      if(!res.ok) throw new Error(j?.message || j?.error || 'fetch hot posts failed')
      return j
    }
    return await new Promise((resolve, reject)=>{
      try{
        uni.request({ url, method:'GET', header: buildHeaders(), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
      }catch(e){ reject(e) }
    })
  }catch(e){ throw e }
}

// 获取用户点赞/收藏的帖子：/api/community/:userId/like
export async function listLikedPosts(userId){
  if(userId === undefined || userId === null) throw new Error('missing userId')
  const url = BASE + '/api/community/' + encodeURIComponent(userId) + '/like'
  try{
    if (typeof fetch === 'function'){
      const res = await fetch(url, { method:'GET', headers: buildHeaders() })
      let j = null
      try{ j = await res.json() }catch(e){ j = res }
      if(!res.ok) throw new Error(j?.message || j?.error || 'fetch liked posts failed')
      return j?.data || j || []
    }
    return await new Promise((resolve, reject)=>{
      try{
        uni.request({ url, method:'GET', header: buildHeaders(), success(r){ resolve(r.data?.data || r.data || []) }, fail(err){ reject(err) } })
      }catch(e){ reject(e) }
    })
  }catch(e){ 
    // 404 视为暂无点赞
    if(e?.status === 404) return []
    throw e 
  }
}

// 获取帖子评论：/api/community/:postId/comments
export async function getComments({ postId, page = 1, limit = 20 } = {}){
  if(!postId && postId !== 0) throw new Error('missing postId')
  const url = BASE + '/api/community/' + encodeURIComponent(postId) + '/comments?page=' + encodeURIComponent(page) + '&limit=' + encodeURIComponent(limit)
  try{
    if (typeof fetch === 'function'){
      const res = await fetch(url, { method:'GET', headers: buildHeaders() })
      let j = null
      try{ j = await res.json() }catch(e){ j = res }
      if(!res.ok) throw new Error(j?.message || j?.error || 'fetch comments failed')
      return j?.data || j || []
    }
    return await new Promise((resolve, reject)=>{
      try{
        uni.request({ url, method:'GET', header: buildHeaders(), success(r){ resolve(r.data?.data || r.data || []) }, fail(err){ reject(err) } })
      }catch(e){ reject(e) }
    })
  }catch(e){ 
    throw e 
  }
}

// 创建评论：/api/community/:postId/comments
export async function createComment({ postId, content }, token){
  if(!postId && postId !== 0) throw new Error('missing postId')
  if(!content) throw new Error('missing content')
  const url = BASE + '/api/community/' + encodeURIComponent(postId) + '/comments'
  const body = JSON.stringify({ content })
  try{
    if (typeof fetch === 'function'){
      const res = await fetch(url, { method:'POST', headers: buildHeaders(token), body })
      let j = null
      try{ j = await res.json() }catch(e){ j = res }
      if(!res.ok) throw new Error(j?.message || j?.error || 'create comment failed')
      return j
    }
    return await new Promise((resolve, reject)=>{
      try{
        uni.request({ url, method:'POST', header: buildHeaders(token), data: JSON.parse(body), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
      }catch(e){ reject(e) }
    })
  }catch(e){ 
    throw e 
  }
}

// 点赞帖子：/api/community/:postId/like
export async function likePost({ postId }, token){
  if(!postId && postId !== 0) throw new Error('missing postId')
  const url = BASE + '/api/community/' + encodeURIComponent(postId) + '/like'
  try{
    if (typeof fetch === 'function'){
      const res = await fetch(url, { method:'POST', headers: buildHeaders(token) })
      let j = null
      try{ j = await res.json() }catch(e){ j = res }
      if(!res.ok) throw new Error(j?.message || j?.error || 'like post failed')
      return j
    }
    return await new Promise((resolve, reject)=>{
      try{
        uni.request({ url, method:'POST', header: buildHeaders(token), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
      }catch(e){ reject(e) }
    })
  }catch(e){ 
    throw e 
  }
}

// 获取用户发布的帖子：/api/community/user/posts
export async function getUserPosts(token){
  const url = BASE + '/api/community/user/posts'
  try{
    if (typeof fetch === 'function'){
      const res = await fetch(url, { method:'GET', headers: buildHeaders(token) })
      let j = null
      try{ j = await res.json() }catch(e){ j = res }
      if(!res.ok) throw new Error(j?.message || j?.error || 'fetch user posts failed')
      return j
    }
    return await new Promise((resolve, reject)=>{
      try{
        uni.request({ url, method:'GET', header: buildHeaders(token), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
      }catch(e){ reject(e) }
    })
  }catch(e){ throw e }
}

// 删除帖子：/api/community/:id
export async function deletePost({ postId }, token){
  if(!postId && postId !== 0) throw new Error('missing postId')
  const url = BASE + '/api/community/' + encodeURIComponent(postId)
  try{
    if (typeof fetch === 'function'){
      const res = await fetch(url, { method:'DELETE', headers: buildHeaders(token) })
      let j = null
      try{ j = await res.json() }catch(e){ j = res }
      if(!res.ok) throw new Error(j?.message || j?.error || 'delete post failed')
      return j
    }
    return await new Promise((resolve, reject)=>{
      try{
        uni.request({ url, method:'DELETE', header: buildHeaders(token), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
      }catch(e){ reject(e) }
    })
  }catch(e){ throw e }
}

// 搜索帖子：/api/community/search?q=&page=&limit=
export async function searchCommunityPosts({ q, page = 1, limit = 20 } = {}){
  if(!q || !String(q).trim()) throw new Error('搜索关键词不能为空')
  // WeChat 小程序无 URLSearchParams，这里手动构建查询字符串
  const queryObj = { q: String(q).trim(), page, limit }
  const qs = Object.keys(queryObj)
    .filter(k => queryObj[k] !== undefined && queryObj[k] !== null && queryObj[k] !== '')
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String(queryObj[k]))}`)
    .join('&')
  const url = BASE + '/api/community/search' + (qs ? ('?' + qs) : '')
  console.log('[community] GET search posts', url)

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'GET', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ j = res }
    console.log('[community] search posts response', res.status, j)
    if(!res.ok) {
      // 更详细的错误信息
      const errorMsg = j?.message || j?.error || `search posts failed with status ${res.status}`
      console.error('[community] search posts error', errorMsg, j)
      throw new Error(errorMsg)
    }
    return j ?? []
  }

  return await new Promise((resolve, reject)=>{
    try{
      uni.request({ url, method:'GET', header: buildHeaders(), success(r){ 
        console.log('[community] search posts response', r.statusCode, r.data)
        if(r.statusCode >= 200 && r.statusCode < 300){
          resolve(r.data ?? [])
        } else {
          const errorMsg = r.data?.message || r.data?.error || `search posts failed with status ${r.statusCode}`
          console.error('[community] search posts error', errorMsg, r.data)
          reject(new Error(errorMsg))
        }
      }, fail(err){ 
        console.error('[community] search posts network error', err)
        reject(new Error('网络请求失败'))
      } })
    }catch(e){ 
      console.error('[community] search posts exception', e)
      reject(e) 
    }
  })
}
