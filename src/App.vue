<script>
import { usePlayerStore } from '@/stores/player'
export default {
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
/*每个页面公共css */
</style>
