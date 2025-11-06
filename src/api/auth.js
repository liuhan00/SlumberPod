// Unified auth API with platform-specific branches
import { saveAuthLocal, clearAuthLocal, applySession } from '@/store/auth'

const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.90.92:3003'

async function httpFetch(path, opts = {}){
  const url = BASE + path
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject)=>{
    uni.request({
      url,
      method: opts.method || 'GET',
      header: Object.assign({'Content-Type':'application/json'}, opts.headers || {}),
      data: opts.body ? JSON.parse(opts.body) : undefined,
      success: (res) => {
        // uni.request returns { statusCode, data }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: async ()=> res.data })
      },
      fail: (err) => reject(err)
    })
  })
  // #endif

  // #ifndef MP-WEIXIN
  return fetch(url, opts)
  // #endif
}

export async function register({ username, email, password }){
  const res = await httpFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) })
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || j.error || 'register failed')
  if(j.token) applySession({ user: j.user, access_token: j.token })
  return j
}

export async function login({ email, password }){
  // Keep simple credential login; other flows (wx.login) handled separately if needed
  const res = await httpFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  const j = await res.json()
  if(!res.ok) throw new Error(j.error || 'login failed')
  if(j.token) applySession({ user: j.user, access_token: j.token })
  return j
}

// MP-WEIXIN specific: login via wx.login -> backend
// Usage: call wxLogin() from pages when on MP-WEIXIN
export async function wxLogin(){
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject)=>{
    uni.login({ provider: 'weixin', success: async (loginRes)=>{
      try{
        console.log('微信登录code:', loginRes.code)
        console.log('发送请求到后端:', '/api/wechat/login')
        const res = await httpFetch('/api/wechat/login', { method: 'POST', body: JSON.stringify({ code: loginRes.code }) })
        console.log('后端响应状态:', res.status)
        const j = await res.json()
        console.log('后端响应数据:', j)
        if(!res.ok) return reject(new Error(j.message || j.error || '微信登录失败'))
        if(j.token) applySession({ user: j.user, access_token: j.token })
        resolve(j)
      }catch(e){ reject(e) }
    }, fail: reject })
  })
  // #endif
  
  // #ifndef MP-WEIXIN
  throw new Error('微信登录功能仅在微信小程序环境中可用')
  // #endif
}

export async function getMe(){
  try{
    // #ifdef MP-WEIXIN
    const raw = uni.getStorageSync('app_auth_user')
    if(!raw) return null
    const auth = typeof raw === 'string' ? JSON.parse(raw) : raw
    const res = await httpFetch('/api/auth/me', { headers: { Authorization: `Bearer ${auth.token}` } })
    if(!res.ok) return null
    const j = await res.json()
    return j.user
    // #endif

    // #ifndef MP-WEIXIN
    const raw = localStorage.getItem('app_auth_user')
    if(!raw) return null
    const auth = JSON.parse(raw)
    const res = await fetch(BASE + '/api/auth/me', { headers: { Authorization: `Bearer ${auth.token}` } })
    if(!res.ok) return null
    const j = await res.json()
    return j.user
    // #endif
  }catch(e){ return null }
}

export function logout(){
  try{
    // #ifdef MP-WEIXIN
    httpFetch('/api/auth/logout').catch(()=>{})
    uni.removeStorageSync('app_auth_user')
    // #endif

    // #ifndef MP-WEIXIN
    try{ fetch(BASE + '/api/auth/logout') }catch(e){}
    clearAuthLocal()
    // #endif
  }catch(e){}
}
