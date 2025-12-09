import { defineStore } from 'pinia'
import { listFavorites, addFavorite, removeFavorite, removeFavoriteByRecordId } from '@/api/favorites'
import { getAudioById } from '@/api/audios'
import { getAuthLocal } from '@/store/auth'
import { listWhiteNoiseFavorites } from '@/api/whiteNoise'

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({ items: [], comboItems: [] }),
  actions: {
    load(){
      try { const arr = uni.getStorageSync('favoriteItems'); if(Array.isArray(arr)) this.items = arr } catch(e){}
    },
    save(){ try { uni.setStorageSync('favoriteItems', this.items) } catch(e){} },
    async syncFromServer(){
      try{
        // 仅在已登录的情况下同步
        const auth = getAuthLocal()
        const loggedIn = Boolean(
          auth?.id || auth?.user?.id || auth?.token || auth?.access_token
        )
        if(!loggedIn) return

        const data = await listFavorites()
        if(Array.isArray(data)){
          // 将服务端元素规格化，尽可能带上名称/封面等字段
          const normalized = data
            .map(d => {
              if (typeof d === 'string' || typeof d === 'number') {
                return { id: Number(d), ts: Date.now() }
              }
              const audioId = d?.audio_id ?? d?.audioId ?? null
              const recordId = d?.id ?? d?.favorite_id ?? d?.favoriteId ?? null
              const id = audioId ?? recordId
              if (!id) return null
              return {
                // 前端内部统一用 id 表示音频ID（用于匹配/去重）
                id: Number(id),
                // 记录后端收藏记录ID，供删除时使用
                favId: recordId != null ? Number(recordId) : undefined,
                // 兼容字段：name/title/audio_name
                name: d?.name ?? d?.title ?? d?.audio_name ?? '',
                title: d?.title ?? d?.name ?? d?.audio_name ?? '',
                // 封面与作者/分类等尽可能补齐
                cover: d?.cover ?? d?.image ?? d?.poster ?? '',
                image: d?.image ?? d?.cover ?? '',
                author: d?.author ?? d?.user_name ?? '',
                category: d?.category ?? d?.tag ?? '',
                duration: d?.duration ?? d?.length ?? undefined,
                ts: Date.now()
              }
            })
            .filter(Boolean)

          // 合并到现有列表：保留已有详细信息，用服务端补齐空缺
          const byId = new Map()
          // 先放入现有项
          this.items.forEach(x => { byId.set(x.id, { ...x }) })
          // 再用服务端数据更新/补齐
          normalized.forEach(n => {
            const prev = byId.get(n.id)
            if (prev) {
              byId.set(n.id, {
                ...prev,
                // 优先使用已有的非空字段，其次使用服务端字段
                name: prev.name || n.name,
                title: prev.title || n.title,
                cover: prev.cover || n.cover,
                image: prev.image || n.image,
                author: prev.author || n.author,
                category: prev.category || n.category,
                duration: prev.duration ?? n.duration,
                ts: n.ts // 更新时间戳以反映同步时间
              })
            } else {
              byId.set(n.id, n)
            }
          })

          this.items = Array.from(byId.values())
          this.save()

          // 批量获取缺失名称的音频详情
          const itemsNeedingName = this.items.filter(item => {
            const hasName = item.name || item.title || item.audio_name || item.audioName
            return !hasName && item.id != null
          })
          
          if (itemsNeedingName.length > 0) {
            // 批量获取音频详情（使用 Promise.allSettled 避免单个失败影响整体）
            const audioDetailsPromises = itemsNeedingName.map(async (item) => {
              try {
                const audioDetail = await getAudioById(item.id)
                if (audioDetail) {
                  // 更新该项的名称等信息
                  const idx = this.items.findIndex(x => x.id === item.id)
                  if (idx >= 0) {
                    this.items[idx] = {
                      ...this.items[idx],
                      name: audioDetail.name || audioDetail.title || audioDetail.audio_name || audioDetail.audioName || this.items[idx].name || '',
                      title: audioDetail.title || audioDetail.name || audioDetail.audio_name || audioDetail.audioName || this.items[idx].title || '',
                      cover: audioDetail.cover || audioDetail.image || audioDetail.poster || this.items[idx].cover || '',
                      image: audioDetail.image || audioDetail.cover || this.items[idx].image || '',
                      author: audioDetail.author || audioDetail.user_name || this.items[idx].author || '',
                      category: audioDetail.category || audioDetail.tag || this.items[idx].category || '',
                      duration: audioDetail.duration || audioDetail.length || this.items[idx].duration
                    }
                  }
                }
              } catch (e) {
                console.warn(`Failed to fetch audio detail for id ${item.id}:`, e)
                // 单个失败不影响其他项
              }
            })
            
            // 等待所有请求完成（无论成功或失败）
            await Promise.allSettled(audioDetailsPromises)
            // 保存更新后的数据
          this.save()
          }
        }
      }catch(e){ console.warn('sync favorites failed', e) }
    },
    async add(item){
      if(!item) return;
      
      // 检查用户是否登录（排除游客）
      const auth = getAuthLocal()
      const isLoggedIn = auth && !auth.guest && (auth.token || auth.access_token)
      if(!isLoggedIn) {
        throw new Error('游客无法收藏，请先登录')
      }
      
      const metaId = item?.metaId
      const numericMeta = metaId !== undefined && metaId !== null && /^\d+$/.test(String(metaId)) ? Number(metaId) : null
      if (numericMeta === null) throw new Error('当前音频未绑定后端ID，无法收藏')
      const exists = this.items.some(x=>x.id===numericMeta); if(exists) return
      // optimistic update（以 metaId 作为唯一 id）
      this.items.unshift({ ...item, id: numericMeta, ts: Date.now() }); this.save()
      try{
        const created = await addFavorite({ audio_id: numericMeta })
        // 如果后端返回收藏记录ID，写回当前项
        const recId = created?.id ?? created?.favorite_id ?? created?.favoriteId
        if(recId != null){
          const idx = this.items.findIndex(x=> x.id === numericMeta)
          if(idx >= 0){
            this.items[idx] = { ...this.items[idx], favId: Number(recId) }
            this.save()
          }
        } else {
          // 兼容后端未返回记录ID的情况：拉取列表再匹配 audio_id
          try{
            const serverList = await listFavorites()
            const match = (Array.isArray(serverList) ? serverList : []).find(r=>{
              const aid = r?.audio_id ?? r?.audioId
              return Number(aid) === numericMeta
            })
            if(match?.id != null){
              const idx = this.items.findIndex(x=> x.id === numericMeta)
              if(idx >= 0){
                this.items[idx] = { ...this.items[idx], favId: Number(match.id) }
                this.save()
              }
            }
          }catch(_e){
            // 忽略：仅用于补全 favId，不影响前端可用性
          }
        }
      }catch(e){
        // rollback on error
        this.items = this.items.filter(x=>x.id!==numericMeta); this.save(); throw e
      }
    },
    async remove(id){
      // 检查用户是否登录（排除游客）
      const auth = getAuthLocal()
      const isLoggedIn = auth && !auth.guest && (auth.token || auth.access_token)
      if(!isLoggedIn) {
        throw new Error('游客无法取消收藏，请先登录')
      }
      
      const existing = this.items.find(x=> x.id === id)
      const had = Boolean(existing)
      // optimistic update: remove now
      this.items = this.items.filter(x=>x.id!==id); this.save()
      try{
        // 标准路由优先：若有收藏记录ID，按记录ID删除；否则按音频ID删除
        if(existing?.favId){
          await removeFavoriteByRecordId(existing.favId)
        } else {
          await removeFavorite(id)
        }
      }catch(e){
        // rollback on error
        if(had && existing){
          this.items.unshift(existing); this.save()
        }
        throw e
      }
    },
    clear(){ this.items = []; uni.removeStorageSync('favoriteItems') },
    async toggle(item){
      if(!item) return;
      const metaId = item?.metaId
      const numericMeta = metaId !== undefined && metaId !== null && /^\d+$/.test(String(metaId)) ? Number(metaId) : null
      if (numericMeta === null) throw new Error('该音频暂不支持收藏')
      const exists = this.items.some(x=>x.id===numericMeta)
      if(exists) await this.remove(numericMeta); else await this.add(item)
    },
    // 同步白噪音组合收藏列表
    async syncWhiteNoiseCombos(){
      try {
        const auth = getAuthLocal()
        const loggedIn = Boolean(auth?.id || auth?.user?.id || auth?.token || auth?.access_token)
        if(!loggedIn) return
        
        // 使用新的API获取白噪音组合收藏列表
        const combos = await listWhiteNoiseFavorites({ offset: 0, limit: 100 })
        // 规范化组合收藏数据
        const normalized = (Array.isArray(combos) ? combos : []).map((c, idx) => {
          const ids = c?.audio_ids ?? c?.audios ?? c?.ids ?? []
          const selectedIds = c?.selected_audio_ids ?? c?.selectedAudios ?? c?.selectedIds ?? []
          return {
            id: c?.id ?? c?.combo_id ?? `combo-${idx}`,
            audioIds: (Array.isArray(ids) ? ids : []).map(n=> Number(n)).filter(n=> !Number.isNaN(n)),
            selectedAudioIds: (Array.isArray(selectedIds) ? selectedIds : []).map(n=> Number(n)).filter(n=> !Number.isNaN(n)),
            name: c?.name || c?.title || c?.custom_name || '白噪音组合',
            ts: c?.created_at ?? c?.favorite_time ?? c?.ts ?? Date.now()
          }
        })
        this.comboItems = normalized
        // 可选：写入本地缓存
        try{ uni.setStorageSync('comboFavoriteItems', this.comboItems) }catch(e){}
      } catch(e){ 
        console.warn('sync white-noise combos failed', e) 
      }
    }
  }
})