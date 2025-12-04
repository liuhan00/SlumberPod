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
      comments: Array.isArray(data.comments) ? data.comments : [],
      user_liked: data.user_liked || false // 添加用户点赞状态
    }
    
    // 加载评论
    await loadComments(numericId)
    
    // 确保评论数量显示正确
    post.value.comment_count = comments.value.length
    
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
    let commentsData = Array.isArray(data) ? data : (data?.items || data?.comments || [])
    
    // 确保每条评论都有 id 字段
    commentsData = commentsData.map(comment => {
      // 如果评论没有 id 字段，尝试从其他字段获取
      if (!comment.id) {
        if (comment.comment_id) {
          comment.id = comment.comment_id
        } else if (comment._id) {
          comment.id = comment._id
        } else {
          // 如果还是没有 id，生成一个临时的
          comment.id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      }
      
      // 确保评论有点赞相关字段
      if (comment.like_count === undefined) {
        comment.like_count = comment.likes || comment.likeCount || 0
      }
      
      if (comment.user_liked === undefined) {
        comment.user_liked = comment.liked || false
      }
      
      return comment
    })
    
    comments.value = commentsData
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
    itemList: ['分享', '举报', '取消'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          shareToMoments()
          break
        case 1:
          uni.showModal({
            title: '举报',
            content: '请选择举报原因',
            editable: true,
            placeholderText: '请输入举报原因',
            success: (modalRes) => {
              if (modalRes.confirm) {
                uni.showToast({ title: '举报成功', icon: 'success' })
              }
            }
          })
          break
        case 2:
          // 取消，关闭菜单
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
    
    // 获取当前用户信息
    const currentUser = {
      id: auth.id || auth.userId || auth.user?.id || auth.user?.userId || null,
      name: auth.name || auth.user?.name || auth.nickname || auth.user?.nickname || '我',
      avatar: auth.avatar || auth.user?.avatar || getPlaceholder('avatar')
    }
    
    // 确保评论有正确的结构
    const newCommentObj = {
      id: commentData.id || commentData.comment_id || `c${Date.now()}`,
      content: newComment.value,
      created_at: '刚刚',
      author: currentUser,
      like_count: 0,
      user_liked: false
    }
    
    comments.value.unshift(newCommentObj)
    
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
    const result = await apiCommunity.likePost({ postId: post.value.id }, auth.token)
    
    // 更新本地数据
    // 根据后端返回的状态来判断是点赞还是取消点赞
    if (result && typeof result === 'object') {
      if (result.liked !== undefined) {
        // 后端明确返回了点赞状态
        post.value.favorite_count = result.like_count || post.value.favorite_count || 0
      } else {
        // 默认认为是切换操作，根据当前状态判断
        if (post.value.user_liked) {
          // 当前已点赞，现在取消点赞
          post.value.favorite_count = Math.max(0, (post.value.favorite_count || 0) - 1)
          post.value.user_liked = false
        } else {
          // 当前未点赞，现在点赞
          post.value.favorite_count = (post.value.favorite_count || 0) + 1
          post.value.user_liked = true
        }
      }
    } else {
      // 兼容之前的逻辑
      post.value.favorite_count = (post.value.favorite_count || 0) + 1
    }
    
    // 显示相应的提示信息
    const message = post.value.user_liked ? '点赞成功' : '已取消点赞'
    uni.showToast({ title: message, icon: 'success' })
  } catch(e) {
    console.error('[community.detail] like post failed', e)
    uni.showToast({ title: '点赞操作失败', icon: 'none' })
  }
}

function formatTime(timeStr) {
  // 简单的时间格式化
  if (!timeStr) return '未知时间'
  return timeStr
}

// 检查评论是否由当前用户发布
function isCommentAuthor(comment) {
  const auth = getAuthLocal()
  // 检查认证信息和评论作者信息是否存在
  if (!auth || !comment.author) {
    console.log('[community.detail] Auth or comment author missing', { auth: !!auth, commentAuthor: !!comment.author })
    return false
  }
  
  // 获取当前用户ID（支持多种格式）
  const currentUserId = auth.id || auth.userId || auth.user?.id || auth.user?.userId || null
  if (!currentUserId) {
    console.log('[community.detail] Current user ID not found', auth)
    return false
  }
  
  // 获取评论作者ID（支持多种格式）
  const commentAuthorId = comment.author.id || comment.author.userId || comment.author._id || null
  if (!commentAuthorId) {
    console.log('[community.detail] Comment author ID not found', comment.author)
    return false
  }
  
  // 比较ID是否相同（转换为字符串比较）
  const isAuthor = String(currentUserId) === String(commentAuthorId)
  console.log('[community.detail] Author check', { currentUserId, commentAuthorId, isAuthor })
  return isAuthor
}

// 删除评论
async function deleteComment(comment) {
  // 显示确认对话框
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条评论吗？删除后不可恢复。',
    success: async (res) => {
      if (res.confirm) {
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
          
          // 调用删除评论API
          await apiCommunity.deleteComment({ commentId: comment.id }, auth.token)
          
          // 更新本地数据
          comments.value = comments.value.filter(c => c.id !== comment.id)
          
          // 更新帖子的评论数
          post.value.comment_count = (post.value.comment_count || 0) - 1
          
          uni.showToast({ title: '评论已删除', icon: 'success' })
        } catch(e) {
          console.error('[community.detail] delete comment failed', e)
          uni.showToast({ title: '删除评论失败', icon: 'none' })
        }
      }
    }
  })
}

// 点赞/取消点赞评论
async function likeComment(comment) {
  try {
    // 添加调试信息
    console.log('[community.detail] likeComment called with comment:', comment);
    
    // 验证评论ID
    if (!comment || !comment.id) {
      console.error('[community.detail] Invalid comment or missing comment.id:', comment);
      uni.showToast({ title: '评论信息不完整', icon: 'none' });
      return;
    }
    
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
    
    // 保存当前状态以便回滚
    const originalComments = [...comments.value];
    
    // 先更新本地数据（乐观更新）
    const updatedComments = comments.value.map(c => {
      if (c.id === comment.id) {
        // 创建新的评论对象，避免直接修改响应式数据
        const updatedComment = { ...c }
        // 切换点赞状态
        if (updatedComment.user_liked) {
          // 当前已点赞，现在取消点赞
          updatedComment.like_count = Math.max(0, (updatedComment.like_count || 0) - 1)
          updatedComment.user_liked = false
        } else {
          // 当前未点赞，现在点赞
          updatedComment.like_count = (updatedComment.like_count || 0) + 1
          updatedComment.user_liked = true
        }
        return updatedComment
      }
      return c
    })
    
    // 更新评论列表
    comments.value = updatedComments
    
    // 调用点赞评论API
    const result = await apiCommunity.likeComment({ commentId: comment.id }, auth.token)
    
    // 如果API返回了新的状态，使用API返回的状态更新本地数据
    if (result && typeof result === 'object' && result.liked !== undefined) {
      const finalComments = comments.value.map(c => {
        if (c.id === comment.id) {
          const finalComment = { ...c }
          finalComment.like_count = result.like_count || finalComment.like_count || 0
          finalComment.user_liked = result.liked
          return finalComment
        }
        return c
      })
      comments.value = finalComments
    }
    
    // 显示相应的提示信息
    const targetComment = comments.value.find(c => c.id === comment.id)
    const message = targetComment?.user_liked ? '点赞成功' : '已取消点赞'
    uni.showToast({ title: message, icon: 'success' })
  } catch(e) {
    console.error('[community.detail] like comment failed', e)
    // 回滚到原始状态
    comments.value = originalComments
    uni.showToast({ title: '点赞操作失败: ' + (e.message || '未知错误'), icon: 'none' })
  }
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
      <view class="topbar-left">
        <button class="tb-btn tb-back" @click="goBack">←</button>
      </view>
      <view class="topbar-right">
        <button class="tb-btn tb-menu" @click="openActions">⋯</button>
      </view>
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
        </view>

        <!-- Title -->
        <text class="title">{{ post.title }}</text>

        <!-- Cover -->
        <view class="cover-container" v-if="post.image">
          <image class="cover" :src="post.image" mode="aspectFill" />
        </view>

        <!-- Content -->
        <text class="body">{{ post.content }}</text>

        <!-- Stats -->
        <view class="chips">
          <view class="chip" :class="{ liked: post.user_liked }" @click="likePost">
            <text class="chip-icon">👍</text>
            <text class="chip-text">{{ post.favorite_count || 0 }}</text>
          </view>
          <view class="chip">
            <text class="chip-icon">💬</text>
            <text class="chip-text">{{ post.comment_count || 0 }}</text>
          </view>
        </view>

        <!-- 评论标题 -->
        <view class="comments-header">
          <text class="comments-title">{{ comments.length }}</text>
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
              <!-- 评论操作区域 -->
              <view class="comment-footer">
                <!-- 点赞按钮 -->
                <view class="comment-like" @click="likeComment(comment)">
                  <text class="like-icon" :class="{ liked: comment.user_liked }">👍</text>
                  <text class="like-count">{{ comment.like_count || 0 }}</text>
                </view>
                <!-- 删除评论按钮（仅作者可见） -->
                <button 
                  v-if="isCommentAuthor(comment)" 
                  class="delete-comment-btn" 
                  @click="deleteComment(comment)"
                >
                  删除
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 评论输入框 -->
    <view class="comment-input-container">
      <view class="comment-input">
        <textarea 
          v-model="newComment" 
          class="comment-textarea" 
          placeholder="评论接小幸运" 
          auto-height
        />
        <button class="comment-submit" @click="submitComment">发送</button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page{ 
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
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
  justify-content:space-between;
  padding:10px 14px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  z-index: 100;
}

.topbar-left {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}

.topbar-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.tb-btn{ 
  background:transparent; 
  border:none; 
  font-size:18px; 
  color: var(--card-fg, #13303f);
  padding: 8px 12px; /* 增加点击区域 */
}

.tb-back {
  margin-left: -8px; /* 微调位置使按钮更靠近屏幕边缘 */
}

.tb-menu{ }
.tb-title{ font-size:16px; font-weight:700; color: var(--card-fg, #13303f) }
.content{ flex:1; margin-top: 10px; }
.content { flex: 1; padding-bottom: 60px; }

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
.cover-container {
  position: relative;
  width: 100%;
  margin: 8px 0;
}
.cover-container::before {
  content: "";
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px dashed #ccc;
  border-radius: 16px;
  pointer-events: none;
}
.cover{ 
  width: 100%; 
  height: 200px; 
  border-radius: 12px; 
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
  display: block;
}

.body{ display:block; font-size:15px; line-height:1.8; color: var(--card-fg, #13303f) }

.chips{ display:flex; gap:8px; flex-wrap:wrap; margin-top:12px }
.chip{ display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background: var(--input-bg, #f1f8ff); color: var(--card-fg, #13303f); box-shadow: 0 6px 16px rgba(0,0,0,0.06) }
.chip-icon{ font-size:14px }
.chip-text{ font-size:13px }
.chip.liked { background: #007aff; color: white; }

/* 评论标题 */
.comments-header {
  margin-top: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}
.comments-title {
  font-weight: bold;
  font-size: 16px;
  color: var(--card-fg, #13303f);
}

/* 评论列表 */
.comments{ margin-top: 10px; }
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
.comment-footer { display: flex; justify-content: flex-end; margin-top: 5px; align-items: center; }

/* 删除评论按钮 */
.delete-comment-btn {
  margin-top: 5px;
  padding: 4px 8px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  align-self: flex-end;
  display: inline-block; /* 确保按钮可见 */
  cursor: pointer;
  min-width: 40px; /* 确保按钮有足够的宽度 */
  text-align: center;
}

/* 评论点赞样式 */
.comment-like {
  display: flex;
  align-items: center;
  margin-right: 10px;
  cursor: pointer;
}

.like-icon {
  font-size: 14px;
  margin-right: 4px;
}

.like-icon.liked {
  color: #007aff;
}

.like-count {
  font-size: 12px;
  color: #666;
}

/* 评论输入框容器 */
.comment-input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #eee;
}
.comment-input{ 
  display: flex; 
  gap: 10px;
  align-items: flex-end;
}
.comment-textarea{ 
  flex: 1; 
  padding: 8px; 
  border: 1px solid #ddd; 
  border-radius: 20px; 
  font-size: 14px; 
  background: white;
  min-height: 36px;
  max-height: 100px;
}
.comment-submit{ 
  padding: 8px 16px; 
  background: #007aff; 
  color: white; 
  border: none; 
  border-radius: 20px; 
  font-size: 14px;
}

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

/* 动效 */
.tb-menu {
  transition: transform 0.2s ease;
}

.tb-menu:active {
  transform: scale(1.2);
}
</style>