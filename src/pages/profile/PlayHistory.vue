<template>
  <view class="page" :style="pageStyle">
    <view class="header">
      <text class="title">播放历史</text>
    </view>
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else>
      <view v-if="list.length === 0" class="empty">暂无播放记录</view>
      <view v-for="item in list" :key="item.id || item.trackId || item.uuid" class="history-item">
        <text class="name">{{ item.trackName || item.title || item.name }}</text>
        <text class="meta">{{ formatDate(item.playedAt || item.createdAt || item.time) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { getAuthLocal } from '@/store/auth'
import { getWhiteNoiseHistory } from '@/api/whiteNoise'

const { bgStyle } = useGlobalTheme()
const pageStyle = bgStyle
const list = ref([])
const loading = ref(false)
const error = ref(null)

function formatDate(v){ if(!v) return ''
  try{ const d = new Date(v); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }catch(e){return ''}
}

async function load(){
  loading.value = true
  try{
    // 使用新的白噪音组合播放历史接口
    console.log('[PlayHistory] 加载白噪音组合播放历史')
    const data = await getWhiteNoiseHistory({ offset: 0, limit: 100 })
    list.value = Array.isArray(data) ? data : (data.items || data.data || [])
    
    // 触发组合播放历史拉取（GET /api/audios/white-noise/history）
    try{
      const { useHistoryStore } = await import('@/stores/history')
      const historyStore = useHistoryStore()
      await historyStore.syncWhiteNoiseHistory?.()
    }catch(e){ console.warn('sync combo history failed', e) }
  }catch(e){ error.value = e.message || String(e); console.error(e) }
  finally{ loading.value = false }
}

onMounted(()=> load())
</script>

<style scoped>
.page{ padding:12px }
.title{ font-size:18px; font-weight:700; color:var(--text-primary) }
.loading{ color:var(--muted) }
.empty{ color:var(--muted); padding:18px 0 }
.history-item{ padding:12px 0; border-bottom:1px solid var(--border) }
.name{ font-size:16px; color:var(--text-primary); font-weight:600 }
.meta{ font-size:12px; color:var(--text-secondary); margin-top:6px }
</style>