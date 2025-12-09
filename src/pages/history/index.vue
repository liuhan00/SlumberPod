<template>
  <scroll-view class="page" scroll-y>
    <view class="header">
      <text class="title">播放历史</text>
      <input class="search" type="text" v-model="keyword" placeholder="搜索名称/作者" />
      <view class="row">
        <button class="btn" @click="toggleSelect">{{ selecting? '完成': '批量选择' }}</button>
        <button class="btn danger" @click="clear">清空</button>
        <button class="btn" :disabled="selectedIds.size===0" @click="batchRemove">删除所选</button>
      </view>
    </view>
    <view class="list">
      <view class="item" v-for="t in filtered" :key="t.id" @click="selectOrPlay(t)" :class="{ selected: selectedIds.has(t.id) }">
        <image class="cover" :src="t.cover" mode="aspectFill" />
        <view class="meta">
          <text class="name">{{ formatHistoryName(t) }}</text>
          <text class="time">{{ formatTime(t.ts || t.play_time || t.created_at) }}</text>
        </view>
      </view>
      <view v-if="filtered.length===0" class="empty">暂无历史记录</view>
    </view>
  </scroll-view>
</template>
<script setup>
import { storeToRefs } from 'pinia'
import { ref, computed, onMounted } from 'vue'
import { useHistoryStore } from '@/stores/history'
const historyStore = useHistoryStore()
const { items } = storeToRefs(historyStore)

onMounted(async ()=> {
  historyStore.load()
  // 触发组合播放历史拉取（GET /api/audios/white-noise/history）
  try{ 
    // 直接调用新的API获取播放历史
    const historyData = await getWhiteNoiseHistory({ offset: 0, limit: 100 })
    // 更新历史存储中的组合播放历史
    await historyStore.syncWhiteNoiseHistory()
  }catch(e){
    console.error('加载播放历史失败:', e)
  }
})

const keyword = ref('')
const selecting = ref(false)
const selectedIds = ref(new Set())

const filtered = computed(()=>{
  const k = keyword.value.trim().toLowerCase()
  if (!k) return items.value
  return items.value.filter(t=> (t.name||'').toLowerCase().includes(k) || (t.author||'').toLowerCase().includes(k))
})

function selectOrPlay(t){
  if (selecting.value){
    if (selectedIds.value.has(t.id)) selectedIds.value.delete(t.id)
    else selectedIds.value.add(t.id)
  } else {
    play(t)
  }
}
function play(t){ uni.navigateTo({ url:`/pages/player/index?id=${t.id}` }) }
function toggleSelect(){ selecting.value = !selecting.value; selectedIds.value = new Set() }
function batchRemove(){ historyStore.items = historyStore.items.filter(x=> !selectedIds.value.has(x.id)); selectedIds.value = new Set(); uni.showToast({ title:'已删除所选', icon:'none' }) }
function clear(){ historyStore.clear(); uni.showToast({ title:'已清空', icon:'none' }) }
function formatTime(ts){ 
  if (!ts) return ''
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  const hh = String(d.getHours()).padStart(2,'0')
  const mm = String(d.getMinutes()).padStart(2,'0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

// 格式化历史记录名称
function formatHistoryName(item) {
  // 如果是混合组合（有 audio_ids 数组）
  if (item.audio_ids && Array.isArray(item.audio_ids) && item.audio_ids.length > 1) {
    // 从音频ID列表获取名称
    const names = item.audio_ids.map(id => {
      // 这里应该从音频列表中找到对应的名称
      // 暂时使用ID，实际应从后端获取或从本地缓存获取
      return `音频${id}`
    }).filter(Boolean)
    if (names.length > 0) {
      return `白噪音：${names.join('，')}`
    }
  }
  // 单个音频或已有名称
  return item.name || item.title || item.audio_name || '未知音频'
}
</script>
<style scoped>
.page{ min-height:100vh }
.header{ display:flex; flex-direction:column; gap:8px; padding:12px 16px }
.title{ font-size:18px; font-weight:600 }
.search{ width:100%; background:#f2f3f5; border-radius:8px; padding:8px 10px }
.row{ display:flex; gap:8px }
.list{ padding: 0 16px }
.item{ display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid #eee }
.item.selected{ background:#f7f7f8 }
.cover{ width:60px; height:60px; border-radius:8px }
.meta{ flex:1; display:flex; flex-direction:column }
.name{ font-size:16px; color: var(--text-primary); line-height:1.5; margin-bottom:4px }
.time{ font-size:12px; color:#999 }
.btn{ padding:6px 10px; border-radius:6px; background:#f2f3f5 }
.danger{ background:#ffeded; color:#c62828 }
.empty{ text-align:center; color:#999; padding:32px 0 }
</style>
