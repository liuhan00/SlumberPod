import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.236.92:3003'

function buildHeaders(){
  const auth = getAuthLocal()
  const t = auth?.token || auth?.access_token || null
  const headers = {}
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

export async function getAudios({ category_id = null, limit = 20, offset = 0 } = {}){
  // 兼容小程序环境：优先使用 uni.request（小程序运行时没有 fetch），同时打印日志
  const pairs = []
  // 后端约定：category_id=free 表示免费；数字表示具体分类；不传表示全部
  if (category_id) pairs.push('category_id=' + encodeURIComponent(category_id))
  pairs.push('limit=' + encodeURIComponent(String(limit)))
  pairs.push('offset=' + encodeURIComponent(String(offset)))
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
  const res = await fetch(BASE + '/api/creations', {
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
  
  // 检测是否为小程序环境
  const isMiniProgram = typeof uni !== 'undefined' && uni.uploadFile
  
  if(isMiniProgram) {
    // 小程序环境使用 uni.uploadFile
    return new Promise((resolve, reject) => {
      try {
        const headers = buildHeaders()
        
        // 获取文件路径 - 支持多种格式
        let filePath = file
        if(typeof file === 'object') {
          filePath = file.path || file.uri || file.tempFilePath || file.url
        }
        
        console.log('[api/audios] 小程序上传文件路径:', filePath)
        
        uni.uploadFile({
          url: BASE + '/api/creations',
          filePath: filePath,
          name: 'file',
          formData: {
            title: title.trim(),
            description: description?.trim() || '无描述',
            category_id: String(category_id),
            duration: String(duration || 0),
            tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
            ...(author_id && { author_id: author_id }),
            is_public: '1',
            is_free: '0'
          },
          header: headers,
          success(res) {
            console.log('[api/audios] uni.uploadFile success', res)
            try {
              let data = res.data
              if(typeof data === 'string') {
                data = JSON.parse(data)
              }
              if(res.statusCode >= 200 && res.statusCode < 300) {
                resolve(data)
              } else {
                let errorMsg = data.message || data.error || 'upload failed'
                if(res.statusCode === 401 || errorMsg.includes('未授权') || errorMsg.includes('token')) {
                  errorMsg = '认证失败，请重新登录'
                }
                reject(new Error(errorMsg))
              }
            } catch(e) {
              reject(new Error('parse response failed: ' + e.message))
            }
          },
          fail(err) {
            console.warn('[api/audios] uni.uploadFile fail', err)
            reject(err)
          }
        })
      } catch(e) {
        console.warn('[api/audios] uni.uploadFile throw', e)
        reject(e)
      }
    })
  }
  
  // Web环境使用 FormData
  const fd = new FormData()
  fd.append('file', file)
  
  // 使用标准的字段名
  fd.append('title', title.trim())
  fd.append('description', description?.trim() || '无描述')
  fd.append('category_id', String(category_id))
  fd.append('duration', String(duration || 0))
  fd.append('tags', Array.isArray(tags) ? tags.join(',') : (tags || ''))
  
  if(author_id) {
    fd.append('author_id', author_id)
  }
  
  fd.append('is_public', '1')
  fd.append('is_free', '0')

  const headers = buildHeaders()
  // fetch will set proper multipart boundary when Content-Type not provided
  const res = await fetch(BASE + '/api/creations', {
    method: 'POST',
    headers,
    body: fd
  })
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || j.error || 'multipart upload failed')
  return j
}

// search audios by keyword
export async function searchAudios({ keyword, limit = 20, offset = 0 } = {}){
  if(!keyword || !keyword.trim()) throw new Error('搜索关键词不能为空')
  
  const pairs = []
  pairs.push('keyword=' + encodeURIComponent(keyword.trim()))
  pairs.push('limit=' + encodeURIComponent(String(limit)))
  pairs.push('offset=' + encodeURIComponent(String(offset)))
  const q = '?' + pairs.join('&')
  const url = BASE + '/api/audios/search' + q
  console.log('[api/audios] search', url)

  // 如果 fetch 可用则使用 fetch，否则使用 uni.request
  if (typeof fetch === 'function'){
    const res = await fetch(url, { method: 'GET', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ console.warn('[api/audios] search parse json failed', e) }
    if(!res.ok) throw new Error((j && (j.message || j.error)) || 'search audios failed')
    console.log('[api/audios] search response', j)
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
          console.log('[api/audios] search uni.request success', res)
          if(res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)){
            return reject(new Error('search request failed: ' + res.statusCode))
          }
          resolve(res.data)
        },
        fail(err){
          console.warn('[api/audios] search uni.request fail', err)
          reject(err)
        }
      })
    }catch(e){
      console.warn('[api/audios] search uni.request throw', e)
      reject(e)
    }
  })
}
