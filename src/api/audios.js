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

// 后端字段版：通过 URL 方式提交创作，使用带空格的键名
export async function createAudioByUrl({ title, description, audioUrl, coverUrl = '', durationSeconds = 0, categoryIds = [], isPublic = 1, isFree = 0 } = {}){
  if(!title || !String(title).trim()) throw new Error('标题是必填项')
  if(!audioUrl || !String(audioUrl).trim()) throw new Error('音频URL是必填项')
  const payload = {}
  payload['title'] = String(title).trim()
  if(description != null) payload['description'] = String(description)
  payload['audio url'] = String(audioUrl).trim()
  if(coverUrl) payload['cover url'] = String(coverUrl).trim()
  payload['duration seconds'] = Number(durationSeconds) || 0
  payload['category ids'] = Array.isArray(categoryIds) ? categoryIds : (categoryIds != null ? [categoryIds] : [])
  payload['is public'] = isPublic ? 1 : 0
  payload['is free'] = isFree ? 1 : 0

  // 兼容 fetch 与小程序
  const url = BASE + '/api/creations'
  // 统一使用 x-www-form-urlencoded，确保带空格的键名被正确编码并被后端解析
  function toUrlEncoded(obj){
    return Object.keys(obj)
      .filter(k => obj[k] !== undefined && obj[k] !== null)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(Array.isArray(obj[k]) ? obj[k].join(',') : String(obj[k]))}`)
      .join('&')
  }
  const bodyStr = toUrlEncoded(payload)
  const headers = Object.assign({ 'Content-Type': 'application/x-www-form-urlencoded' }, buildHeaders())

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'POST', headers, body: bodyStr })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) throw new Error(j?.message || j?.error || '创建音频失败')
    return j || {}
  }

  // 小程序分支
  return await new Promise((resolve, reject)=>{
    try{
      uni.request({ url, method:'POST', header: headers, data: bodyStr, success(r){
        if(r.statusCode >= 200 && r.statusCode < 300){ resolve(r.data) }
        else { reject(new Error(r.data?.message || r.data?.error || '创建音频失败')) }
      }, fail(err){ reject(err) } })
    }catch(e){ reject(e) }
  })
}

// 上传音频文件到 Supabase 存储，然后创建音频记录
// 流程：POST /api/audio/upload -> 提取音频URL -> POST /api/creations
export async function uploadAudioToStorage({ file, title, description = '', coverUrl = '', durationSeconds = 0, categoryIds = [], isPublic = 1, isFree = 0 } = {}){
  if(!file) throw new Error('file is required')
  if(!title || !String(title).trim()) throw new Error('标题是必填项')
  
  // 检测是否为小程序环境
  const isMiniProgram = typeof uni !== 'undefined' && uni.uploadFile
  
  // 提取音频 URL 的辅助函数
  function extractAudioUrl(data){
    const candidates = []
    // 常见字段名
    candidates.push(data?.publicUrl)
    candidates.push(data?.url)
    candidates.push(data?.audioUrl)
    candidates.push(data?.fileUrl)
    candidates.push(data?.audio_url)
    candidates.push(data?.file_url)
    // 嵌套 data
    if(data?.data){
      candidates.push(data.data.publicUrl)
      candidates.push(data.data.url)
      candidates.push(data.data.audioUrl)
      candidates.push(data.data.fileUrl)
    }
    // 有些服务直接返回字符串 URL
    if(typeof data === 'string' && /^https?:\/\//.test(data)){
      candidates.push(data)
    }
    // 从对象中的任意字符串字段里猜测 http(s) URL
    try{
      const flat = JSON.stringify(data)
      const m = flat && flat.match(/https?:\/\/[^\s"']+/)
      if(m && m[0]) candidates.push(m[0])
    }catch(_){}
    // 选择第一个符合 http(s) 的
    const picked = candidates.find(u => typeof u === 'string' && /^https?:\/\//.test(u))
    return picked || ''
  }
  
  if(isMiniProgram) {
    // 小程序环境使用 uni.uploadFile
    return new Promise((resolve, reject) => {
      try {
        const headers = buildHeaders()
        
        // 获取文件路径
        let filePath = file
        if(typeof file === 'object'){
          filePath = file.tempFilePath || file.path || file.uri || file.url || ''
        }
        
        console.log('[api/audios] uploadAudioToStorage 上传到 /api/audio/upload, filePath:', filePath)
        
        // 第一步：上传到 /api/audio/upload
        uni.uploadFile({
          url: BASE + '/api/audio/upload',
          filePath: filePath,
          name: 'audio',
          fileType: 'audio',
          timeout: 60000,
          formData: {
            title: String(title).trim(),
            ...(description ? { description: String(description).trim() } : {})
          },
          header: headers,
          success(uploadRes) {
            console.log('[api/audios] uploadAudioToStorage 上传成功', uploadRes)
            try {
              let uploadData = uploadRes.data
              if(typeof uploadData === 'string') {
                try {
                  uploadData = JSON.parse(uploadData)
                } catch(parseErr) {
                  console.warn('[api/audios] uploadAudioToStorage 解析响应失败', parseErr)
                  // 如果解析失败但状态码是 2xx，尝试直接使用原始数据
                  if(uploadRes.statusCode >= 200 && uploadRes.statusCode < 300){
                    uploadData = { raw: uploadRes.data }
                  } else {
                    return reject(new Error('上传失败：无法解析响应'))
                  }
                }
              }
              
              if(uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
                // 提取音频 URL
                const audioUrl = extractAudioUrl(uploadData)
                console.log('[api/audios] uploadAudioToStorage 提取的音频URL:', audioUrl)
                
                if(!audioUrl) {
                  console.warn('[api/audios] uploadAudioToStorage 无法从响应中提取音频URL，响应:', uploadData)
                  return reject(new Error('上传成功但无法获取音频URL，请检查后端返回格式'))
                }
                
                // 第二步：调用 createAudioByUrl 创建音频记录
                createAudioByUrl({
                  title: String(title).trim(),
                  description: description || '',
                  audioUrl: audioUrl,
                  coverUrl: coverUrl || '',
                  durationSeconds: durationSeconds || 0,
                  categoryIds: Array.isArray(categoryIds) ? categoryIds : (categoryIds ? [categoryIds] : []),
                  isPublic: isPublic ? 1 : 0,
                  isFree: isFree ? 1 : 0
                }).then(creationResult => {
                  console.log('[api/audios] uploadAudioToStorage 创建音频记录成功', creationResult)
                  // 返回创建结果，同时包含上传信息
                  resolve({
                    ...creationResult,
                    upload: uploadData,
                    audioUrl: audioUrl
                  })
                }).catch(createErr => {
                  console.error('[api/audios] uploadAudioToStorage 创建音频记录失败', createErr)
                  // 即使创建失败，也返回上传信息，让调用方知道文件已上传
                  reject(new Error(`音频已上传但创建记录失败: ${createErr.message || createErr}`))
                })
              } else {
                let errorMsg = uploadData?.message || uploadData?.error || '上传失败'
                if(uploadRes.statusCode === 401 || String(errorMsg).includes('未授权') || String(errorMsg).includes('token')) {
                  errorMsg = '认证失败，请重新登录'
                }
                reject(new Error(errorMsg))
              }
            } catch(e) {
              console.error('[api/audios] uploadAudioToStorage 处理响应失败', e)
              reject(new Error('处理上传响应失败: ' + e.message))
            }
          },
          fail(err) {
            console.error('[api/audios] uploadAudioToStorage 上传失败', err)
            reject(err)
          }
        })
      } catch(e) {
        console.error('[api/audios] uploadAudioToStorage 异常', e)
        reject(e)
      }
    })
  }
  
  // Web 环境使用 FormData + fetch
  const fd = new FormData()
  fd.append('audio', file)
  fd.append('title', String(title).trim())
  if(description) fd.append('description', String(description).trim())
  
  const headers = buildHeaders()
  
  try {
    // 第一步：上传到 /api/audio/upload
    console.log('[api/audios] uploadAudioToStorage 上传到 /api/audio/upload (Web)')
    const uploadRes = await fetch(BASE + '/api/audio/upload', {
      method: 'POST',
      headers,
      body: fd
    })
    
    let uploadData = null
    try {
      uploadData = await uploadRes.json()
    } catch(parseErr) {
      if(uploadRes.ok) {
        // 2xx 但无法解析 JSON，尝试作为文本处理
        const text = await uploadRes.text()
        uploadData = { raw: text }
      } else {
        throw new Error(`上传失败: HTTP ${uploadRes.status}`)
      }
    }
    
    if(!uploadRes.ok) {
      const errorMsg = uploadData?.message || uploadData?.error || `上传失败: HTTP ${uploadRes.status}`
      throw new Error(errorMsg)
    }
    
    console.log('[api/audios] uploadAudioToStorage 上传成功 (Web)', uploadData)
    
    // 提取音频 URL
    const audioUrl = extractAudioUrl(uploadData)
    console.log('[api/audios] uploadAudioToStorage 提取的音频URL:', audioUrl)
    
    if(!audioUrl) {
      throw new Error('上传成功但无法获取音频URL，请检查后端返回格式')
    }
    
    // 第二步：调用 createAudioByUrl 创建音频记录
    const creationResult = await createAudioByUrl({
      title: String(title).trim(),
      description: description || '',
      audioUrl: audioUrl,
      coverUrl: coverUrl || '',
      durationSeconds: durationSeconds || 0,
      categoryIds: Array.isArray(categoryIds) ? categoryIds : (categoryIds ? [categoryIds] : []),
      isPublic: isPublic ? 1 : 0,
      isFree: isFree ? 1 : 0
    })
    
    console.log('[api/audios] uploadAudioToStorage 创建音频记录成功 (Web)', creationResult)
    
    // 返回创建结果，同时包含上传信息
    return {
      ...creationResult,
      upload: uploadData,
      audioUrl: audioUrl
    }
  } catch(err) {
    console.error('[api/audios] uploadAudioToStorage 失败 (Web)', err)
    throw err
  }
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
        
        // 规范文件路径提取（优先 tempFilePath）
        if(typeof file === 'object'){
          const cand = file.tempFilePath || file.path || file.uri || file.url
          if(cand) filePath = cand
        }
        
        uni.uploadFile({
          url: BASE + '/api/creations',
          filePath: filePath,
          name: 'file',
          fileType: 'audio',
          timeout: 60000,
          formData: {
            title: title.trim(),
            description: description?.trim() || '无描述',
            category_id: String(category_id),
            duration: String(duration || 0),
            tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
            ...(author_id && { author_id: author_id }),
            is_public: '1',
            is_free: '0',
            // 某些后端会强校验“标题和音频URL是必填项”，补充一个可解析的 audio url 字段
            // 这里传入临时路径，若后端需要公网可访问地址，应改为先上传到对象存储后再走 createAudioByUrl
            'audio url': filePath,
            // 同时附带常见命名以提高兼容性
            audioUrl: filePath,
            audio_url: filePath
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
                if(res.statusCode === 401 || String(errorMsg).includes('未授权') || String(errorMsg).includes('token')) {
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
            // ECONNRESET 常见于代理/服务主动断开；给出明确指引
            const msg = String(err?.errMsg || err)
            if(msg.includes('ECONNRESET')){
              reject(new Error('连接被重置：请关闭代理/检查后端上传接口是否接受multipart，以及确认服务稳定'))
              return
            }
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

// 获取当前用户的创作列表
export async function getMyCreations({ limit = 20, offset = 0 } = {}){
  const pairs = []
  pairs.push('limit=' + encodeURIComponent(String(limit)))
  pairs.push('offset=' + encodeURIComponent(String(offset)))
  const q = pairs.length ? ('?' + pairs.join('&')) : ''
  const url = BASE + '/api/creations' + q
  console.log('[api/audios] getMyCreations', url)

  // 如果 fetch 可用则使用 fetch，否则使用 uni.request
  if (typeof fetch === 'function'){
    const res = await fetch(url, { method: 'GET', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ console.warn('[api/audios] getMyCreations parse json failed', e) }
    if(!res.ok) throw new Error((j && (j.message || j.error)) || '获取我的创作失败')
    console.log('[api/audios] getMyCreations response', j)
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
          console.log('[api/audios] getMyCreations uni.request success', res)
          if(res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)){
            return reject(new Error('getMyCreations request failed: ' + res.statusCode))
          }
          resolve(res.data)
        },
        fail(err){
          console.warn('[api/audios] getMyCreations uni.request fail', err)
          reject(err)
        }
      })
    }catch(e){
      console.warn('[api/audios] getMyCreations uni.request throw', e)
      reject(e)
    }
  })
}

// 根据ID获取音频详情
export async function getAudioById(id){
  if(!id) throw new Error('音频ID不能为空')
  const url = BASE + '/api/audios/' + encodeURIComponent(String(id))
  console.log('[api/audios] getAudioById', url)

  // 如果 fetch 可用则使用 fetch，否则使用 uni.request
  if (typeof fetch === 'function'){
    const res = await fetch(url, { method: 'GET', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ console.warn('[api/audios] getAudioById parse json failed', e) }
    if(!res.ok) throw new Error((j && (j.message || j.error)) || '获取音频详情失败')
    console.log('[api/audios] getAudioById response', j)
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
          console.log('[api/audios] getAudioById uni.request success', res)
          if(res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)){
            return reject(new Error('getAudioById request failed: ' + res.statusCode))
          }
          resolve(res.data)
        },
        fail(err){
          console.warn('[api/audios] getAudioById uni.request fail', err)
          reject(err)
        }
      })
    }catch(e){
      console.warn('[api/audios] getAudioById uni.request throw', e)
      reject(e)
    }
  })
}

// 增加音频播放次数
export async function incrementPlay(audioId){
  if(!audioId) {
    console.warn('[api/audios] incrementPlay: audioId is empty, skipping')
    return { success: false, message: '音频ID为空' }
  }
  
  // 尝试多个可能的接口路径
  const possibleUrls = [
    BASE + '/api/audios/' + encodeURIComponent(String(audioId)) + '/play',
    BASE + '/api/audios/' + encodeURIComponent(String(audioId)) + '/increment-play',
    BASE + '/api/audio/' + encodeURIComponent(String(audioId)) + '/play',
    BASE + '/api/play/' + encodeURIComponent(String(audioId))
  ]
  
  // 先尝试最常见的接口
  const url = possibleUrls[0]
  console.log('[api/audios] incrementPlay', url, 'audioId:', audioId)

  // 如果 fetch 可用则使用 fetch，否则使用 uni.request
  if (typeof fetch === 'function'){
    try {
      const res = await fetch(url, { method: 'POST', headers: buildHeaders() })
      let j = null
      try{ j = await res.json() }catch(e){ 
        // 如果解析失败但状态码是 2xx，认为成功
        if(res.ok) {
          console.log('[api/audios] incrementPlay success (no response body)')
          return { success: true }
        }
        console.warn('[api/audios] incrementPlay parse json failed', e) 
      }
      if(!res.ok) {
        // 如果第一个接口失败，尝试其他接口（可选，但通常不需要）
        console.warn('[api/audios] incrementPlay failed:', res.status, j)
        return { success: false, message: j?.message || j?.error || '增加播放次数失败' }
      }
      console.log('[api/audios] incrementPlay response', j)
      return j || { success: true }
    } catch(e) {
      // 网络错误等，静默失败（不影响播放功能）
      console.warn('[api/audios] incrementPlay network error (silent fail):', e)
      return { success: false, message: e.message }
    }
  }

  // fallback to uni.request for WeChat mini program environment
  return new Promise((resolve) => {
    try{
      uni.request({
        url,
        method: 'POST',
        header: buildHeaders(),
        success(res){
          console.log('[api/audios] incrementPlay uni.request success', res)
          if(res && res.statusCode && (res.statusCode >= 200 && res.statusCode < 300)){
            resolve(res.data || { success: true })
          } else {
            console.warn('[api/audios] incrementPlay uni.request failed:', res.statusCode)
            resolve({ success: false, message: res.data?.message || res.data?.error || '增加播放次数失败' })
          }
        },
        fail(err){
          // 静默失败，不影响播放功能
          console.warn('[api/audios] incrementPlay uni.request fail (silent):', err)
          resolve({ success: false, message: err.message || '网络错误' })
        }
      })
    }catch(e){
      console.warn('[api/audios] incrementPlay uni.request throw (silent):', e)
      resolve({ success: false, message: e.message })
    }
  })
}
