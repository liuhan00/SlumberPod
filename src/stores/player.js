import { defineStore } from 'pinia'
import * as apiHistory from '@/api/history'
import * as apiAudios from '@/api/audios'
import { getAuthLocal } from '@/store/auth'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    currentTrack: null,
    isPlaying: false,
    playlist: [],
    positionMs: 0,
    durationMs: 0,
    volume: 0.8,
    isMuted: false,
    previousVolume: 0.8,
    loopMode: 'all',
  }),
  getters: {
    currentIndex(state){
      if (!state.currentTrack) return -1
      return state.playlist.findIndex(t=>t.id===state.currentTrack.id)
    },
    hasNext(state){
      if (state.playlist.length === 0) return false
      if (state.loopMode === 'all') return state.playlist.length > 1
      if (state.loopMode === 'one') return true
      // off
      const idx = state.playlist.findIndex(t=>t.id===state.currentTrack?.id)
      return idx >= 0 && idx < state.playlist.length - 1
    },
    hasPrev(state){
      if (state.playlist.length === 0) return false
      if (state.loopMode === 'all') return state.playlist.length > 1
      if (state.loopMode === 'one') return true
      // off
      const idx = state.playlist.findIndex(t=>t.id===state.currentTrack?.id)
      return idx > 0
    }
  },
  actions: {
    setPlaylist(list) { this.playlist = list || [] },
    play(track) {
      if (track) this.currentTrack = track
      this.isPlaying = true
      // 写入播放历史（后端）：仅在登录且存在后端真实数字ID时上报
      try{
        const auth = getAuthLocal && getAuthLocal()
        const hasToken = Boolean(auth?.token || auth?.access_token)
        const src = this.currentTrack || {}
        // 后端真实音频ID优先 metaId，其次 id/audio_id
        const rawId = src.metaId ?? src.id ?? src.audio_id ?? src.audioId ?? null
        const hasValidId = rawId !== null && rawId !== undefined && String(rawId).trim() !== ''
        
        // 添加更多的日志以便调试
        console.log('[player] play track:', { track, src, rawId, hasValidId, hasToken })
        console.log('[player] auth info:', auth)
        console.log('[player] src details:', {
          hasMetaId: !!src.metaId,
          hasId: !!src.id,
          hasAudioId: !!src.audio_id,
          hasAudioIdAlt: !!src.audioId,
          metaId: src.metaId,
          id: src.id,
          audio_id: src.audio_id,
          audioId: src.audioId
        })
        
        // 添加条件判断的日志
        if (!hasToken) {
          console.log('[player] No token, skipping play record')
        }
        if (!hasValidId) {
          console.log('[player] No valid ID, skipping play record')
        }
        
        if (hasToken && hasValidId){
          console.log('[player] Recording play with audio ID:', rawId)
          // 记录播放历史
          apiHistory.addPlayHistory({ audio_id: rawId, play_duration: 0 }).catch(()=>{})
          // 记录播放行为（调用 POST /api/audios/{audioId}/play 接口）
          apiAudios.incrementPlay(rawId).catch(()=>{})
        } else {
          console.log('[player] Skipping play record due to missing token or invalid ID')
        }
      }catch(e){ 
        console.error('[player] play error:', e)
      }
    },    pause() { this.isPlaying = false },
    setLoopMode(mode){ this.loopMode = mode },
    next() {
      if (!this.currentTrack || this.playlist.length === 0) return
      const idx = this.playlist.findIndex(t => t.id === this.currentTrack.id)
      if (this.loopMode === 'one') {
        // 继续当前
        this.isPlaying = true
        return
      }
      if (this.loopMode === 'off') {
        if (idx < 0 || idx === this.playlist.length - 1) return
        this.currentTrack = this.playlist[idx + 1]
        this.isPlaying = true
        return
      }
      // all 循环
      const nextIdx = (idx + 1) % this.playlist.length
      this.currentTrack = this.playlist[nextIdx]
      this.isPlaying = true
    },
    prev() {
      if (!this.currentTrack || this.playlist.length === 0) return
      const idx = this.playlist.findIndex(t => t.id === this.currentTrack.id)
      if (this.loopMode === 'one') {
        this.isPlaying = true
        return
      }
      if (this.loopMode === 'off') {
        if (idx <= 0) return
        this.currentTrack = this.playlist[idx - 1]
        this.isPlaying = true
        return
      }
      const prevIdx = (idx - 1 + this.playlist.length) % this.playlist.length
      this.currentTrack = this.playlist[prevIdx]
      this.isPlaying = true
    },
    seek(ms) { this.positionMs = Math.max(0, Math.min(ms, this.durationMs)) },
    setVolume(v) { this.volume = Math.max(0, Math.min(v, 1)) },
    toggleMute() {
      if (this.isMuted) {
        this.isMuted = false
        this.volume = this.previousVolume || 0.8
      } else {
        this.isMuted = true
        this.previousVolume = this.volume
        this.volume = 0
      }
    },
    addToQueue(track) {
      if (!track) return
      const exists = this.playlist.some(t => t.id === track.id)
      if (!exists) this.playlist = [...this.playlist, track]
    }
  }
})
