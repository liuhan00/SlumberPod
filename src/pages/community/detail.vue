<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import * as apiCommunity from '@/api/community'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { getPlaceholder } from '@/utils/image'
import { getAuthLocal } from '@/store/auth'

const { bgStyle } = useGlobalTheme()

const loading = ref(true)
const error = ref('')
const post = ref({})
const comments = ref([])
const newComment = ref('')

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
      favorite_count: data.favorite_count || data.like_count || data.likes || 0,
      comment_count: data.comment_count || data.commentCount || (Array.isArray(data.comments) ? data.comments.length : 0),
      time: data.time || data.created_at || data.createdAt || '未知时间',
      author: data.author || { 
        name: data.userName || data.user_name || '用户', 
        avatar: data.author?.avatar || data.user_avatar || getPlaceholder('avatar') 
      },
      comments: Array.isArray(data.comments) ? data.comments : []
    }
    
    // 加载评论
    await loadComments(numericId)
    
    loading.value = false
  }catch(e){
    console.error('[community.detail] load failed', e)
    error.value = e?.message || '加载失败'
    loading.value = false
  }
})

// 加载评论
async function loadComments(postId) {
  try {
    const res = await apiCommunity.getComments({ postId })
    const data = res?.data || res
    comments.value = Array.isArray(data) ? data : (data?.items || data?.comments || [])
  } catch(e) {
    console.error('[community.detail] load comments failed', e)
    comments.value = []
  }
}

function goBack() {
  try {
    uni.navigateBack()
  } catch(e) {
    if(typeof location !== 'undefined') location.hash = '#/pages/community/index'
  }
}

// 分享到朋友圈
function shareToMoments() {
  // 获取当前页面路径
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const baseUrl = `${currentPage.route}?id=${post.value.id}`
  
  // 检查是否支持分享到朋友圈
  if (typeof uni.shareToMoments === 'function') {
    uni.shareToMoments({
      title: post.value.title || '来看看这个有趣的帖子',
      content: post.value.content.substring(0, 50) + '...',
      imageUrl: post.value.image || '',
      path: baseUrl,
      success: () => {
        uni.showToast({ title: '分享成功', icon: 'success' })
      },
      fail: (err) => {
        console.error('分享失败', err)
        uni.showToast({ title: '分享失败', icon: 'none' })
      }
    })
  } else {
    // 如果不支持分享到朋友圈，使用通用分享
    uni.showActionSheet({
      itemList: ['发送给朋友', '分享到朋友圈', '复制链接'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 发送给朋友
            uni.share({
              title: post.value.title || '来看看这个有趣的帖子',
              content: post.value.content.substring(0, 50) + '...',
              href: `/${baseUrl}`,
              success: () => {
                uni.showToast({ title: '分享成功', icon: 'success' })
              },
              fail: () => {
                uni.showToast({ title: '分享失败', icon: 'none' })
              }
            })
            break
          case 1:
            // 复制链接
            uni.setClipboardData({
              data: `/${baseUrl}`,
              success: () => {
                uni.showToast({ title: '链接已复制，可在微信中分享', icon: 'success' })
              }
            })
            break
          case 2:
            // 复制链接
            uni.setClipboardData({
              data: `/${baseUrl}`,
              success: () => {
                uni.showToast({ title: '链接已复制', icon: 'success' })
              }
            })
            break
        }
      }
    })
  }
}

function openActions() {
  uni.showActionSheet({
    itemList: ['分享到朋友圈', '举报', '复制链接'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          shareToMoments()
          break
        case 1:
          uni.showToast({ title: '举报成功', icon: 'success' })
          break
        case 2:
          uni.setClipboardData({
            data: `${window.location.origin}/#/pages/community/detail?id=${post.value.id}`,
            success: () => {
              uni.showToast({ title: '链接已复制', icon: 'success' })
            }
          })
          break
      }
    }
  })
}

// 提交评论
async function submitComment() {
  if (!newComment.value.trim()) {
    uni.showToast({ title: '请输入评论内容', icon: 'none' })
    return
  }
  
  try {
    // 检查用户是否登录
    const auth = getAuthLocal()
    if (!auth || !auth.token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/auth/Login' })
      }, 1500)
      return
    }
    
    // 调用评论API
    const result = await apiCommunity.createComment({ 
      postId: post.value.id, 
      content: newComment.value 
    }, auth.token)
    
    // 更新本地数据
    const commentData = result?.data || {}
    comments.value.unshift({
      id: commentData.id || `c${Date.now()}`,
      content: newComment.value,
      created_at: '刚刚',
      author: {
        name: '我',
        avatar: getPlaceholder('avatar')
      }
    })
    
    // 清空输入框
    newComment.value = ''
    
    // 更新帖子的评论数
    post.value.comment_count = (post.value.comment_count || 0) + 1
    
    uni.showToast({ title: '评论成功', icon: 'success' })
  } catch(e) {
    console.error('[community.detail] submit comment failed', e)
    uni.showToast({ title: '评论失败', icon: 'none' })
  }
}

// 点赞帖子
async function likePost() {
  try {
    // 检查用户是否登录
    const auth = getAuthLocal()
    if (!auth || !auth.token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/auth/Login' })
      }, 1500)
      return
    }
    
    // 调用点赞API
    await apiCommunity.likePost({ postId: post.value.id }, auth.token)
    
    // 更新本地数据
    post.value.favorite_count = (post.value.favorite_count || 0) + 1
    
    uni.showToast({ title: '点赞成功', icon: 'success' })
  } catch(e) {
    console.error('[community.detail] like post failed', e)
    uni.showToast({ title: '点赞失败', icon: 'none' })
  }
}

function formatTime(timeStr) {
  // 简单的时间格式化
  if (!timeStr) return '未知时间'
  return timeStr
}
</script>

<template>
  <view class="page">
    <!-- 背景图片容器 -->
    <view class="background-container">
      <image class="background-image" src="/static/find.png" mode="aspectFill" />
    </view>
    
    <!-- Topbar -->
    <view class="topbar">
      <button class="tb-btn tb-back" @click="goBack">←</button>
      <text class="tb-title">帖子详情</text>
      <button class="tb-btn tb-share" @click="shareToMoments">↗️</button>
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
          <view class="chip" @click="likePost">
            <text class="chip-icon">👍</text>
            <text class="chip-text">{{ post.favorite_count || 0 }}</text>
          </view>
          <view class="chip">
            <text class="chip-icon">💬</text>
            <text class="chip-text">{{ post.comment_count || 0 }}</text>
          </view>
        </view>

        <!-- 评论输入框 -->
        <view class="comment-input">
          <textarea 
            v-model="newComment" 
            class="comment-textarea" 
            placeholder="写下你的评论..." 
            auto-height
          />
          <button class="comment-submit" @click="submitComment">发送</button>
        </view>

        <!-- 评论列表 -->
        <view class="comments">
          <view v-for="comment in comments" :key="comment.id" class="comment">
            <image 
              class="comment-avatar" 
              :src="comment.author?.avatar || getPlaceholder('avatar')" 
              mode="aspectFill" 
            />
            <view class="comment-content">
              <view class="comment-header">
                <text class="comment-author">{{ comment.author?.name || '用户' }}</text>
                <text class="comment-time">{{ comment.created_at || '刚刚' }}</text>
              </view>
              <text class="comment-text">{{ comment.content }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.page{ 
  min-height: 100vh;
  position: relative;
}

/* 背景图片容器 */
.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.topbar{ 
  position:sticky; 
  top:0; 
  display:flex; 
  align-items:center; 
  justify-content:center; 
  padding:10px 14px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #f0f0f0;
  z-index: 100;
}
.tb-btn{ background:transparent; border:none; font-size:18px; color: var(--card-fg, #13303f) }
.tb-back{ position:absolute; left:12px; }
.tb-share{ position:absolute; right:12px; }
.tb-title{ font-size:16px; font-weight:700; color: var(--card-fg, #13303f) }
.content{ flex:1; margin-top: 10px; }

/* Card - glass style to match app */
.card{ 
  margin:14px; 
  padding:14px; 
  border-radius:14px; 
  background: var(--card-bg, rgba(255,255,255,0.92)); 
  box-shadow: 0 12px 28px rgba(0,0,0,0.08);
  backdrop-filter: blur(10px);
}
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

/* 评论输入框 */
.comment-input{ 
  display: flex; 
  margin-top: 20px; 
  padding: 10px; 
  background: var(--card-bg, rgba(255,255,255,0.92)); 
  border-radius: 8px; 
  gap: 10px;
  backdrop-filter: blur(5px);
}
.comment-textarea{ 
  flex: 1; 
  padding: 8px; 
  border: 1px solid #ddd; 
  border-radius: 4px; 
  font-size: 14px; 
  background: white;
}
.comment-submit{ 
  padding: 8px 16px; 
  background: #007aff; 
  color: white; 
  border: none; 
  border-radius: 4px; 
  font-size: 14px;
}

/* 评论列表 */
.comments{ margin-top: 20px; }
.comment{ 
  display: flex; 
  padding: 10px 0; 
  border-bottom: 1px solid #eee; 
}
.comment-avatar{ 
  width: 32px; 
  height: 32px; 
  border-radius: 50%; 
  margin-right: 10px; 
}
.comment-content{ flex: 1; }
.comment-header{ display: flex; justify-content: space-between; margin-bottom: 4px; }
.comment-author{ font-weight: 500; font-size: 14px; color: #333; }
.comment-time{ font-size: 12px; color: #999; }
.comment-text{ font-size: 14px; color: #666; line-height: 1.4; }

/* 加载和错误状态 */
.loading, .error {
  padding: 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  margin: 16px;
  backdrop-filter: blur(5px);
}

.skeleton {
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 10px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton.title {
  height: 24px;
  width: 60%;
  margin-bottom: 16px;
}

.skeleton.line {
  height: 16px;
  width: 100%;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>