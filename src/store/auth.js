// auth helper unified for web and MP-WEIXIN
export const AUTH_KEY = 'app_auth_user'

export function saveAuthLocal(user){
  try{
    // #ifdef MP-WEIXIN
    uni.setStorageSync(AUTH_KEY, user)
    // #endif

    // #ifndef MP-WEIXIN
    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    // #endif
  }catch(e){}
}

export function getAuthLocal(){
  try{
    console.log('[Auth] Getting auth local')
    // #ifdef MP-WEIXIN
    const mpRaw = uni.getStorageSync(AUTH_KEY)
    console.log('[Auth] MP-WEIXIN raw:', mpRaw)
    
    // 添加更多调试信息
    if (mpRaw) {
      console.log('[Auth] MP-WEIXIN raw type:', typeof mpRaw)
      if (typeof mpRaw === 'object') {
        console.log('[Auth] MP-WEIXIN raw keys:', Object.keys(mpRaw))
      }
    }
    
    return mpRaw || null
    // #endif

    // #ifndef MP-WEIXIN
    const webRaw = localStorage.getItem(AUTH_KEY)
    console.log('[Auth] Web raw:', webRaw)
    return JSON.parse(webRaw || 'null')
    // #endif
  }catch(e){ 
    console.error('[Auth] getAuthLocal error:', e)
    return null 
  }
}

export function clearAuthLocal(){
  try{
    // #ifdef MP-WEIXIN
    uni.removeStorageSync(AUTH_KEY)
    // #endif

    // #ifndef MP-WEIXIN
    localStorage.removeItem(AUTH_KEY)
    // #endif
  }catch(e){}
}

export function getAuthToken(){
  try{
    const raw = getAuthLocal()
    console.log('[Auth] getAuthToken raw:', raw)
    if(!raw) return null
    
    // 处理不同格式的认证信息
    if (typeof raw === 'object') {
      // 直接包含 token 的情况
      if (raw.token || raw.access_token) {
        const result = { access_token: raw.token || raw.access_token, userId: raw.id || raw.userId }
        console.log('[Auth] getAuthToken result (direct):', result)
        return result
      }
      
      // 包含 data 对象的情况
      if (raw.data && (raw.data.token || raw.data.access_token)) {
        const result = { access_token: raw.data.token || raw.data.access_token, userId: raw.data.id || raw.data.userId }
        console.log('[Auth] getAuthToken result (data):', result)
        return result
      }
      
      // 包含 user 对象的情况
      if (raw.user && (raw.user.token || raw.user.access_token)) {
        const result = { access_token: raw.user.token || raw.user.access_token, userId: raw.user.id || raw.user.userId }
        console.log('[Auth] getAuthToken result (user):', result)
        return result
      }
    }
    
    console.log('[Auth] getAuthToken result: null')
    return null
  }catch(e){ 
    console.error('[Auth] getAuthToken error:', e)
    return null 
  }
}

export function getAuthStatus(){
  try{
    const auth = getAuthLocal()
    console.log('[Auth] getAuthStatus auth:', auth)
    if(!auth) return { auth: null, token: null, isGuest: false, isAuthenticated: false }
    
    // 处理不同格式的认证信息
    let token = null
    if (typeof auth === 'object') {
      token = auth.token || auth.access_token || (auth.data && auth.data.token) || (auth.user && auth.user.token) || null
    }
    
    const isGuest = !!(auth.guest || (auth.user && auth.user.guest))
    const isAuthenticated = Boolean(token) || isGuest
    const result = { auth, token, isGuest, isAuthenticated }
    console.log('[Auth] getAuthStatus result:', result)
    return result
  }catch(e){
    console.error('[Auth] getAuthStatus error:', e)
    return { auth: null, token: null, isGuest: false, isAuthenticated: false }
  }
}

// 验证JWT token的格式
export function validateJwtToken(token) {
  if (!token || typeof token !== 'string') {
    console.log('[Auth] validateJwtToken: Invalid token format - not a string')
    return false
  }
  
  const parts = token.split('.')
  if (parts.length !== 3) {
    console.log('[Auth] validateJwtToken: Invalid token format - not 3 parts')
    return false
  }
  
  try {
    // 验证header部分
    const header = JSON.parse(atob(parts[0]))
    console.log('[Auth] validateJwtToken header:', header)
    
    // 验证payload部分
    const payload = JSON.parse(atob(parts[1]))
    console.log('[Auth] validateJwtToken payload:', payload)
    
    // 检查是否过期
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      console.log('[Auth] validateJwtToken: Token expired')
      return false
    }
    
    console.log('[Auth] validateJwtToken: Token is valid')
    return true
  } catch (e) {
    console.log('[Auth] validateJwtToken: Error parsing token', e)
    return false
  }
}

// utilities to integrate with Supabase client elsewhere
export function applySession(session){
  try{
    if(!session){
      // #ifdef MP-WEIXIN
      uni.removeStorageSync(AUTH_KEY)
      // #endif

      // #ifndef MP-WEIXIN
      localStorage.removeItem(AUTH_KEY)
      // #endif
      return
    }

    const payload = { id: session.user.id, token: session.access_token, name: session.user.user_metadata?.name || session.user.email }
    // #ifdef MP-WEIXIN
    uni.setStorageSync(AUTH_KEY, payload)
    // #endif

    // #ifndef MP-WEIXIN
    localStorage.setItem(AUTH_KEY, JSON.stringify(payload))
    // #endif
  }catch(e){}
}