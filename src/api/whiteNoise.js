import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env?.VITE_API_BASE || 'http://192.168.1.128:3003'

function buildHeaders(){
  const auth = getAuthLocal()
  const token = auth?.token || auth?.access_token || null
  const headers = { 'Content-Type': 'application/json' }
  if(token) headers.Authorization = `Bearer ${token}`
  return headers
}

function request({ url, method = 'GET', data }){
  return new Promise((resolve, reject) => {
    try{
      if (typeof fetch === 'function'){
        const opts = { method, headers: buildHeaders() }
        if(data) opts.body = JSON.stringify(data)
        fetch(url, opts).then(async (res)=>{
          let j = null
          try{ j = await res.json() }catch(e){ j = null }
          if(res.ok){ resolve(j || { status: res.status }) } else { reject(j || { message: `HTTP ${res.status}` }) }
        }).catch(err=> reject(err))
        return
      }
      uni.request({ url, method, data, header: buildHeaders(), success:(res)=>{
        const status = res.statusCode
        const body = res.data
        if(status>=200 && status<300){ resolve(body) } else { reject(body || { message: `HTTP ${status}` }) }
      }, fail:(err)=> reject(err || { message:'network error' }) })
    }catch(e){ reject(e) }
  })
}

// 记录白噪音组合播放：POST /api/audios/white-noise/record-play
// payload: { audio_ids: number[], mode?: 'single'|'mix', played_id?: number }
export async function recordWhiteNoisePlay({ audio_ids = [], mode = 'mix', played_id = null } = {}){
  const url = `${BASE}/api/audios/white-noise/record-play`
  const ids = (Array.isArray(audio_ids) ? audio_ids : []).filter(x=> x!=null).map(x=> Number(x)).slice(0,3)
  const payload = { audio_ids: ids, mode, ...(played_id!=null ? { played_id: Number(played_id) } : {}) }
  return await request({ url, method:'POST', data: payload })
}

// 获取组合播放历史：GET /api/audios/white-noise/history
export async function getWhiteNoiseHistory({ offset = 0, limit = 50 } = {}){
  const url = `${BASE}/api/audios/white-noise/history?offset=${encodeURIComponent(offset)}&limit=${encodeURIComponent(limit)}`
  const res = await request({ url, method:'GET' })
  // 兼容 { items } 或数组
  if(Array.isArray(res?.items)) return res.items
  if(Array.isArray(res?.data)) return res.data
  if(Array.isArray(res)) return res
  return []
}

// 收藏/取消收藏白噪音组合：POST /api/audios/white-noise/favorite
// payload: { audio_ids: number[], selected_audio_ids: number[], custom_name: string, action: 'toggle' }
// 注意：action 参数会被强制设置为 'toggle'，忽略传入的任何 action 值
//       支持 name 参数作为 custom_name 的别名
// audio_ids: 小色子功能中随机选择的三个音频ID
// selected_audio_ids: 用户当前选择播放的音频ID（应为audio_ids的子集）
export async function toggleFavoriteWhiteNoiseCombo(params = {}){
  const url = `${BASE}/api/audios/white-noise/favorite`
  
  // 提取参数，忽略不应传递的参数
  const { audio_ids = [], selected_audio_ids = [], custom_name = '', name = '', action, ...rest } = params;
  
  // 验证参数
  console.log('[toggleFavoriteWhiteNoiseCombo] 输入参数:', params)
  console.log('[toggleFavoriteWhiteNoiseCombo] 提取的参数:', { audio_ids, selected_audio_ids, custom_name, name, action, rest })
  
  // 验证 audio_ids 和 selected_audio_ids
  if (!Array.isArray(audio_ids)) {
    console.error('[toggleFavoriteWhiteNoiseCombo] audio_ids 不是数组:', audio_ids)
    throw new Error('audio_ids 必须是数组')
  }
  
  if (!Array.isArray(selected_audio_ids)) {
    console.error('[toggleFavoriteWhiteNoiseCombo] selected_audio_ids 不是数组:', selected_audio_ids)
    throw new Error('selected_audio_ids 必须是数组')
  }
  
  // 处理 audio_ids，确保它们是数字类型并且最多3个
  const numericAudioIds = (Array.isArray(audio_ids) ? audio_ids : [])
    .filter(x => x != null)
    .map(x => {
      const num = Number(x);
      return isNaN(num) ? 0 : num;
    })
    .filter(x => x > 0)
    .slice(0, 3); // 最多3个
    
  // 处理 selected_audio_ids，确保它们是数字类型
  const numericSelectedIds = (Array.isArray(selected_audio_ids) ? selected_audio_ids : [])
    .filter(x => x != null)
    .map(x => {
      const num = Number(x);
      return isNaN(num) ? 0 : num;
    })
    .filter(x => x > 0);
  
  console.log('[toggleFavoriteWhiteNoiseCombo] 处理后的数字ID:', { 
    audio_ids: numericAudioIds, 
    selected_audio_ids: numericSelectedIds 
  })
  
  // 验证处理后的 ID
  for (let i = 0; i < numericAudioIds.length; i++) {
    if (!Number.isInteger(numericAudioIds[i]) || numericAudioIds[i] <= 0) {
      console.error('[toggleFavoriteWhiteNoiseCombo] 发现无效的 audio_id:', numericAudioIds[i])
      throw new Error(`无效的 audio_id: ${numericAudioIds[i]}`)
    }
  }
  
  for (let i = 0; i < numericSelectedIds.length; i++) {
    if (!Number.isInteger(numericSelectedIds[i]) || numericSelectedIds[i] <= 0) {
      console.error('[toggleFavoriteWhiteNoiseCombo] 发现无效的 selected_audio_id:', numericSelectedIds[i])
      throw new Error(`无效的 selected_audio_id: ${numericSelectedIds[i]}`)
    }
  }
  
  // 特殊处理：如果 audio_ids 只有一个元素，尝试从其他地方获取更多ID
  // 这是为了处理当前 store.playlist 可能只有一个元素的情况
  if (numericAudioIds.length === 1 && numericSelectedIds.length === 1 && numericAudioIds[0] === numericSelectedIds[0]) {
    console.warn('[toggleFavoriteWhiteNoiseCombo] 检测到 audio_ids 只有一个元素且与 selected_audio_ids 相同，这可能不是预期的行为');
    // 在这种情况下，我们仍然发送数据，但记录警告
  }
  
  // 确保custom_name不是空字符串（兼容name参数）
  const finalCustomName = String(custom_name || name).trim() || '白噪音组合';
  
  // 验证 custom_name
  if (!finalCustomName || finalCustomName.length === 0) {
    console.error('[toggleFavoriteWhiteNoiseCombo] custom_name 为空')
    throw new Error('custom_name 不能为空')
  }
  
  // 构造最终的 payload，使用数字类型的 ID
  const payload = { 
    audio_ids: numericAudioIds, 
    selected_audio_ids: numericSelectedIds,
    custom_name: finalCustomName,
    action: 'toggle'  // 固定为toggle，忽略传入的action参数
  }
  
  console.log('[toggleFavoriteWhiteNoiseCombo] 最终发送的payload:', payload)
  console.log('[toggleFavoriteWhiteNoiseCombo] payload各字段类型:', {
    audio_ids_type: typeof payload.audio_ids,
    selected_audio_ids_type: typeof payload.selected_audio_ids,
    custom_name_type: typeof payload.custom_name,
    action_type: typeof payload.action,
    audio_ids_elements_type: payload.audio_ids.map(id => typeof id),
    selected_audio_ids_elements_type: payload.selected_audio_ids.map(id => typeof id)
  })
  
  // 额外验证 payload
  if (!Array.isArray(payload.audio_ids) || payload.audio_ids.length === 0) {
    console.error('[toggleFavoriteWhiteNoiseCombo] 最终 payload 中 audio_ids 无效:', payload.audio_ids)
    throw new Error('audio_ids 不能为空数组')
  }
  
  if (!Array.isArray(payload.selected_audio_ids)) {
    console.error('[toggleFavoriteWhiteNoiseCombo] 最终 payload 中 selected_audio_ids 无效:', payload.selected_audio_ids)
    throw new Error('selected_audio_ids 必须是数组')
  }
  
  // 确保 selected_audio_ids 是 audio_ids 的子集（只有当两个数组都不为空时才检查）
  if (payload.audio_ids.length > 0 && payload.selected_audio_ids.length > 0) {
    const audioIdSet = new Set(payload.audio_ids);
    for (const selectedId of payload.selected_audio_ids) {
      if (!audioIdSet.has(selectedId)) {
        console.error('[toggleFavoriteWhiteNoiseCombo] selected_audio_id 不在 audio_ids 中:', { selectedId, audio_ids: payload.audio_ids })
        throw new Error(`selected_audio_id ${selectedId} 不在 audio_ids 中`)
      }
    }
  }
  
  try {
    const result = await request({ url, method:'POST', data: payload })
    console.log('[toggleFavoriteWhiteNoiseCombo] Success result:', result)
    return result
  } catch (error) {
    console.error('[toggleFavoriteWhiteNoiseCombo] Error:', error)
    
    // 检查是否是502错误，如果是则提供更有意义的错误信息
    if (error.message && error.message.includes('502')) {
      throw new Error('服务器暂时不可用，请稍后再试')
    }
    
    // 重新抛出错误，以便调用者可以处理
    throw error
  }
}

// 获取用户收藏的白噪音组合列表：GET /api/audios/white-noise/favorites
export async function listWhiteNoiseFavorites({ offset = 0, limit = 100 } = {}){
  const url = `${BASE}/api/audios/white-noise/favorites?offset=${encodeURIComponent(offset)}&limit=${encodeURIComponent(limit)}`
  const res = await request({ url, method:'GET' })
  if(Array.isArray(res?.items)) return res.items
  if(Array.isArray(res?.data)) return res.data
  if(Array.isArray(res)) return res
  return []
}
