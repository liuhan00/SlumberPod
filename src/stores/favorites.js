import { defineStore } from 'pinia'
import { getFavorites, addFavorite, removeFavorite } from '@/api/users'
import { getAuthLocal } from '@/store/auth'

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({ items: [] }),
  actions: {
    load(){
      try { const arr = uni.getStorageSync('favoriteItems'); if(Array.isArray(arr)) this.items = arr } catch(e){}
    },
    save(){ try { uni.setStorageSync('favoriteItems', this.items) } catch(e){} },
    async syncFromServer(){
      try{
        const auth = getAuthLocal()
        if(!auth?.id && !auth?.user?.id) return
        const userId = auth?.id || auth?.user?.id
        const data = await getFavorites(userId)
        if(Array.isArray(data)){
          this.items = data.map(d=> ({ ...d, ts: Date.now() }))
          this.save()
        }
      }catch(e){ console.warn('sync favorites failed', e) }
    },
    async add(item){
      if(!item) return; const exists = this.items.some(x=>x.id===item.id); if(exists) return
      // optimistic update
      this.items.unshift({ ...item, ts: Date.now() }); this.save()
      try{
        const auth = getAuthLocal()
        if(auth?.id || auth?.user?.id){
          const userId = auth?.id || auth?.user?.id
          await addFavorite(userId, { item_id: item.id })
        }
      }catch(e){
        // rollback on error
        this.items = this.items.filter(x=>x.id!==item.id); this.save(); throw e
      }
    },
    async remove(id){
      const had = this.items.some(x=>x.id===id)
      this.items = this.items.filter(x=>x.id!==id); this.save()
      try{
        const auth = getAuthLocal()
        if(auth?.id || auth?.user?.id){ 
          const userId = auth?.id || auth?.user?.id
          await removeFavorite(userId, id) 
        }
      }catch(e){
        // rollback on error
        if(had){ /* re-add minimal item */ this.items.unshift({ id, ts: Date.now() }); this.save() }
        throw e
      }
    },
    clear(){ this.items = []; uni.removeStorageSync('favoriteItems') },
    async toggle(item){ if(!item) return; const exists = this.items.some(x=>x.id===item.id); if(exists) await this.remove(item.id); else await this.add(item) }
  }
})
