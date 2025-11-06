import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3003' // 临时修改为 localhost，开发时可用 .env 恢复

function buildHeaders(){
  const auth = getAuthLocal()
  const t = auth?.token || auth?.access_token || null
  const headers = {}
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

export async function getAudios({ category_id = null, limit = 20 } = {}){
  // 兼容小程序环境：优先使用 uni.request（小程序运行时没有 fetch），同时打印日志
  const pairs = []
  if (category_id) pairs.push('category_id=' + encodeURIComponent(category_id))
  pairs.push('limit=' + encodeURIComponent(String(limit)))
  const q = pairs.length ? ('?' + pairs.join('&')) : ''
  const url = BASE + '/api/audios' + q
  console.log('[api/audios] GET', url)

  // 如果 fetch 可用则使用 fetch，否则使用 uni.request
  if (typeof fetch === 'function'){
    const res = await fetch(url, { method: 'GET', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ console.warn('[api/audios] parse json failed', e) }
    if(!res.ok) throw new Error((j && (j.message || j.error)) || 'fetch audios failed')
    console.log('[api/audios] fetch response', j)
    return j
  }

  // fallback to uni.request for WeChat mini program environment
  return new Promise((resolve, reject) => {
    try{
      uni.request({
        url,
        method: 'GET',
        header: buildHeaders(),
        success(res){
          console.log('[api/audios] uni.request success', res)
          // uni.request 返回结构: { statusCode, data }
          if(res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)){
            return reject(new Error('request failed: ' + res.statusCode))
          }
          resolve(res.data)
        },
        fail(err){
          console.warn('[api/audios] uni.request fail', err)
          reject(err)
        }
      })
    }catch(e){
      console.warn('[api/audios] uni.request throw', e)
      reject(e)
    }
  })
}

// upload audio metadata (assumes file already hosted or provide file_url)
export async function uploadAudio({ title, description, category_id, duration = 0, file_url, tags = [], author_id = null } = {}){
  const payload = {
    title,
    description,
    category_id,
    duration,
    file_url,
    tags: Array.isArray(tags) ? tags.join(',') : (tags || '')
  }
  if(author_id) payload.author_id = author_id
  const res = await fetch(BASE + '/api/audios/upload', {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, buildHeaders()),
    body: JSON.stringify(payload)
  })
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || j.error || 'upload audio failed')
  return j
}

// multipart/form-data upload (accepts File/Blob) -> returns upload metadata
export async function uploadAudioMultipart({ file, title, description, category_id, duration = 0, tags = [], author_id = null } = {}){
  if(!file) throw new Error('file is required')
  
  // 确保必填字段不为空
  if(!title || !title.trim()) throw new Error('标题不能为空')
  if(!category_id) throw new Error('分类ID不能为空')
  
  const fd = new FormData()
  fd.append('file', file)
  
  // 尝试不同的字段名称格式，后端可能期望驼峰命名
  // 同时发送多种可能的字段名称格式
  fd.append('title', title.trim())
  fd.append('audioName', title.trim()) // 可能后端期望audioName
  fd.append('name', title.trim()) // 可能后端期望name
  
  fd.append('description', description?.trim() || '无描述')
  
  // 注意：后端期望的是 "category id"（带空格）而不是 "category_id"
  fd.append('category id', category_id)
  
  fd.append('duration', String(duration || 0))
  fd.append('tags', Array.isArray(tags) ? tags.join(',') : (tags || ''))
  
  // 注意：后端期望的是 "author id"（带空格）
  if(author_id) {
    fd.append('author id', author_id)
  }

  const headers = buildHeaders()
  // fetch will set proper multipart boundary when Content-Type not provided
  const res = await fetch(BASE + '/api/audios/upload', {
    method: 'POST',
    headers,
    body: fd
  })
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || j.error || 'multipart upload failed')
  return j
}
