import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.139:3003'

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
