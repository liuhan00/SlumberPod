import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.162:3003'

function buildHeaders(){
  const auth = getAuthLocal()
  const t = auth?.token || auth?.access_token || null
  const headers = { 'Content-Type': 'application/json' }
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

// 获取白噪音热门搜索: GET /api/search/hot
export async function getHotSearch(){
  const url = BASE + '/api/search/hot'
  console.log('[noiseSearch] GET hot search', url)

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'GET', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) throw new Error(j?.message || j?.error || 'get hot search failed')
    return j ?? []
  }

  return await new Promise((resolve, reject)=>{
    try{
      uni.request({ url, method:'GET', header: buildHeaders(), success(r){ resolve(r.data) }, fail(err){ reject(err) } })
    }catch(e){ reject(e) }
  })
}

// 记录白噪音搜索行为: POST /api/search
export async function recordSearch(query){
  const url = BASE + '/api/search'
  console.log('[noiseSearch] POST record search', url, query)

  const body = JSON.stringify({ keyword: query })

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'POST', headers: buildHeaders(), body })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) throw new Error(j?.message || j?.error || 'record search failed')
    return j ?? {}
  }

  // 构建包含Content-Type的headers
  const headers = buildHeaders()
  headers['Content-Type'] = 'application/json'
  
  // 将数据序列化为JSON字符串
  const data = JSON.stringify({ keyword: query })
  
  return await new Promise((resolve, reject)=>{
    try{
      uni.request({ url, method:'POST', header: headers, data: data, success(r){ resolve(r.data) }, fail(err){ reject(err) } })
    }catch(e){ reject(e) }
  })
}

// 获取白噪音用户搜索历史: GET /api/search
export async function getSearchHistory(){
  const url = BASE + '/api/search'
  console.log('[noiseSearch] GET search history', url)

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'GET', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) throw new Error(j?.message || j?.error || 'get search history failed')
    return j ?? []
  }

  const headers = buildHeaders()
  headers['Content-Type'] = 'application/json'
  
  return await new Promise((resolve, reject)=>{
    try{
      uni.request({ url, method:'GET', header: headers, success(r){ resolve(r.data) }, fail(err){ reject(err) } })
    }catch(e){ reject(e) }
  })
}

// 白噪音搜索: GET /api/audios/search?keyword=&limit=&offset=
export async function searchNoises({ keyword, limit = 20, offset = 0 } = {}){
  if(!keyword || !keyword.trim()) throw new Error('搜索关键词不能为空')
  
  const pairs = []
  pairs.push('keyword=' + encodeURIComponent(keyword.trim()))
  pairs.push('limit=' + encodeURIComponent(String(limit)))
  pairs.push('offset=' + encodeURIComponent(String(offset)))
  const q = '?' + pairs.join('&')
  const url = BASE + '/api/audios/search' + q
  console.log('[noiseSearch] search', url)

  // 如果 fetch 可用则使用 fetch，否则使用 uni.request
  if (typeof fetch === 'function'){
    const res = await fetch(url, { method: 'GET', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ console.warn('[noiseSearch] search parse json failed', e) }
    if(!res.ok) throw new Error((j && (j.message || j.error)) || 'search noises failed')
    console.log('[noiseSearch] search response', j)
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
          console.log('[noiseSearch] search uni.request success', res)
          if(res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)){
            return reject(new Error('search request failed: ' + res.statusCode))
          }
          resolve(res.data)
        },
        fail(err){
          console.warn('[noiseSearch] search uni.request fail', err)
          reject(err)
        }
      })
    }catch(e){
      console.warn('[noiseSearch] search uni.request throw', e)
      reject(e)
    }
  })
}

// 清空调音搜索历史: DELETE /api/search
export async function clearSearchHistory(){
  const url = BASE + '/api/search'
  console.log('[noiseSearch] DELETE clear search history', url)

  if (typeof fetch === 'function'){
    const res = await fetch(url, { method:'DELETE', headers: buildHeaders() })
    let j = null
    try{ j = await res.json() }catch(e){ j = null }
    if(!res.ok) throw new Error(j?.message || j?.error || 'clear search history failed')
    return j ?? {}
  }

  const headers = buildHeaders()
  headers['Content-Type'] = 'application/json'
  
  return await new Promise((resolve, reject)=>{
    try{
      uni.request({ url, method:'DELETE', header: headers, success(r){ resolve(r.data) }, fail(err){ reject(err) } })
    }catch(e){ reject(e) }
  })
}