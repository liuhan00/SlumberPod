<template>
  <scroll-view class="page" scroll-y :style="bgStyle">
    <view class="section">
      <text class="title">我喜欢的</text>

      <view class="tabs">
        <button :class="['tab', {active: tab==='audio'}]" @click="tab='audio'">音频</button>
        <button :class="['tab', {active: tab==='post'}]" @click="tab='post'">帖子</button>
        <button :class="['tab', {active: tab==='combo'}]" @click="tab='combo'">组合</button>
      </view>

      <!-- 音频列表 -->
      <view v-show="tab==='audio'">
        <view class="list" v-if="audioItems.length">
          <view class="item" v-for="it in audioItems" :key="it.id">
          <image class="cover" :src="safeImageUrl(it.cover || it.image, 'noise')" mode="aspectFill" @error="handleImageError" />
          <view class="meta">
              <text class="name">{{ it.name || it.title || it.audio_name || it.audioName || it.audio_title || it.audioTitle || it.filename || ('音频#' + it.id) }}</text>
            <text class="author">{{ it.author || it.category || '' }}</text>
          </view>
          <view class="actions">
            <button class="btn" @click="play(it)">播放</button>
            <button class="btn danger" @click="remove(it.id)">移除</button>
          </view>
        </view>
      </view>
        <view class="empty" v-else>暂无收藏的音频</view>
      </view>

      <!-- 组合列表 -->
      <view v-show="tab==='combo'">
        <view class="list" v-if="comboItems.length">
          <view class="item" v-for="combo in comboItems" :key="combo.id">
            <view class="meta">
              <text class="name">{{ combo.name }}</text>
              <!-- 显示组合中的音频 -->
              <view class="combo-audios">
                <text 
                  v-for="audioId in combo.audioIds" 
                  :key="audioId"
                  :class="['audio-tag', { selected: combo.selectedAudioIds && combo.selectedAudioIds.includes(audioId) }]"
                >
                  音频{{ audioId }}
                </text>
              </view>
            </view>
            <view class="actions">
              <button class="btn" @click="playCombo(combo)">播放</button>
              <button class="btn danger" @click="removeCombo(combo.id)">移除</button>
            </view>
          </view>
        </view>
        <view class="empty" v-else>暂无收藏的组合</view>
      </view>

      <!-- 帖子列表 -->
      <view v-show="tab==='post'">
        <view class="list" v-if="posts.length">
          <view class="item" v-for="p in posts" :key="p.id" @click="openPost(p)">
            <image class="cover" :src="safeImageUrl(p.image, 'post')" mode="aspectFill" @error="handleImageError" />
            <view class="meta">
              <text class="name">{{ p.title || '未命名' }}</text>
              <text class="author">{{ p.author || p.user_name || '' }}</text>
            </view>
            <view class="actions">
              <button class="btn">查看</button>
            </view>
          </view>
        </view>
        <view class="empty" v-else>暂无点赞的帖子</view>
      </view>
    </view>
  </scroll-view>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { useFavoritesStore } from '@/stores/favorites'
import { usePlayerStore } from '@/stores/player'
import { listLikedPosts } from '@/api/community'
import { getAuthLocal } from '@/store/auth'
import { safeImageUrl, getPlaceholder } from '@/utils/image'
const { bgStyle } = useGlobalTheme()
const fav = useFavoritesStore(); fav.load()
const store = usePlayerStore()
const tab = ref('audio')
const audioItems = computed(()=> fav.items)
const comboItems = computed(()=> fav.comboItems)
const posts = ref([])
function play(t){ store.play(t); try{ uni.navigateTo({ url:`/pages/player/index?id=${t.id}` }) }catch(e){ location.hash = `#/pages/player/index?id=${t.id}` } }
function remove(id){ fav.remove(id) }
function openPost(p){
  if(!p?.id) return
  const id = String(p.id).replace(/^p/, '')
  try{ uni.navigateTo({ url:`/pages/community/detail?id=${id}` }) }catch(e){ location.hash = `#/pages/community/detail?id=${id}` }
}
function handleImageError(e) {
  // 图片加载失败时，safeImageUrl 已经处理了，这里不需要额外操作
}

// 播放组合
function playCombo(combo) {
  // 这里应该实现组合播放逻辑
  console.log('播放组合:', combo)
  uni.showToast({ title: '播放组合功能待实现', icon: 'none' })
}

// 移除组合收藏
function removeCombo(id) {
  // 这里应该实现移除组合收藏的逻辑
  console.log('移除组合收藏:', id)
  uni.showToast({ title: '移除组合功能待实现', icon: 'none' })
}

onMounted(async ()=>{
  // 同步音频收藏（若已登录）
  try{ await fav.syncFromServer?.() }catch(e){}
  // 触发组合收藏列表拉取（GET /api/audios/white-noise/favorites）
  try{ await fav.syncWhiteNoiseCombos?.() }catch(e){}
  // 拉取帖子点赞
  try{
    const auth = getAuthLocal()
    const userId = auth?.id || auth?.user?.id || auth?.userId || auth?.user?.userId
    if(userId){
      const arr = await listLikedPosts(userId)
      posts.value = (Array.isArray(arr) ? arr : []).map(x=>{
        const id = x?.post_id ?? x?.id
        return {
          id,
          title: x?.title || x?.post_title || '',
          image: x?.image || x?.cover || (x?.images && x?.images[0]) || '',
          author: x?.user_name || x?.author || ''
        }
      })
    }else{
      posts.value = []
    }
  }catch(e){
    console.warn('fetch liked posts failed', e)
    posts.value = []
  }
})
</script>
<style scoped>
.page{ min-height:100vh }
.section{ padding: 12px 16px }
.title{ font-size:18px; font-weight:600; color: var(--fg); margin-bottom:8px }
.tabs{ display:flex; gap:8px; margin:8px 0 12px }
.tab{ flex:0 0 auto; padding:6px 12px; border-radius:999px; background: var(--input-bg); color: var(--fg); border:none }
.tab.active{ background:#13303f; color:#fff }
.list{ padding: 0 0 }
.item{ display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--border) }
.cover{ width:60px; height:60px; border-radius:8px }
.meta{ flex:1; display:flex; flex-direction:column }
.name{ font-size:16px; color: var(--fg) }
.author{ font-size:12px; color: var(--muted) }
.actions{ display:flex; gap:8px }
.btn{ padding:6px 10px; border-radius:6px; background: var(--input-bg); color: var(--fg) }
.danger{ background:#ffeded; color:#c62828 }
.empty{ text-align:center; color: var(--muted); padding:32px 0 }

/* 组合相关样式 */
.combo-audios { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 4px; 
  margin-top: 4px; 
}
.audio-tag { 
  font-size: 10px; 
  padding: 2px 6px; 
  border-radius: 4px; 
  background: var(--input-bg); 
  color: var(--muted);
}
.audio-tag.selected { 
  background: #13303f; 
  color: #fff; 
}
</style>