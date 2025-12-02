// Unified auth API with platform-specific branches
import { saveAuthLocal, clearAuthLocal, applySession } from '@/store/auth'

const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.135:3003'

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
        console.log('[wxLogin] 步骤1: 获取微信code成功:', loginRes.code)
        console.log('[wxLogin] 步骤2: 发送请求到后端:', '/api/wechat/login')
        
        const res = await httpFetch('/api/wechat/login', { method: 'POST', body: JSON.stringify({ code: loginRes.code }) })
        
        console.log('[wxLogin] 步骤3: 后端响应状态:', res.status, res.ok ? '成功' : '失败')
        const j = await res.json()
        console.log('[wxLogin] 步骤4: 后端响应数据:', JSON.stringify(j, null, 2))
        
        if(!res.ok) {
          const errorMsg = j.message || j.error || j.msg || '微信登录失败'
          console.error('[wxLogin] 登录失败:', errorMsg, '完整响应:', j)
          return reject(new Error(errorMsg))
        }
        
        // 处理后端返回的数据结构 {success: true, data: {token, user, ...}}
        const loginData = j.data || j
        console.log('[wxLogin] 步骤5: 处理登录数据:', loginData)
        
        if(loginData.token) {
          applySession({ user: loginData.user, access_token: loginData.token })
          console.log('[wxLogin] 步骤6: 登录状态已保存到本地存储')
        } else {
          console.warn('[wxLogin] 警告: 登录响应中缺少token:', loginData)
          return reject(new Error('登录响应格式错误：缺少token'))
        }
        
        console.log('[wxLogin] ✅ 登录成功')
        resolve(j)
      }catch(e){ 
        console.error('[wxLogin] 异常:', e.message, e)
        reject(e) 
      }
    }, fail: (err) => {
      console.error('[wxLogin] uni.login失败:', err)
      reject(err)
    } })
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
