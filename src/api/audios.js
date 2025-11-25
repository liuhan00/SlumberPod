import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.150:3003'

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

// 更新音频记录
export async function updateAudioById(audioId, { title, description, coverUrl, durationSeconds, categoryIds, isPublic, isFree } = {}){
  if(!audioId) throw new Error('audioId is required')
  
  const payload = {}
  if(title !== undefined) payload['title'] = String(title).trim()
  if(description !== undefined) payload['description'] = String(description)
  if(coverUrl !== undefined) payload['cover url'] = String(coverUrl).trim()
  if(durationSeconds !== undefined) payload['duration seconds'] = Number(durationSeconds) || 0
  if(categoryIds !== undefined) payload['category ids'] = Array.isArray(categoryIds) ? categoryIds : (categoryIds != null ? [categoryIds] : [])
  if(isPublic !== undefined) payload['is public'] = isPublic ? 1 : 0
  if(isFree !== undefined) payload['is free'] = isFree ? 1 : 0
  
  const url = BASE + `/api/creations/${audioId}`
  const headers = Object.assign({ 'Content-Type': 'application/x-www-form-urlencoded' }, buildHeaders())
  
  function toUrlEncoded(obj){
    return Object.keys(obj)
      .filter(k => obj[k] !== undefined && obj[k] !== null)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(Array.isArray(obj[k]) ? obj[k].join(',') : String(obj[k]))}`)
      .join('&')
  }
  const bodyStr = toUrlEncoded(payload)
  
  console.log('[api/audios] updateAudioById 请求参数:', payload)
  
  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'PUT', headers, body: bodyStr })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) {
      const errorMsg = j?.message || j?.error || `更新音频失败 (HTTP ${res.status})`
      // 检查是否是后端 bug（同时检查 message 和 error 字段）
      const errorDetail = j?.error || j?.message || ''
      const isBackendBug = res.status === 500 && (
        errorDetail.includes('AudioModel.getAudioById') ||
        errorDetail.includes('is not a function') ||
        errorMsg.includes('AudioModel.getAudioById') ||
        errorMsg.includes('is not a function')
      )
      
      if(isBackendBug) {
        // 创建一个特殊的错误对象，标记为后端 bug
        const bugError = new Error('后端更新接口暂时不可用')
        bugError.isBackendBug = true
        bugError.originalError = errorDetail || errorMsg
        bugError.statusCode = res.status
        throw bugError
      }
      
      console.error('[api/audios] updateAudioById 失败:', errorMsg, j)
      throw new Error(errorMsg)
    }
    return j || {}
  }
  
  // 小程序分支
  return await new Promise((resolve, reject)=>{
    try{
      const requestData = {}
      Object.keys(payload).forEach(k => {
        const v = payload[k]
        if(Array.isArray(v)) {
          requestData[k] = v.join(',')
        } else if(v !== undefined && v !== null) {
          requestData[k] = String(v)
        }
      })
      
      uni.request({ 
        url, 
        method:'PUT', 
        header: headers, 
        data: requestData,
        dataType: 'json',
        success(r){
          if(r.statusCode >= 200 && r.statusCode < 300){ 
            resolve(r.data) 
          } else { 
            let errorMsg = r.data?.message || r.data?.error || '更新音频失败'
            // 检查是否是后端 bug（同时检查 message 和 error 字段）
            const errorDetail = r.data?.error || r.data?.message || ''
            const isBackendBug = r.statusCode === 500 && (
              errorDetail.includes('AudioModel.getAudioById') ||
              errorDetail.includes('is not a function') ||
              errorMsg.includes('AudioModel.getAudioById') ||
              errorMsg.includes('is not a function')
            )
            
            if(isBackendBug) {
              // 创建一个特殊的错误对象，标记为后端 bug
              const bugError = new Error('后端更新接口暂时不可用')
              bugError.isBackendBug = true
              bugError.originalError = errorDetail || errorMsg
              bugError.statusCode = r.statusCode
              reject(bugError)
              return
            }
            
            if(r.statusCode === 401) {
              errorMsg = '认证失败，请重新登录'
            }
            console.error('[api/audios] updateAudioById 失败:', errorMsg, r.data)
            reject(new Error(errorMsg))
          }
        }, 
        fail(err){ 
          console.error('[api/audios] updateAudioById 请求失败:', err)
          reject(new Error(err.errMsg || err.message || '网络请求失败'))
        } 
      })
    }catch(e){ 
      console.error('[api/audios] updateAudioById 异常:', e)
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

  console.log('[api/audios] createAudioByUrl 请求参数:', payload)
  console.log('[api/audios] createAudioByUrl URL编码后的body:', bodyStr)

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'POST', headers, body: bodyStr })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) {
      const errorMsg = j?.message || j?.error || `创建音频失败 (HTTP ${res.status})`
      console.error('[api/audios] createAudioByUrl 失败:', errorMsg, j)
      throw new Error(errorMsg)
    }
    return j || {}
  }

  // 小程序分支
  // 问题：uni.request 在处理带空格的字段名时，自动编码可能不正确
  // 根据测试，uni.request 的 data 如果是字符串，在微信小程序中可能不会被正确处理
  // 解决方案：使用对象，但需要确保字段名和值正确传递
  // 注意：JavaScript 对象的键名可以包含空格，uni.request 应该能正确处理
  return await new Promise((resolve, reject)=>{
    try{
      console.log('[api/audios] createAudioByUrl 小程序请求:', url)
      console.log('[api/audios] createAudioByUrl headers:', headers)
      console.log('[api/audios] createAudioByUrl payload对象:', payload)
      console.log('[api/audios] createAudioByUrl URL编码字符串:', bodyStr)
      
      // 构建请求数据对象，确保所有字段都被正确设置
      // 对于数组字段，转换为逗号分隔的字符串（与 toUrlEncoded 保持一致）
      const requestData = {}
      Object.keys(payload).forEach(k => {
        const v = payload[k]
        if(Array.isArray(v)) {
          requestData[k] = v.join(',')
        } else if(v !== undefined && v !== null) {
          requestData[k] = String(v)
        }
      })
      
      console.log('[api/audios] createAudioByUrl requestData:', requestData)
      console.log('[api/audios] createAudioByUrl requestData keys:', Object.keys(requestData))
      console.log('[api/audios] createAudioByUrl requestData values:', Object.values(requestData))
      
      // 关键修复：在微信小程序中，uni.request/wx.request 的 data 参数处理有问题
      // 1. 如果 data 是字符串，可能不会被正确发送（请求体为空）
      // 2. 如果 data 是对象且 Content-Type 是 application/x-www-form-urlencoded，不会自动转换
      // 解决方案：尝试使用对象格式，但需要手动将对象转换为 URL 编码字符串
      // 由于微信小程序限制，我们需要使用特殊方法
      
      // 检查是否可以使用 wx.request（微信小程序原生 API）
      if(typeof wx !== 'undefined' && wx.request) {
        // 在微信小程序中，wx.request 的 data 参数如果是字符串，可能不会被正确发送
        // 我们需要使用对象格式，但需要确保后端能够正确解析
        // 尝试：将 Content-Type 改为 application/json，使用对象格式
        // 如果后端不支持 JSON，再回退到 URL 编码格式
        
        // 先尝试 JSON 格式（如果后端支持）
        const jsonHeaders = Object.assign({ 'Content-Type': 'application/json' }, buildHeaders())
        const jsonPayload = {
          title: payload['title'],
          description: payload['description'],
          'audio url': payload['audio url'],
          'cover url': payload['cover url'],
          'duration seconds': payload['duration seconds'],
          'category ids': payload['category ids'],
          'is public': payload['is public'],
          'is free': payload['is free']
        }
        
        console.log('[api/audios] createAudioByUrl 尝试 JSON 格式:', jsonPayload)
        
        wx.request({
          url,
          method: 'POST',
          header: jsonHeaders,
          data: jsonPayload,  // 使用对象格式（JSON）
          dataType: 'json',
          success(r) {
            console.log('[api/audios] createAudioByUrl wx.request 响应状态码:', r.statusCode)
            console.log('[api/audios] createAudioByUrl wx.request 响应数据:', r.data)
            
            if(r.statusCode >= 200 && r.statusCode < 300){ 
              resolve(r.data) 
            } else { 
              let errorMsg = '创建音频失败'
              if(r.data) {
                if(typeof r.data === 'string') {
                  try {
                    const errorObj = JSON.parse(r.data)
                    errorMsg = errorObj?.message || errorObj?.error || errorMsg
                  } catch(_) {
                    errorMsg = r.data
                  }
                } else {
                  errorMsg = r.data?.message || r.data?.error || errorMsg
                }
              }
              if(r.statusCode === 400) {
                // 如果 JSON 格式失败，尝试回退到 URL 编码格式
                console.log('[api/audios] createAudioByUrl JSON 格式失败，尝试 URL 编码格式')
                
                // 使用 URL 编码格式，但使用对象格式（让 wx.request 自动处理）
                wx.request({
                  url,
                  method: 'POST',
                  header: headers,  // 使用原始的 application/x-www-form-urlencoded headers
                  data: requestData,  // 使用对象格式
                  dataType: 'json',
                  success(r2) {
                    console.log('[api/audios] createAudioByUrl URL编码格式 响应状态码:', r2.statusCode)
                    console.log('[api/audios] createAudioByUrl URL编码格式 响应数据:', r2.data)
                    
                    if(r2.statusCode >= 200 && r2.statusCode < 300){ 
                      resolve(r2.data) 
                    } else { 
                      let errorMsg2 = '创建音频失败'
                      if(r2.data) {
                        if(typeof r2.data === 'string') {
                          try {
                            const errorObj2 = JSON.parse(r2.data)
                            errorMsg2 = errorObj2?.message || errorObj2?.error || errorMsg2
                          } catch(_) {
                            errorMsg2 = r2.data
                          }
                        } else {
                          errorMsg2 = r2.data?.message || r2.data?.error || errorMsg2
                        }
                      }
                      if(r2.statusCode === 400) {
                        errorMsg2 = `请求参数错误 (400): ${errorMsg2}。请检查：1) 字段名是否正确 2) 字段类型是否匹配 3) 必填字段是否完整`
                      } else if(r2.statusCode === 401) {
                        errorMsg2 = '认证失败，请重新登录'
                      }
                      console.error('[api/audios] createAudioByUrl URL编码格式 失败:', errorMsg2, r2.data)
                      reject(new Error(errorMsg2))
                    }
                  },
                  fail(err2) {
                    console.error('[api/audios] createAudioByUrl URL编码格式 请求失败:', err2)
                    reject(new Error(errorMsg))
                  }
                })
                return
              } else if(r.statusCode === 401) {
                errorMsg = '认证失败，请重新登录'
              }
              console.error('[api/audios] createAudioByUrl 失败:', errorMsg, r.data)
              reject(new Error(errorMsg))
            }
          },
          fail(err) {
            console.error('[api/audios] createAudioByUrl wx.request 请求失败:', err)
            let errorMsg = err.errMsg || err.message || '网络请求失败'
            if(String(errorMsg).includes('timeout') || String(errorMsg).includes('超时')) {
              errorMsg = '请求超时，请检查网络连接'
            }
            reject(new Error(errorMsg))
          }
        })
        return
      }
      
      // 降级方案：使用 uni.request，尝试对象格式
      // 注意：这可能不会正确工作，因为 uni.request 可能不会将对象转换为 URL 编码格式
      uni.request({ 
        url, 
        method:'POST', 
        header: headers, 
        data: requestData,  // 使用对象格式
        dataType: 'json',
        success(r){
          console.log('[api/audios] createAudioByUrl 响应状态码:', r.statusCode)
          console.log('[api/audios] createAudioByUrl 响应数据:', r.data)
          console.log('[api/audios] createAudioByUrl 响应头:', r.header)
          
          if(r.statusCode >= 200 && r.statusCode < 300){ 
            resolve(r.data) 
          } else { 
            let errorMsg = '创建音频失败'
            if(r.data) {
              if(typeof r.data === 'string') {
                try {
                  const errorObj = JSON.parse(r.data)
                  errorMsg = errorObj?.message || errorObj?.error || errorMsg
                } catch(_) {
                  errorMsg = r.data
                }
              } else {
                errorMsg = r.data?.message || r.data?.error || errorMsg
              }
            }
            if(r.statusCode === 400) {
              errorMsg = `请求参数错误 (400): ${errorMsg}。请检查：1) 字段名是否正确 2) 字段类型是否匹配 3) 必填字段是否完整`
            } else if(r.statusCode === 401) {
              errorMsg = '认证失败，请重新登录'
            }
            console.error('[api/audios] createAudioByUrl 失败:', errorMsg, r.data)
            reject(new Error(errorMsg))
          }
        }, 
        fail(err){ 
          console.error('[api/audios] createAudioByUrl 请求失败:', err)
          let errorMsg = err.errMsg || err.message || '网络请求失败'
          if(String(errorMsg).includes('timeout') || String(errorMsg).includes('超时')) {
            errorMsg = '请求超时，请检查网络连接'
          }
          reject(new Error(errorMsg))
        } 
      })
    }catch(e){ 
      console.error('[api/audios] createAudioByUrl 异常:', e)
      reject(e) 
    }
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
        // uni.uploadFile 会自动设置 Content-Type，所以移除它避免冲突
        delete headers['Content-Type']
        delete headers['content-type']
        
        // 获取文件路径
        let filePath = file
        if(typeof file === 'object'){
          filePath = file.tempFilePath || file.path || file.uri || file.url || ''
        }
        
        if(!filePath) {
          return reject(new Error('文件路径为空，请重新选择文件'))
        }
        
        console.log('[api/audios] uploadAudioToStorage 上传到 /api/audio/upload')
        console.log('[api/audios] filePath:', filePath)
        console.log('[api/audios] title:', title)
        console.log('[api/audios] headers:', headers)
        
        // 第一步：上传到 /api/audio/upload
        // 尝试多个可能的文件字段名：'file' 和 'audio'
        const fileFieldNames = ['file', 'audio']
        
        const tryUpload = (fieldName, fieldIndex) => {
          uni.uploadFile({
            url: BASE + '/api/audio/upload',
            filePath: filePath,
            name: fieldName,
            fileType: 'audio',
            timeout: 120000, // 增加超时时间到 120 秒
            formData: {
              title: String(title).trim(),
              ...(description ? { description: String(description).trim() } : {}),
              ...(coverUrl ? { 'cover url': String(coverUrl).trim() } : {}),
              ...(durationSeconds ? { 'duration seconds': String(durationSeconds) } : {}),
              ...(categoryIds && categoryIds.length > 0 ? { 'category ids': Array.isArray(categoryIds) ? categoryIds.join(',') : String(categoryIds) } : {}),
              'is public': isPublic ? '1' : '0',
              'is free': isFree ? '1' : '0'
            },
            header: headers,
            success(uploadRes) {
              console.log('[api/audios] uploadAudioToStorage 响应状态码:', uploadRes.statusCode)
              console.log('[api/audios] uploadAudioToStorage 响应数据:', uploadRes.data)
              
              try {
                let uploadData = uploadRes.data
                if(typeof uploadData === 'string') {
                  try {
                    uploadData = JSON.parse(uploadData)
                  } catch(parseErr) {
                    console.warn('[api/audios] uploadAudioToStorage 解析响应失败', parseErr, '原始数据:', uploadData)
                    // 如果解析失败但状态码是 2xx，尝试直接使用原始数据
                    if(uploadRes.statusCode >= 200 && uploadRes.statusCode < 300){
                      uploadData = { raw: uploadRes.data }
                    } else {
                      // 尝试提取错误信息
                      let errorMsg = '上传失败'
                      try {
                        const errorObj = JSON.parse(uploadData)
                        errorMsg = errorObj?.message || errorObj?.error || errorMsg
                      } catch(_) {
                        if(uploadData && typeof uploadData === 'string') {
                          errorMsg = uploadData
                        }
                      }
                      return reject(new Error(`上传失败 (${uploadRes.statusCode}): ${errorMsg}`))
                    }
                  }
                }
                
                if(uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
                  // 检查后端是否已经创建了音频记录（通过 audio_id 判断）
                  const audioId = uploadData?.data?.audio_id || uploadData?.audio_id
                  
                  if(audioId) {
                    // 后端已经自动创建了记录，检查 title 是否正确
                    console.log('[api/audios] uploadAudioToStorage 后端已自动创建记录，audio_id:', audioId)
                    const audioUrl = extractAudioUrl(uploadData)
                    const returnedTitle = uploadData?.data?.title || uploadData?.title || ''
                    const expectedTitle = String(title).trim()
                    
                    // 检查 title 是否需要更新（如果返回的 title 是文件名、为空或与期望的不一致）
                    const needsUpdate = !returnedTitle || 
                                       returnedTitle !== expectedTitle ||
                                       /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(returnedTitle) // 文件名格式
                    
                    if(needsUpdate && expectedTitle) {
                      console.log('[api/audios] uploadAudioToStorage 检测到 title 不正确，尝试更新:', {
                        returned: returnedTitle,
                        expected: expectedTitle
                      })
                      
                      // 尝试更新 title 和其他字段
                      updateAudioById(audioId, {
                        title: expectedTitle,
                        description: description || '',
                        coverUrl: coverUrl || '',
                        durationSeconds: durationSeconds || 0,
                        categoryIds: Array.isArray(categoryIds) ? categoryIds : (categoryIds ? [categoryIds] : []),
                        isPublic: isPublic ? 1 : 0,
                        isFree: isFree ? 1 : 0
                      }).then(updateResult => {
                        console.log('[api/audios] uploadAudioToStorage 更新 title 成功', updateResult)
                        resolve({
                          success: true,
                          message: uploadData?.message || '上传成功',
                          data: {
                            id: audioId,
                            audio_id: audioId,
                            title: expectedTitle,
                            ...updateResult?.data,
                            ...uploadData?.data
                          },
                          upload: uploadData,
                          audioUrl: audioUrl || ''
                        })
                      }).catch(updateErr => {
                        // 检查是否是后端 bug（通过 isBackendBug 标记或错误消息）
                        const isBackendBug = updateErr.isBackendBug || (
                          updateErr.message && (
                            updateErr.message.includes('AudioModel.getAudioById') ||
                            updateErr.message.includes('is not a function') ||
                            (updateErr.message.includes('500') && updateErr.message.includes('后端'))
                          )
                        )
                        
                        if(isBackendBug) {
                          // 静默处理后端 bug，只记录警告（不显示错误）
                          console.warn('[api/audios] uploadAudioToStorage 后端更新接口有 bug，跳过更新（文件已上传成功）')
                          // 不显示详细错误信息，避免用户看到技术细节
                        } else {
                          // 其他错误仍然记录警告
                          console.warn('[api/audios] uploadAudioToStorage 更新 title 失败，但上传已成功', updateErr)
                        }
                        
                        // 即使更新失败，也返回成功（因为文件已上传）
                        // 注意：如果后端在上传时已经接收了 title 参数，可能不需要更新
                        resolve({
                          success: true,
                          message: uploadData?.message || '上传成功',
                          data: {
                            id: audioId,
                            audio_id: audioId,
                            title: expectedTitle, // 使用期望的 title，即使更新失败
                            ...uploadData?.data
                          },
                          upload: uploadData,
                          audioUrl: audioUrl || '',
                          // 只在非后端 bug 的情况下显示更新错误
                          ...(isBackendBug ? {} : { updateError: updateErr.message }),
                          needsManualFix: isBackendBug // 标记需要手动修复
                        })
                      })
                    } else {
                      // title 正确，直接返回成功
                      resolve({
                        success: true,
                        message: uploadData?.message || '上传成功',
                        data: {
                          id: audioId,
                          audio_id: audioId,
                          ...uploadData?.data
                        },
                        upload: uploadData,
                        audioUrl: audioUrl || ''
                      })
                    }
                    return
                  }
                  
                  // 提取音频 URL
                  const audioUrl = extractAudioUrl(uploadData)
                  console.log('[api/audios] uploadAudioToStorage 提取的音频URL:', audioUrl)
                  
                  if(!audioUrl) {
                    console.warn('[api/audios] uploadAudioToStorage 无法从响应中提取音频URL，响应:', uploadData)
                    return reject(new Error('上传成功但无法获取音频URL，请检查后端返回格式。响应: ' + JSON.stringify(uploadData)))
                  }
                  
                  // 第二步：调用 createAudioByUrl 创建音频记录（仅当后端未自动创建时）
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
                  // 如果状态码不是 2xx，尝试下一个字段名
                  if(fieldIndex < fileFieldNames.length - 1 && uploadRes.statusCode >= 400) {
                    const nextIndex = fieldIndex + 1
                    console.log(`[api/audios] 尝试使用字段名: ${fileFieldNames[nextIndex]}`)
                    return tryUpload(fileFieldNames[nextIndex], nextIndex)
                  }
                  
                  // 所有字段名都尝试过了，返回错误
                  let errorMsg = uploadData?.message || uploadData?.error || `上传失败 (HTTP ${uploadRes.statusCode})`
                  if(uploadRes.statusCode === 401 || String(errorMsg).includes('未授权') || String(errorMsg).includes('token')) {
                    errorMsg = '认证失败，请重新登录'
                  } else if(uploadRes.statusCode === 500) {
                    errorMsg = `服务器内部错误 (500)。请检查：1) 文件格式是否正确 2) 文件大小是否超限 3) 服务器日志。响应: ${JSON.stringify(uploadData)}`
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
              // 如果是网络错误，尝试下一个字段名
              if(fieldIndex < fileFieldNames.length - 1) {
                const nextIndex = fieldIndex + 1
                console.log(`[api/audios] 网络错误，尝试使用字段名: ${fileFieldNames[nextIndex]}`)
                return tryUpload(fileFieldNames[nextIndex], nextIndex)
              }
              
              let errorMsg = err.errMsg || err.message || '上传失败'
              if(String(errorMsg).includes('timeout') || String(errorMsg).includes('超时')) {
                errorMsg = '上传超时，请检查网络连接或尝试较小的文件'
              } else if(String(errorMsg).includes('fail') && String(errorMsg).includes('500')) {
                errorMsg = '服务器内部错误 (500)，请稍后重试或联系管理员'
              }
              reject(new Error(errorMsg))
            }
          })
        }
        
        // 开始尝试上传，先使用第一个字段名
        tryUpload(fileFieldNames[0], 0)
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
  if(coverUrl) fd.append('cover url', String(coverUrl).trim())
  if(durationSeconds) fd.append('duration seconds', String(durationSeconds))
  if(categoryIds && categoryIds.length > 0) {
    fd.append('category ids', Array.isArray(categoryIds) ? categoryIds.join(',') : String(categoryIds))
  }
  fd.append('is public', isPublic ? '1' : '0')
  fd.append('is free', isFree ? '1' : '0')
  
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
    
    // 检查后端是否已经创建了音频记录（通过 audio_id 判断）
    const audioId = uploadData?.data?.audio_id || uploadData?.audio_id
    
    if(audioId) {
      // 后端已经自动创建了记录，检查 title 是否正确
      console.log('[api/audios] uploadAudioToStorage 后端已自动创建记录 (Web)，audio_id:', audioId)
      const audioUrl = extractAudioUrl(uploadData)
      const returnedTitle = uploadData?.data?.title || uploadData?.title || ''
      const expectedTitle = String(title).trim()
      
      // 检查 title 是否需要更新（如果返回的 title 是文件名、为空或与期望的不一致）
      const needsUpdate = !returnedTitle || 
                         returnedTitle !== expectedTitle ||
                         /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(returnedTitle) // 文件名格式
      
      if(needsUpdate && expectedTitle) {
        console.log('[api/audios] uploadAudioToStorage 检测到 title 不正确，尝试更新 (Web):', {
          returned: returnedTitle,
          expected: expectedTitle
        })
        
        try {
          // 尝试更新 title 和其他字段
          const updateResult = await updateAudioById(audioId, {
            title: expectedTitle,
            description: description || '',
            coverUrl: coverUrl || '',
            durationSeconds: durationSeconds || 0,
            categoryIds: Array.isArray(categoryIds) ? categoryIds : (categoryIds ? [categoryIds] : []),
            isPublic: isPublic ? 1 : 0,
            isFree: isFree ? 1 : 0
          })
          
          console.log('[api/audios] uploadAudioToStorage 更新 title 成功 (Web)', updateResult)
          return {
            success: true,
            message: uploadData?.message || '上传成功',
            data: {
              id: audioId,
              audio_id: audioId,
              title: expectedTitle,
              ...updateResult?.data,
              ...uploadData?.data
            },
            upload: uploadData,
            audioUrl: audioUrl || ''
          }
        } catch(updateErr) {
          // 检查是否是后端 bug（通过 isBackendBug 标记或错误消息）
          const isBackendBug = updateErr.isBackendBug || (
            updateErr.message && (
              updateErr.message.includes('AudioModel.getAudioById') ||
              updateErr.message.includes('is not a function') ||
              (updateErr.message.includes('500') && updateErr.message.includes('后端'))
            )
          )
          
          if(isBackendBug) {
            // 静默处理后端 bug，只记录警告（不显示错误）
            console.warn('[api/audios] uploadAudioToStorage 后端更新接口有 bug，跳过更新（文件已上传成功）(Web)')
            // 不显示详细错误信息，避免用户看到技术细节
          } else {
            // 其他错误仍然记录警告
            console.warn('[api/audios] uploadAudioToStorage 更新 title 失败，但上传已成功 (Web)', updateErr)
          }
          
          // 即使更新失败，也返回成功（因为文件已上传）
          // 注意：如果后端在上传时已经接收了 title 参数，可能不需要更新
          return {
            success: true,
            message: uploadData?.message || '上传成功',
            data: {
              id: audioId,
              audio_id: audioId,
              title: expectedTitle, // 使用期望的 title，即使更新失败
              ...uploadData?.data
            },
            upload: uploadData,
            audioUrl: audioUrl || '',
            // 只在非后端 bug 的情况下显示更新错误
            ...(isBackendBug ? {} : { updateError: updateErr.message }),
            needsManualFix: isBackendBug // 标记需要手动修复
          }
        }
      } else {
        // title 正确，直接返回成功
        return {
          success: true,
          message: uploadData?.message || '上传成功',
          data: {
            id: audioId,
            audio_id: audioId,
            ...uploadData?.data
          },
          upload: uploadData,
          audioUrl: audioUrl || ''
        }
      }
    }
    
    // 提取音频 URL
    const audioUrl = extractAudioUrl(uploadData)
    console.log('[api/audios] uploadAudioToStorage 提取的音频URL:', audioUrl)
    
    if(!audioUrl) {
      throw new Error('上传成功但无法获取音频URL，请检查后端返回格式')
    }
    
    // 第二步：调用 createAudioByUrl 创建音频记录（仅当后端未自动创建时）
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
