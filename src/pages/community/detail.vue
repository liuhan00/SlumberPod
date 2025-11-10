<template>
  <view class="page" :style="bgStyle">
    <!-- Topbar -->
    <view class="topbar">
      <button class="tb-btn tb-back" @click="goBack">←</button>
      <text class="tb-title">帖子详情</text>
    </view>

    <scroll-view class="content" scroll-y>
      <view v-if="loading" class="loading">
        <view class="skeleton title"></view>
        <view class="skeleton line"></view>
        <view class="skeleton line"></view>
      </view>

      <view v-else-if="error" class="error">
        {{ error }}
      </view>

      <view v-else class="card">
        <!-- Header: avatar + author + time -->
        <view class="header">
          <image v-if="post.author?.avatar" class="avatar" :src="post.author.avatar" mode="aspectFill" />
          <view class="author">
            <text class="name">{{ post.author?.name || '用户' }}</text>
            <text class="time">{{ formatTime(post.time) }}</text>
          </view>
          <button class="more" @click="openActions">⋯</button>
        </view>

        <!-- Title -->
        <text class="title">{{ post.title }}</text>

        <!-- Cover -->
        <image v-if="post.image" class="cover" :src="post.image" mode="aspectFill" />

        <!-- Content -->
        <text class="body">{{ post.content }}</text>

        <!-- Stats -->
        <view class="chips">
          <view class="chip"><text class="chip-icon">▶</text><text class="chip-text">播放 {{ post.play_count ?? 0 }}</text></view>
          <view class="chip"><text class="chip-icon">❤</text><text class="chip-text">喜欢 {{ post.favorite_count ?? 0 }}</text></view>
          <view class="chip"><text class="chip-icon">💬</text><text class="chip-text">评论 {{ post.comment_count ?? (post.comments?.length || 0) }}</text></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import * as apiCommunity from '@/api/community'
import { useGlobalTheme } from '@/composables/useGlobalTheme'

const { bgStyle } = useGlobalTheme()

const loading = ref(true)
const error = ref('')
const post = ref({})

onLoad(async (q)=>{
  const id = q?.id
  if(!id){ loading.value=false; error.value='缺少帖子ID'; return }
  try{
    const res = await apiCommunity.getCommunityDetail(id)
    const data = res?.data || res
    post.value = {
      id: data.id || data.post_id || id,
      title: data.title || '',
      content: data.content || data.body || '',
      image: data.image || (data.imageUrls && data.imageUrls[0]) || '',
      time: data.created_at || data.createdAt || '',
      favorite_count: data.favorite_count ?? 0,
      comment_count: data.comment_count ?? 0,
      play_count: data.play_count ?? 0,
      author: { name: data.user_name || data.author?.name || '用户', avatar: data.user_avatar || data.author?.avatar || '' }
    }
  }catch(e){ error.value = String(e?.message || e) }
  finally{ loading.value=false }
})

function goBack(){ try{ uni.navigateBack() }catch(e){ history.back() } }

function openActions(){ uni.showActionSheet({ itemList:['举报','收藏'], success(r){ uni.showToast({ title:'已操作', icon:'success' }) } }) }

function formatTime(t){
  if(!t) return ''
  try{
    const d = new Date(t)
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2,'0')
    const dd = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${dd}`
  }catch{ return String(t) }
}
</script>

<style scoped>
.page{ min-height:100vh }
.topbar{ position:sticky; top:0; display:flex; align-items:center; justify-content:center; padding:10px 14px }
.tb-btn{ background:transparent; border:none; font-size:18px; color: var(--card-fg, #13303f) }
.tb-back{ position:absolute; left:12px; }
.tb-title{ font-size:16px; font-weight:700; color: var(--card-fg, #13303f) }
.content{ flex:1 }

/* Card - glass style to match app */
.card{ margin:14px; padding:14px; border-radius:14px; background: var(--card-bg, rgba(255,255,255,0.92)); box-shadow: 0 12px 28px rgba(0,0,0,0.08) }
.header{ display:flex; align-items:center; gap:10px; margin-bottom:8px }
.avatar{ width:40px; height:40px; border-radius:50% }
.author{ display:flex; flex-direction:column }
.name{ font-weight:700; color: var(--card-fg, #13303f) }
.time{ font-size:12px; color: #7d8b99 }
.more{ margin-left:auto; background:transparent; border:none; color:#9aa7b5; font-size:18px }

.title{ display:block; font-size:20px; font-weight:800; color: var(--card-fg, #13303f); margin:6px 0 10px }
.cover{ width:100%; height:200px; border-radius:12px; margin:8px 0; box-shadow: 0 8px 20px rgba(0,0,0,0.06) }
.body{ display:block; font-size:15px; line-height:1.8; color: var(--card-fg, #13303f) }

.chips{ display:flex; gap:8px; flex-wrap:wrap; margin-top:12px }
.chip{ display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background: var(--input-bg, #f1f8ff); color: var(--card-fg, #13303f); box-shadow: 0 6px 16px rgba(0,0,0,0.06) }
.chip-icon{ font-size:14px }
.chip-text{ font-size:13px }

/* Loading skeleton */
.loading{ padding:20px }
.skeleton{ background: linear-gradient(90deg, #f2f4f8 25%, #e9edf3 37%, #f2f4f8 63%); background-size: 400% 100%; animation: shimmer 1.4s ease infinite; border-radius:8px }
.skeleton.title{ height:20px; margin:14px }
.skeleton.line{ height:12px; margin:10px 14px }
@keyframes shimmer{ 0%{ background-position: 100% 0 } 100%{ background-position: -100% 0 } }

.error{ padding:20px; text-align:center; color:#d14 }
</style>
