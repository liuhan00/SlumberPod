<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import * as apiCommunity from '@/api/community'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { getPlaceholder } from '@/utils/image'

const { bgStyle } = useGlobalTheme()

const loading = ref(true)
const error = ref('')
const post = ref({})

onLoad(async (q)=>{
  const id = q?.id
  if(!id){ loading.value=false; error.value='缺少帖子ID'; return }
  // 仅允许纯数字ID调用后端，避免用前端占位ID触发404
  const isNumeric = /^\d+$/.test(String(id))
  if(!isNumeric){ loading.value=false; error.value='无效帖子ID'; return }
  const numericId = Number(id)
  try{
    const res = await apiCommunity.getCommunityDetail(numericId)
    const data = res?.data || res
    
    // 处理帖子数据
    post.value = {
      id: data.id || data.post_id || numericId,
      title: data.title || '',
      content: data.content || data.body || '',
      image: (data.imageUrls && data.imageUrls[0]) || data.image || data.cover_image || '',
      play_count: data.play_count || data.playCount || 0,
      favorite_count: data.favorite_count || data.favoriteCount || data.likes || 0,
      comment_count: data.comment_count || data.commentCount || (Array.isArray(data.comments) ? data.comments.length : 0),
      time: data.time || data.created_at || data.createdAt || '未知时间',
      author: data.author || { 
        name: data.userName || data.user_name || '用户', 
        avatar: data.author?.avatar || data.user_avatar || getPlaceholder('avatar') 
      },
      comments: Array.isArray(data.comments) ? data.comments : []
    }
    
    loading.value = false
  }catch(e){
    console.error('[community.detail] load failed', e)
    error.value = e?.message || '加载失败'
    loading.value = false
  }
})

function goBack() {
  try {
    uni.navigateBack()
  } catch(e) {
    if(typeof location !== 'undefined') location.hash = '#/pages/community/index'
  }
}

function openActions() {
  uni.showActionSheet({
    itemList: ['分享', '举报', '复制链接'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          uni.showToast({ title: '分享功能开发中', icon: 'none' })
          break
        case 1:
          uni.showToast({ title: '举报成功', icon: 'success' })
          break
        case 2:
          uni.setClipboardData({
            data: `帖子链接: ${window.location.href}`,
            success: () => {
              uni.showToast({ title: '链接已复制', icon: 'success' })
            }
          })
          break
      }
    }
  })
}

function formatTime(timeStr) {
  // 简单的时间格式化
  if (!timeStr) return '未知时间'
  return timeStr
}
</script>

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
