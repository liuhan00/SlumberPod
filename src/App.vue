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
    // Auth check: require login before showing homepage
    try{
      const auth = uni.getStorageSync('app_auth_user')
      if(!auth || !auth.token){
        // redirect to login page
        uni.reLaunch({ url: '/pages/auth/Login' })
      }
    }catch(e){
      uni.reLaunch({ url: '/pages/auth/Login' })
    }
  },
  onShow() {
    const h = getHour()
    const t = getThemeByHour(h)
    try {
      uni.setNavigationBarColor({
        frontColor: (textColors[t] === '#0f172a' || textColors[t] === '#000') ? '#000000' : '#ffffff',
        backgroundColor: baseColors[t]
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
