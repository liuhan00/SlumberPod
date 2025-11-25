<template>
    <scroll-view class="page" scroll-y :style="bgStyle">
    <view class="section">
      <view class="header-row">
        <text class="title">我的评论</text>
        <text class="count">{{ items.length }} 条</text>
      </view>

      <view class="composer">
        <textarea class="input" v-model="text" placeholder="写点什么..." maxlength="300" auto-height="true" />
        <view class="row">
          <text class="hint">最多300字</text>
          <button class="btn" @click="submit">发布</button>
        </view>
      </view>

      <view class="list" v-if="items.length">
        <view class="item" v-for="it in items" :key="it.id">
          <text class="content">{{ it.text }}</text>
          <text class="time">{{ format(it.ts) }}</text>
          <view class="row small"><button class="btn danger" @click="remove(it.id)">删除</button></view>
        </view>
      </view>
      <view class="empty" v-else>暂无评论，快来发表第一条吧～</view>
    </view>
  </scroll-view>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { useCommentsStore } from '@/stores/comments'
const { bgStyle } = useGlobalTheme()
const store = useCommentsStore(); store.load()
const items = computed(()=> store.items)
const text = ref('')
function submit(){ if(!text.value.trim()){ uni.showToast({ title:'内容不能为空', icon:'none' }); return } store.add(text.value.trim()); text.value='' }
function remove(id){ store.remove(id) }
function format(ts){ const d=new Date(ts); return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}` }
</script>
<style scoped>
.page{ min-height:100vh }
.section{ padding: 18px 16px }
.header-row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px }
.title{ font-size:18px; font-weight:700; color: var(--fg) }
.count{ color:var(--muted); font-size:13px }
.composer{ background: var(--card-bg); color: var(--card-fg); border-radius:12px; padding:12px; box-shadow:0 4px 14px var(--shadow); margin-bottom:18px; box-sizing:border-box; overflow:hidden }
.input{ width:100%; min-height:110px; background: var(--input-bg); color: var(--fg); border-radius:10px; padding:12px 14px; font-size:15px; box-sizing:border-box; display:block; resize:none; border: none }
.row{ display:flex; justify-content:flex-end; align-items:center; gap:12px; margin-top:10px }
.row.small{ margin-top:8px }
.hint{ color:var(--muted); margin-right:auto; align-self:center }
.btn{ padding:8px 12px; border-radius:10px; background: var(--input-bg); color: var(--fg); box-sizing:border-box }
.list{ display:flex; flex-direction:column; gap:12px }
.item{ background: var(--card-bg); color: var(--card-fg); border-radius:12px; padding:12px; box-shadow:0 4px 14px var(--shadow); }
.content{ display:block; font-size:15px; line-height:1.6 }
.time{ display:block; margin-top:8px; font-size:12px; color: var(--muted) }
.btn{ padding:8px 12px; border-radius:10px; background: var(--input-bg); color: var(--fg) }
.danger{ background:#fffbfb; color:#c62828; border:1px solid rgba(198,40,40,0.08) }
.empty{ text-align:center; color: var(--muted); padding:40px 0 }
</style>