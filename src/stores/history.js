import { defineStore } from 'pinia'
import { getAuthLocal } from '@/store/auth'
import { getWhiteNoiseHistory } from '@/api/whiteNoise'

export const useHistoryStore = defineStore('history', {
  state: () => ({ items: [], comboItems: [] }),
  actions: {
    add(track){
      if (!track) return
      const id = track.id
      const existsIdx = this.items.findIndex(x=>x.id===id)
      const entry = { ...track, ts: Date.now() }
      if (existsIdx >= 0) {
        this.items.splice(existsIdx, 1)
      }
      this.items.unshift(entry)
      this.items = this.items.slice(0, 50)
      try { uni.setStorageSync('historyItems', this.items) } catch(e) {}
    },
    load(){
      try {
        const arr = uni.getStorageSync('historyItems')
        if (Array.isArray(arr)) this.items = arr
      } catch(e) {}
    },
    clear(){ this.items = []; uni.removeStorageSync('historyItems') },
    async syncWhiteNoiseHistory(){
      try {
        const auth = getAuthLocal()
        const loggedIn = Boolean(auth?.id || auth?.user?.id || auth?.token || auth?.access_token)
        if(!loggedIn) return
        // 使用新的API获取白噪音组合播放历史
        const history = await getWhiteNoiseHistory({ offset: 0, limit: 100 })
        // 规范化组合播放历史数据：保留音频ID列表、播放模式、播放时间等
        const normalized = (Array.isArray(history) ? history : []).map((h, idx) => {
          const ids = h?.audio_ids ?? h?.audios ?? h?.ids ?? []
          const playedId = h?.played_id ?? h?.playedId ?? null
          return {
            id: h?.id ?? h?.history_id ?? `combo-${idx}`,
            audioIds: (Array.isArray(ids) ? ids : []).map(n=> Number(n)).filter(n=> !Number.isNaN(n)),
            playedId: playedId ? Number(playedId) : null,
            mode: h?.mode || 'mix',
            name: h?.name || h?.title || '白噪音组合',
            ts: h?.created_at ?? h?.play_time ?? h?.ts ?? Date.now()
          }
        })
        this.comboItems = normalized
        // 可选：写入本地缓存
        try{ uni.setStorageSync('comboHistoryItems', this.comboItems) }catch(e){}
      } catch(e){ 
        console.warn('sync white-noise history failed', e) 
        // 抛出错误以便调用者可以处理
        throw e
      }
    }
  }
})