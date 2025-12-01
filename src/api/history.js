import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.123:3003'

function buildHeaders(){
  const auth = getAuthLocal && getAuthLocal()
  const t = auth?.token || auth?.access_token || null
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

// GET /api/play-history?page=&limit=
export async function getPlayHistory({ page = 1, limit = 100 } = {}){
  const qs = `?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`
  const url = `${BASE}/api/play-history${qs}`
  // use fetch if available; otherwise fallback to uni.request
  if (typeof fetch === 'function'){
    const res = await fetch(url, { method: 'GET', headers: buildHeaders() })
    if (res.status === 304) return []
    if (res.status === 404) return []
    let data
    try { data = await res.json() } catch(e){ data = null }
    if (!res.ok){
      const msg = data?.message || data?.error || `fetch play history failed: ${res.status}`
      throw new Error(msg)
    }
    return data?.data || data?.items || data || []
  }
  // uniapp fallback
  return await new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      header: buildHeaders(),
      success(r){
        const ok = r.statusCode >= 200 && r.statusCode < 300
        if(!ok){
          const msg = r.data?.message || r.data?.error || `fetch play history failed: ${r.statusCode}`
          reject(new Error(msg))
          return
        }
        resolve(r.data?.data || r.data?.items || r.data || [])
      },
      fail(err){ reject(err) }
    })
  })
}


// POST /api/play-history
export async function addPlayHistory({ audio_id, play_duration = 0 } = {}){
  if (audio_id === undefined || audio_id === null || (typeof audio_id === 'string' && audio_id.trim() === '')) {
    throw new Error('audio_id is required')
  }
  const url = `${BASE}/api/play-history`
  const payload = { audio_id, play_duration }

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) })
    let data = null
    try { data = await res.json() } catch(e){ data = null }
    if (!res.ok){
      const msg = data?.message || data?.error || `add play history failed: ${res.status}`
      throw new Error(msg)
    }
    return data ?? {}
  }

  // uniapp fallback
  return await new Promise((resolve, reject) => {
    try{
      uni.request({
        url,
        method: 'POST',
        header: buildHeaders(),
        data: payload,
        success(r){
          const ok = r.statusCode >= 200 && r.statusCode < 300
          if(!ok){
            const msg = r.data?.message || r.data?.error || `add play history failed: ${r.statusCode}`
            reject(new Error(msg))
            return
          }
          resolve(r.data ?? {})
        },
        fail(err){ reject(err) }
      })
    }catch(e){ reject(e) }
  })
}

