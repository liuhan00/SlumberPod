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
    // #ifdef MP-WEIXIN
    const raw = uni.getStorageSync(AUTH_KEY)
    return raw || null
    // #endif

    // #ifndef MP-WEIXIN
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
    // #endif
  }catch(e){ return null }
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
    if(!raw) return null
    return { access_token: raw.token || raw.access_token, userId: raw.id || raw.userId }
  }catch(e){ return null }
}

export function getAuthStatus(){
  try{
    const auth = getAuthLocal()
    if(!auth) return { auth: null, token: null, isGuest: false, isAuthenticated: false }
    const token = auth.token || auth.access_token || null
    const isGuest = !!(auth.guest || auth.user?.guest)
    const isAuthenticated = Boolean(token) || isGuest
    return { auth, token, isGuest, isAuthenticated }
  }catch(e){
    return { auth: null, token: null, isGuest: false, isAuthenticated: false }
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