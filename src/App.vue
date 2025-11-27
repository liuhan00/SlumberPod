<template>
  <view>
    <slot />
    <MiniPlayer />
  </view>
</template>
<script>
import MiniPlayer from '@/components/MiniPlayer.vue'
import { usePlayerStore } from '@/stores/player'
import { getHour, getThemeByHour, baseColors, textColors, gradients } from '@/utils/timeTheme'
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
    // Auth check: 立即检查登录状态
    try{
      const auth = uni.getStorageSync('app_auth_user')
      const authObj = typeof auth === 'string' ? JSON.parse(auth) : auth
      
      // 区分游客登录和真实登录：游客登录没有token或guest为true
      const isLoggedIn = authObj && !authObj.guest && authObj.token
      
      if(!isLoggedIn){
        // 检查当前页面，避免重复跳转
        const pages = getCurrentPages()
        const currentPage = pages[pages.length - 1]
        if (currentPage && currentPage.route !== 'pages/auth/Login') {
          uni.reLaunch({ url: '/pages/auth/Login' })
        }
      }
    }catch(e){
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      if (currentPage && currentPage.route !== 'pages/auth/Login') {
        uni.reLaunch({ url: '/pages/auth/Login' })
      }
    }
  },
  onShow() {
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