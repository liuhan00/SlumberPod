<template>
  <view>
    <slot />
    <MiniPlayer />
  </view>
</template>
<script>
import MiniPlayer from '@/components/MiniPlayer.vue'
import { usePlayerStore } from '@/stores/player'
import { getAuthStatus } from '@/store/auth'
import { getHour, getThemeByHour, baseColors, textColors, gradients } from '@/utils/timeTheme'
const AUTH_WHITELIST = new Set(['pages/auth/Login', 'pages/auth/Register'])
let navigationGuardInstalled = false
let isRedirectingToLogin = false

function normalizePagePath(value){
  if(!value) return ''
  return value.split('?')[0].replace(/^\/+/, '')
}

function resolveCurrentRoute(){
  if(typeof getCurrentPages !== 'function') return ''
  const pages = getCurrentPages()
  if(!pages || !pages.length) return ''
  const page = pages[pages.length - 1]
  return normalizePagePath(page?.route || page?.__route__ || '')
}

function redirectToLogin(){
  if(isRedirectingToLogin) return
  isRedirectingToLogin = true
  uni.reLaunch({
    url: '/pages/auth/Login',
    complete: () => {
      setTimeout(() => { isRedirectingToLogin = false }, 200)
    }
  })
}

function ensureAuthenticated({ allowGuest = true } = {}){
  const { isAuthenticated, isGuest } = getAuthStatus()
  if(isAuthenticated){
    if(!allowGuest && isGuest){
      redirectToLogin()
      return false
    }
    return true
  }
  const currentRoute = resolveCurrentRoute()
  if(currentRoute && AUTH_WHITELIST.has(currentRoute)){
    return false
  }
  redirectToLogin()
  return false
}

function installNavigationGuards(){
  if(navigationGuardInstalled) return
  if(typeof uni === 'undefined' || typeof uni.addInterceptor !== 'function') return
  const guard = (options = {}) => {
    const targetPath = normalizePagePath(options.url || options.path || '')
    if(!targetPath || AUTH_WHITELIST.has(targetPath)) return options
    if(ensureAuthenticated({ allowGuest: true })) return options
    const currentRoute = resolveCurrentRoute()
    if(!currentRoute || !AUTH_WHITELIST.has(currentRoute)){
      try{ uni.showToast({ title: '请先登录', icon: 'none' }) }catch(e){}
    }
    return false
  }
  ;['navigateTo', 'redirectTo', 'switchTab'].forEach((method) => {
    uni.addInterceptor(method, { invoke: guard })
  })
  navigationGuardInstalled = true
}

export default {
  components: { MiniPlayer },
  onLaunch() {
    const store = usePlayerStore()
    const s = uni.getStorageSync('playerState')
    if (s && typeof s === 'object') {
      store.playlist = s.playlist || []
      store.currentTrack = s.currentTrack || null
      store.positionMs = s.positionMs || 0
      store.durationMs = s.durationMs || 0
      store.volume = s.volume ?? 0.8
      store.isMuted = s.isMuted || false
      store.loopMode = s.loopMode || 'all'
    }
    installNavigationGuards()
    ensureAuthenticated()
  },
  onShow() {
    installNavigationGuards()
    ensureAuthenticated()
    const h = getHour()
    const t = getThemeByHour(h)
    try {
      function _normHex(h){ if(!h) return '#000000'; h = String(h); if(h[0] !== '#') return h; if(h.length===4) return '#' + h[1]+h[1]+h[2]+h[2]+h[3]+h[3]; return h.length===7? h : '#000000' }
      const front = (textColors[t] === '#0f172a' || textColors[t] === '#000' || textColors[t] === '#000000') ? '#000000' : '#ffffff'
      uni.setNavigationBarColor({
        frontColor: _normHex(front),
        backgroundColor: _normHex(baseColors[t])
      })
    } catch (e) {}
    // set global CSS variables for pages to use dynamic background
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.style.setProperty('--bg-color', baseColors[t])
        document.documentElement.style.setProperty('--bg-gradient', gradients[t])
        document.documentElement.style.setProperty('--text-color', textColors[t])
        // set derived text levels for contrast
        const primary = textColors[t]
        const secondary = (t === 'day') ? 'rgba(15,23,42,0.7)' : 'rgba(231,233,238,0.7)'
        const inverse = (t === 'day') ? '#ffffff' : '#0f172a'
        document.documentElement.style.setProperty('--text-primary', primary)
        document.documentElement.style.setProperty('--text-secondary', secondary)
        document.documentElement.style.setProperty('--text-inverse', inverse)
      }
    } catch (e) {}
  },
  onHide() {
    const store = usePlayerStore()
    const s = {
      playlist: store.playlist,
      currentTrack: store.currentTrack,
      positionMs: store.positionMs,
      durationMs: store.durationMs,
      volume: store.volume,
      isMuted: store.isMuted,
      loopMode: store.loopMode,
    }
    uni.setStorageSync('playerState', s)
  }
}
</script>

<style>
/* 全局背景和文字颜色由 theme 驱动 */
html, body, #app { height: 100%; }
.page { min-height: 100vh; padding-bottom: var(--bottom-safe, 0); background: var(--bg-color); background-image: var(--bg-gradient); background-repeat: no-repeat; background-size: 100% 100%; color: var(--text-color); }
</style>