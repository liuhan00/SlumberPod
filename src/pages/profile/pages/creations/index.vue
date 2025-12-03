<template>
  <view class="page" :style="bgStyle">
    <!-- 顶部导航栏 -->
    <view class="nav-header">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">社区动态</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="content" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <!-- 错误信息 -->
      <view v-else-if="error" class="error">
        <text>{{ error }}</text>
        <button class="retry-btn" @click="loadPosts">重新加载</button>
      </view>

      <!-- 空状态 -->
      <view v-else-if="posts.length === 0" class="empty-state">
        <text class="empty-icon">💭</text>
        <text class="empty-text">暂无社区动态</text>
        <text class="empty-desc">快去发布你的第一个帖子吧</text>
        <button class="publish-btn" @click="goToCreatePost">发布帖子</button>
      </view>

      <!-- 帖子列表 -->
      <view v-else class="posts-list">
        <view 
          v-for="post in posts" 
          :key="post.id" 
          class="post-item"
        >
          <view class="post-header">
            <text class="post-time">{{ post.time }}</text>
            <view class="post-actions" @click="showPostActions(post)">
              <text class="actions-icon">⋯</text>
            </view>
          </view>
          
          <view class="post-content" @click="viewPostDetail(post)">
            <text v-if="post.title" class="post-title">{{ post.title }}</text>
            <text class="post-body">{{ post.content }}</text>
            <image 
              v-if="post.image" 
              class="post-image" 
              :src="post.image" 
              mode="aspectFill" 
              @error="handleImageError"
            />
          </view>
          
          <view class="post-stats">
            <view class="stat-item">
              <text class="stat-icon">👍</text>
              <text class="stat-count">{{ post.favorite_count }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-icon">💬</text>
              <text class="stat-count">{{ post.comment_count }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { getAuthLocal } from '@/store/auth'
import { getPlaceholder, isValidImageUrl } from '@/utils/image'
import * as apiCommunity from '@/api/community'
import PostCard from '@/components/PostCard.vue'

const { bgStyle } = useGlobalTheme()

// 数据状态
const posts = ref([])
const loading = ref(false)
const error = ref('')

// 加载用户发布的帖子
async function loadPosts() {
  try {
    loading.value = true
    error.value = ''
    
    const auth = getAuthLocal()
    if (!auth || !auth.token) {
      throw new Error('请先登录')
    }
    
    const res = await apiCommunity.getUserPosts(auth.token)
    const list = res?.data || res?.items || res?.list || []
    
    // 处理帖子数据
    posts.value = Array.isArray(list) ? list.map(item => {
      const imageUrl = item.imageUrls?.[0] || item.image || item.cover_image || ''
      
      return {
        id: item.post_id || item.id || item._id,
        time: item.time || item.created_at || item.createdAt || '未知时间',
        title: item.title || '',
        content: item.content || item.body || '',
        image: isValidImageUrl(imageUrl), // 使用严格检查的图片URL
        favorite_count: item.favorite_count || item.like_count || item.likes || 0,
        comment_count: item.comment_count || item.commentCount || (Array.isArray(item.comments) ? item.comments.length : 0),
        author: item.author || { name: item.userName || item.user_name || '用户' }
      }
    }) : []
  } catch (e) {
    console.error('[profile.community] load posts failed', e)
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

// 查看帖子详情
function viewPostDetail(post) {
  uni.navigateTo({
    url: `/pages/community/detail?id=${post.id}`
  })
}

// 显示帖子操作菜单
function showPostActions(post) {
  uni.showActionSheet({
    itemList: ['删除帖子', '取消'],
    itemColor: '#333',
    success: (res) => {
      if (res.tapIndex === 0) {
        // 删除帖子
        deletePost(post)
      }
    }
  })
}

// 删除帖子
async function deletePost(post) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个帖子吗？删除后不可恢复。',
    success: async (res) => {
      if (res.confirm) {
        try {
          const auth = getAuthLocal()
          if (!auth || !auth.token) {
            uni.showToast({ title: '请先登录', icon: 'none' })
            return
          }
          
          await apiCommunity.deletePost({ postId: post.id }, auth.token)
          
          // 从列表中移除帖子
          posts.value = posts.value.filter(p => p.id !== post.id)
          
          uni.showToast({ title: '删除成功', icon: 'success' })
        } catch (e) {
          console.error('[profile.community] delete post failed', e)
          uni.showToast({ title: e?.message || '删除失败', icon: 'none' })
        }
      }
    }
  })
}

// 图片加载失败处理
function handleImageError(e) {
  console.log('图片加载失败:', e)
}

// 导航函数
function goBack() {
  uni.navigateBack()
}

function goToCreatePost() {
  uni.navigateTo({
    url: '/pages/create-post/index'
  })
}

// 页面加载时获取数据
onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg, #f5f5f5);
  overflow-x: hidden; /* 防止水平滚动 */
}

/* 顶部导航栏 */
.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--card-bg, #ffffff);
  border-bottom: 1px solid var(--border, #f0f0f0);
  position: sticky;
  top: 0;
  z-index: 100;
  box-sizing: border-box; /* 确保padding不会增加元素宽度 */
}

.nav-back {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--input-bg, #f8f9fa);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-icon {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg, #333);
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg, #333);
}

.nav-placeholder {
  width: 32px;
}

/* 内容区域 */
.content {
  flex: 1;
  padding: 16px;
  box-sizing: border-box; /* 确保padding不会增加元素宽度 */
  overflow-x: hidden; /* 防止水平滚动 */
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.retry-btn, .publish-btn {
  margin-top: 16px;
  padding: 10px 20px;
  border-radius: 20px;
  background: var(--uni-color-primary, #007aff);
  color: white;
  border: none;
  font-size: 14px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg, #333);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--muted, #999);
  margin-bottom: 24px;
}

/* 帖子列表 */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%; /* 确保不超过父容器 */
  box-sizing: border-box; /* 确保padding不会增加元素宽度 */
}

.post-item {
  background: var(--card-bg, #ffffff);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  box-sizing: border-box; /* 确保padding不会增加元素宽度 */
  width: 100%; /* 确保不超过父容器 */
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  width: 100%; /* 确保不超过父容器 */
  box-sizing: border-box; /* 确保padding不会增加元素宽度 */
}

.post-time {
  font-size: 12px;
  color: var(--muted, #999);
}

.actions-icon {
  font-size: 18px;
  color: var(--muted, #999);
  padding: 8px;
}

.post-content {
  margin-bottom: 16px;
  cursor: pointer;
  word-wrap: break-word; /* 添加自动换行 */
  overflow-wrap: break-word; /* 确保长单词也能换行 */
  width: 100%; /* 确保不超过父容器 */
  box-sizing: border-box; /* 确保padding不会增加元素宽度 */
}

.post-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--fg, #333);
  margin-bottom: 8px;
  word-wrap: break-word; /* 添加自动换行 */
  overflow-wrap: break-word; /* 确保长单词也能换行 */
  width: 100%; /* 确保不超过父容器 */
  box-sizing: border-box; /* 确保padding不会增加元素宽度 */
}

.post-body {
  display: block;
  font-size: 14px;
  line-height: 1.5;
  color: var(--fg, #333);
  margin-bottom: 12px;
  /* 移除 white-space: pre-wrap，改用正常的换行处理 */
  word-wrap: break-word; /* 添加自动换行 */
  overflow-wrap: break-word; /* 确保长单词也能换行 */
  white-space: normal; /* 使用正常的空白处理 */
  width: 100%; /* 确保不超过父容器 */
  box-sizing: border-box; /* 确保padding不会增加元素宽度 */
}

.post-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  margin-top: 8px;
  box-sizing: border-box; /* 确保padding不会增加元素宽度 */
}

.post-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%; /* 确保不超过父容器 */
  box-sizing: border-box; /* 确保padding不会增加元素宽度 */
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 16px;
}

.stat-count {
  font-size: 14px;
  color: var(--muted, #999);
}
</style>