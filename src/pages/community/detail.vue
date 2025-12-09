<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import * as apiCommunity from '@/api/community'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { getPlaceholder, safeImageUrl } from '@/utils/image'
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
        avatar: safeImageUrl(
          data.author?.avatar || 
          data.user_avatar || 
          data.avatar_url ||
          getPlaceholder('avatar'),
          'avatar'
        ) 
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
    
    // 分离一级评论和二级评论（回复）
    const topLevelComments = []
    const repliesMap = {}
    
    // 处理所有评论数据
    commentsData.forEach(comment => {
      // 确保每条评论都有 id 字段
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
      
      // 确保评论有作者信息和头像
      if (!comment.author) {
        comment.author = {
          name: comment.userName || comment.user_name || '用户',
          avatar: safeImageUrl(
            comment.author?.avatar || 
            comment.user_avatar || 
            comment.avatar_url ||
            getPlaceholder('avatar'),
            'avatar'
          )
        }
      } else if (!comment.author.avatar) {
        comment.author.avatar = safeImageUrl(
          comment.author?.avatar || 
          comment.user_avatar || 
          comment.avatar_url ||
          getPlaceholder('avatar'),
          'avatar'
        )
      }
      
      // 根据 parent_id 分类评论
      if (!comment.parent_id) {
        // 一级评论
        comment.replies = [] // 初始化回复数组
        topLevelComments.push(comment)
      } else {
        // 二级评论（回复）
        if (!repliesMap[comment.parent_id]) {
          repliesMap[comment.parent_id] = []
        }
        repliesMap[comment.parent_id].push(comment)
      }
    })
    
    // 将回复附加到对应的一级评论
    topLevelComments.forEach(comment => {
      if (repliesMap[comment.id]) {
        comment.replies = repliesMap[comment.id]
      }
    })
    
    comments.value = topLevelComments
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
      avatar: safeImageUrl(auth.avatar || auth.user?.avatar || getPlaceholder('avatar'), 'avatar')
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
    
    // 保存当前状态以便回滚
    const originalUserLiked = post.value.user_liked
    const originalFavoriteCount = post.value.favorite_count
    
    // 调用点赞API
    const result = await apiCommunity.likePost({ postId: post.value.id }, auth.token)
    
    // API调用成功后，再更新本地数据
    // 如果API返回了新的状态，使用API返回的状态更新本地数据
    if (result && typeof result === 'object') {
      // 检查是否有明确的点赞状态返回
      if (result.hasOwnProperty('liked')) {
        post.value.user_liked = result.liked
      }
      
      // 检查是否有明确的点赞数返回
      if (result.hasOwnProperty('like_count')) {
        post.value.favorite_count = result.like_count
      } else if (result.hasOwnProperty('favorite_count')) {
        post.value.favorite_count = result.favorite_count
      }
    } else {
      // 如果API没有返回明确的状态，根据操作类型更新状态
      if (originalUserLiked) {
        // 执行取消点赞操作
        post.value.favorite_count = Math.max(0, (post.value.favorite_count || 0) - 1)
        post.value.user_liked = false
      } else {
        // 执行点赞操作
        post.value.favorite_count = (post.value.favorite_count || 0) + 1
        post.value.user_liked = true
      }
    }
    
    // 根据后端返回的实际状态显示提示信息
    let message = '操作成功'
    if (result && typeof result === 'object' && result.hasOwnProperty('liked')) {
      // 根据后端返回的点赞状态显示提示信息
      message = result.liked ? '点赞成功' : '已取消点赞'
    } else {
      // 如果后端没有返回明确的点赞状态，根据前后状态变化判断
      if (post.value.user_liked !== originalUserLiked) {
        message = post.value.user_liked ? '点赞成功' : '已取消点赞'
      }
    }
    
    uni.showToast({ title: message, icon: 'success' })
  } catch(e) {
    console.error('[community.detail] like post failed', e)
    // 回滚到原始状态
    post.value.user_liked = originalUserLiked
    post.value.favorite_count = originalFavoriteCount
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

// 回复评论
async function replyToComment(parentComment) {
  // 弹出输入框让用户输入回复内容
  uni.showModal({
    title: '回复评论',
    editable: true,
    placeholderText: '请输入回复内容',
    success: async (modalRes) => {
      if (modalRes.confirm) {
        const replyContent = modalRes.content;
        if (!replyContent || replyContent.trim() === '') {
          uni.showToast({ title: '回复内容不能为空', icon: 'none' });
          return;
        }
        
        try {
          // 检查用户是否登录
          const auth = getAuthLocal();
          if (!auth || !auth.token) {
            uni.showToast({
              title: '请先登录',
              icon: 'none'
            });
            setTimeout(() => {
              uni.navigateTo({ url: '/pages/auth/Login' });
            }, 1500);
            return;
          }
          
          // 调用创建回复API（需要传递parent_id）
          const postId = post.value.id;
          const result = await apiCommunity.createComment({
            postId,
            content: replyContent,
            parent_id: parentComment.id // 添加parent_id字段
          }, auth.token);
          
          // 更新本地数据
          if (result && result.data) {
            // 确保回复有必要的字段
            const newReply = {
              ...result.data,
              id: result.data.id || result.data.comment_id || result.data._id,
              like_count: result.data.like_count || result.data.likes || 0,
              user_liked: false,
              replies: [] // 回复不应该再有回复
            };
            
            // 将新回复添加到对应的一级评论中
            const updatedComments = comments.value.map(comment => {
              if (comment.id === parentComment.id) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newReply]
                };
              }
              return comment;
            });
            
            comments.value = updatedComments;
            
            // 更新帖子的评论计数
            post.value.comment_count = (post.value.comment_count || 0) + 1;
            
            uni.showToast({ title: '回复成功', icon: 'success' });
          }
        } catch (e) {
          console.error('[community.detail] reply comment failed', e);
          uni.showToast({ title: '回复失败: ' + (e.message || '未知错误'), icon: 'none' });
        }
      }
    }
  });
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
                <!-- 回复按钮 -->
                <button 
                  class="reply-comment-btn" 
                  @click="replyToComment(comment)"
                >
                  回复
                </button>
              </view>
              
              <!-- 回复列表 -->
              <view v-if="comment.replies && comment.replies.length > 0" class="replies">
                <view v-for="reply in comment.replies" :key="reply.id" class="reply">
                  <image 
                    class="reply-avatar" 
                    :src="reply.author?.avatar || getPlaceholder('avatar')" 
                    mode="aspectFill" 
                  />
                  <view class="reply-content">
                    <view class="reply-header">
                      <text class="reply-author">{{ reply.author?.name || '用户' }}</text>
                      <text class="reply-time">{{ reply.created_at || '刚刚' }}</text>
                    </view>
                    <text class="reply-text">{{ reply.content }}</text>
                    <!-- 回复操作区域 -->
                    <view class="reply-footer">
                      <!-- 点赞按钮 -->
                      <view class="reply-like" @click="likeComment(reply)">
                        <text class="like-icon" :class="{ liked: reply.user_liked }">👍</text>
                        <text class="like-count">{{ reply.like_count || 0 }}</text>
                      </view>
                      <!-- 删除回复按钮（仅作者可见） -->
                      <button 
                        v-if="isCommentAuthor(reply)" 
                        class="delete-reply-btn" 
                        @click="deleteComment(reply)"
                      >
                        删除
                      </button>
                    </view>
                  </view>
                </view>
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

.topbar { 
  position: sticky; 
  top: 0; 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  z-index: 100;
  backdrop-filter: blur(10px);
}

.tb-btn { 
  background: transparent; 
  border: none; 
  font-size: 20px; 
  color: var(--card-fg, #13303f);
  padding: 10px 14px; /* 增加点击区域 */
  border-radius: 50%;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tb-btn:hover {
  background: #f1f3f5;
  color: #495057;
}

.tb-back {
  margin-left: -10px; /* 微调位置使按钮更靠近屏幕边缘 */
}

.tb-menu{ }
.tb-title{ font-size:16px; font-weight:700; color: var(--card-fg, #13303f) }
.content{ flex:1; margin-top: 10px; }
.content { flex: 1; padding-bottom: 60px; }

/* Card - glass style to match app */
.card { 
  margin: 16px; 
  padding: 20px; 
  border-radius: 16px; 
  background: var(--card-bg, rgba(255,255,255,0.7)); /* 降低背景不透明度从0.95到0.7 */
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.18);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}

.header { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.avatar { 
  width: 48px; 
  height: 48px; 
  border-radius: 50%;
  border: 3px solid #e9ecef;
  object-fit: cover;
}

.author { 
  display: flex; 
  flex-direction: column;
}

.name { 
  font-weight: 700; 
  color: var(--card-fg, #13303f);
  font-size: 16px;
}

.time { 
  font-size: 13px; 
  color: #868e96;
}

.more { 
  margin-left: auto; 
  background: transparent; 
  border: none; 
  color: #9aa7b5; 
  font-size: 20px;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.more:hover {
  background: #f1f3f5;
  color: #495057;
}

.title { 
  display: block; 
  font-size: 22px; 
  font-weight: 800; 
  color: var(--card-fg, #13303f); 
  margin: 8px 0 16px;
  line-height: 1.3;
}

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

.chips { 
  display: flex; 
  gap: 12px; 
  flex-wrap: wrap; 
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.chip { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  padding: 8px 16px; 
  border-radius: 999px; 
  background: linear-gradient(135deg, #f1f8ff 0%, #e6f2ff 100%); 
  color: var(--card-fg, #13303f); 
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  cursor: pointer;
}

.chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}

.chip-icon { 
  font-size: 16px;
  transition: all 0.2s ease;
}

.chip:hover .chip-icon {
  transform: scale(1.1);
}

.chip-text { 
  font-size: 14px;
  font-weight: 500;
}

.chip.liked { 
  background: linear-gradient(135deg, #007aff 0%, #3395ff 100%); 
  color: white; 
}

/* 评论标题 */
.comments-header {
  margin-top: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.comments-title {
  font-weight: 700;
  font-size: 18px;
  color: var(--card-fg, #13303f);
  display: flex;
  align-items: center;
  gap: 8px;
}

.comments-title::before {
  content: "💬";
}

/* 评论列表 */
.comments{ margin-top: 10px; }
.comment{ 
  display: flex; 
  padding: 12px 0; 
  border-bottom: 1px solid #eee;
  transition: all 0.2s ease;
  background: transparent;
  border-radius: 0;
}

.comment:hover {
  background-color: #f8f9fa;
}

.comment-avatar { 
  width: 36px; 
  height: 36px; 
  border-radius: 50%; 
  margin-right: 10px;
  border: 2px solid #e9ecef;
  object-fit: cover;
}

.comment-content { 
  flex: 1; 
  min-width: 0;
}

.comment-header { 
  display: flex; 
  justify-content: space-between; 
  margin-bottom: 6px; 
  align-items: center;
}

.comment-author { 
  font-weight: 600; 
  font-size: 14px; 
  color: #3742fa;
}

.comment-time { 
  font-size: 11px; 
  color: #868e96;
}

.comment-text { 
  font-size: 14px; 
  color: #495057; 
  line-height: 1.4;
  margin-bottom: 8px;
  word-wrap: break-word;
}

.comment-footer { 
  display: flex; 
  justify-content: flex-end; 
  margin-top: 6px; 
  align-items: center; 
  gap: 12px;
}

/* 删除评论按钮 */
.delete-comment-btn {
  padding: 4px 10px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 11px;
  cursor: pointer;
  min-width: 40px;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.2);
  transition: all 0.2s ease;
}

.delete-comment-btn:hover {
  background: linear-gradient(135deg, #ff5252 0%, #ff7b7b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
}

/* 评论点赞样式 */
.comment-like {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.comment-like:hover {
  background-color: #e9ecef;
}

.like-icon {
  font-size: 16px;
  margin-right: 6px;
  transition: all 0.2s ease;
}

.like-icon.liked {
  color: #007aff;
  transform: scale(1.1);
}

.like-count {
  font-size: 13px;
  color: #868e96;
  font-weight: 500;
}

/* 评论输入框容器 */
.comment-input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-top: 1px solid #e9ecef;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.comment-input { 
  display: flex; 
  gap: 10px;
  align-items: flex-end;
  background: #f8f9fa;
  border-radius: 20px;
  padding: 6px 12px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.comment-input:focus-within {
  border-color: #3742fa;
  box-shadow: 0 0 0 2px rgba(55, 66, 250, 0.2);
}

.comment-textarea { 
  flex: 1; 
  padding: 8px 0; 
  border: none; 
  border-radius: 20px; 
  font-size: 14px; 
  background: transparent;
  min-height: 20px;
  max-height: 100px;
  resize: none;
  outline: none;
  color: #495057;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.comment-textarea::placeholder {
  color: #adb5bd;
}

.comment-submit { 
  padding: 6px 16px; 
  background: linear-gradient(135deg, #6a7ffa 0%, #8c9afb 100%); /* 使用更浅的蓝色 */
  color: white; 
  border: none; 
  border-radius: 16px; 
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(106, 127, 250, 0.3); /* 调整阴影颜色 */
}

.comment-submit:hover {
  background: linear-gradient(135deg, #5a6ff9 0%, #7c8afa 100%); /* 悬停时稍微深一点 */
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(106, 127, 250, 0.4); /* 调整阴影颜色 */
}

.comment-submit:active {
  transform: translateY(0);
}

/* 全局动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.fade-in-up {
  animation: fadeInUp 0.3s ease forwards;
}

/* 加载和错误状态 */
.loading, .error {
  padding: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  margin: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  border-radius: 8px;
  margin-bottom: 12px;
  animation: pulse 1.5s ease-in-out infinite;
  background-size: 200% 100%;
}

.skeleton.title {
  height: 28px;
  width: 70%;
  margin-bottom: 20px;
}

.skeleton.line {
  height: 18px;
  width: 100%;
}

/* 动效 */
.tb-menu {
  transition: transform 0.2s ease;
}

.tb-menu:active {
  transform: scale(1.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card {
    margin: 12px;
    padding: 16px;
  }
  
  .title {
    font-size: 20px;
  }
  
  .comment-text, .reply-text {
    font-size: 14px;
  }
  
  .chip {
    padding: 6px 12px;
  }
  
  .chip-text {
    font-size: 13px;
  }
}

/* 回复相关样式 */
.replies {
  margin-top: 12px;
  padding-left: 20px;
  border-left: 1px solid #e9ecef;
}

.reply {
  display: flex;
  margin-bottom: 12px;
  padding: 10px;
  background: rgba(248, 249, 250, 0.7); /* 降低回复背景不透明度 */
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  transition: all 0.2s ease;
}

.reply:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.reply:before {
  content: '';
  position: absolute;
  left: -22px;
  top: 16px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3742fa;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px #e9ecef;
}

.reply-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
  border: 1px solid #e9ecef;
  object-fit: cover;
}

.reply-content {
  flex: 1;
  min-width: 0;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  align-items: center;
}

.reply-author {
  font-size: 13px;
  font-weight: 600;
  color: #3742fa;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reply-time {
  font-size: 10px;
  color: #868e96;
  flex-shrink: 0;
  margin-left: 6px;
}

.reply-text {
  font-size: 13px;
  color: #495057;
  line-height: 1.4;
  margin-bottom: 6px;
  word-wrap: break-word;
}

.reply-footer {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reply-like {
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.reply-like:hover {
  background-color: #e9ecef;
}

.reply-like .like-icon {
  font-size: 14px;
  transition: all 0.2s ease;
}

.reply-like .like-icon.liked {
  color: #ff6b6b;
  transform: scale(1.1);
}

.reply-like .like-count {
  font-size: 12px;
  color: #868e96;
  font-weight: 500;
}

.delete-reply-btn, .reply-comment-btn {
  padding: 3px 8px;
  font-size: 11px;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.delete-reply-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  box-shadow: 0 1px 3px rgba(255, 107, 107, 0.2);
}

.delete-reply-btn:hover {
  background: linear-gradient(135deg, #ff5252 0%, #ff7b7b 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
}

.reply-comment-btn {
  background: linear-gradient(135deg, #6a7ffa 0%, #8c9afb 100%); /* 使用更浅的蓝色 */
  box-shadow: 0 1px 3px rgba(106, 127, 250, 0.2); /* 调整阴影颜色 */
}

.reply-comment-btn:hover {
  background: linear-gradient(135deg, #5a6ff9 0%, #7c8afa 100%); /* 悬停时稍微深一点 */
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(106, 127, 250, 0.3); /* 调整阴影颜色 */
}

</style>