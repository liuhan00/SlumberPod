<template>
  <view class="page" :style="bgStyle">
    <view class="header">
      <text class="title">我的评论</text>
    </view>

    <scroll-view class="list-area" scroll-y>
      <view class="section">
        <view class="compose-card small">
          <textarea class="input" v-model="text" placeholder="写点什么..." />
          <view class="row"><button class="btn" @click="submit">发布</button></view>
        </view>

        <view class="list" v-if="items.length">
          <view class="item" v-for="it in items" :key="it.id">
            <text class="content">{{ it.text }}</text>
            <text class="time">{{ format(it.ts) }}</text>
            <view class="row"><button class="btn danger" @click="remove(it.id)">删除</button></view>
          </view>
        </view>

        <view class="empty" v-else>
          <text>暂无评论</text>
          <button class="cta" @click="goDiscover">去发现好声音</button>
        </view>
      </view>
    </scroll-view>

    <view class="composer fixed">
      <textarea class="input compact" v-model="text" placeholder="写点什么..." />
      <button class="btn primary" @click="submit">发布</button>
    </view>
  </view>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { useCommentsStore } from '@/stores/comments'
import { useRouter } from 'vue-router'
const { bgStyle } = useGlobalTheme()
const store = useCommentsStore(); store.load()
const items = computed(()=> store.items)
const text = ref('')
const router = useRouter()
function submit(){ if(!text.value.trim()){ uni.showToast({ title:'内容不能为空', icon:'none' }); return } store.add(text.value.trim()); text.value=''; uni.showToast({ title:'发布成功', icon:'success' }) }
function remove(id){ store.remove(id) }
function format(ts){ const d=new Date(ts); return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}` }
function goDiscover(){ try{ uni.switchTab({ url:'/pages/index/index' }) }catch(e){ try{ router.push('/') }catch(err){} } }
</script>
<style scoped>
.page{ display:flex; flex-direction:column; min-height:100vh }
.header{ padding:10px 16px; background: transparent }
.title{ font-size:16px; font-weight:600; color: var(--fg); margin:0; text-align:left }
.list-area{ flex:1; padding:12px 16px; }
.section{ padding-bottom:24px }
.compose-card.small{ background: var(--card-bg); color: var(--card-fg); border-radius:12px; padding:10px; box-shadow:0 1px 6px var(--shadow); margin-bottom:12px }
.input{ width:100%; min-height:80px; background: var(--input-bg); color: var(--fg); border-radius:8px; padding:8px 10px }
.input.compact{ min-height:44px; padding:8px 10px }
.row{ display:flex; justify-content:flex-end; margin-top:8px }
.composer.fixed{ position:fixed; left:12px; right:12px; bottom:14px; background: var(--card-bg); padding:10px; border-radius:12px; box-shadow:0 10px 30px rgba(12,16,22,0.12); display:flex; gap:8px; align-items:center; z-index:1200 }
.composer .btn{ margin-left:auto }
.btn{ padding:8px 12px; border-radius:10px; background: var(--input-bg); color: var(--fg) }
.btn.primary{ background: var(--accent, #2EA56B); color: #fff }
.danger{ background:#ffeded; color:#c62828 }
.list{ padding-top:6px }
.item{ background: var(--card-bg); color: var(--card-fg); border-radius:12px; padding:12px; box-shadow:0 1px 6px var(--shadow); margin-bottom:12px }
.content{ display:block; font-size:14px }
.time{ display:block; margin-top:8px; font-size:12px; color: var(--muted) }
.empty{ text-align:center; color: var(--muted); padding:40px 0 }
.empty .cta{ margin-top:12px; padding:8px 12px; border-radius:10px; background: rgba(46,165,107,0.1); color: var(--accent, #2EA56B); border:none }
/* ensure list not hidden behind fixed composer */
.list-area{ padding-bottom: 160px }
</style>
