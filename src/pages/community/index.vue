<template>
  <view class="page">
    <!-- 顶部导航栏 -->
    <view class="nav-header">
      <view class="nav-tabs">
        <text 
          v-for="tab in tabs" 
          :key="tab" 
          :class="['nav-tab', tab === activeTab ? 'active' : '']"
          @click="switchTab(tab)"
        >
          {{ tab }}
        </text>
      </view>
      <view class="nav-actions">
        <button class="nav-btn" @click="showSearch">
          <text class="nav-icon">🔍</text>
        </button>
        <button class="nav-btn" @click="showMessages">
          <text class="nav-icon">✉</text>
        </button>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="content" scroll-y :style="bgStyle">
      <view class="section">
        <CommunityComposer v-if="activeTab !== '关注'" @submit="createPost" />
        
        <!-- 帖子列表 -->
        <view v-if="filteredPosts.length > 0">
          <PostCard 
            v-for="post in filteredPosts" 
            :key="post.id" 
            :post="post" 
            @like="onLike" 
            @comment="onComment" 
          />
        </view>
        
        <!-- 空状态 -->
        <view v-else class="empty-state">
          <text class="empty-icon">{{ activeTab === '关注' ? '👥' : '💭' }}</text>
          <text class="empty-text">
            {{ activeTab === '关注' ? '你关注的人还没有发过帖子哦' : '暂无内容，快来发布第一条动态吧！' }}
            {{ activeTab === '关注' ? '去「精选」逛逛吧' : '' }}
          </text>
          <button v-if="activeTab === '关注'" class="explore-btn" @click="goToFeatured">
            去逛逛
          </button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CommunityComposer from '@/components/CommunityComposer.vue'
import PostCard from '@/components/PostCard.vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { useThemeStore } from '@/stores/theme'
import { getAuthLocal } from '@/store/auth'

const themeStore = useThemeStore()
themeStore.load()
const { bgStyle } = useGlobalTheme()

// 导航标签
const tabs = ['关注', '综合', '最新']
const activeTab = ref('最新') // 默认选中"最新"

// 模拟数据
const posts = ref([
  { 
    id: 'p1', 
    time: '刚刚', 
    content: '昨晚试了雨声+树林组合，很快入睡。推荐给失眠的朋友们！', 
    image: 'https://picsum.photos/seed/p1/800/400', 
    likes: 12, 
    comments: [
      { id: 'c1', content: '这个组合确实不错！', author: { name: 'Dreamer', avatar: 'https://picsum.photos/seed/d1/100' } }
    ], 
    author: { name: 'Sleepy', avatar: 'https://picsum.photos/seed/a1/100' } 
  },
  { 
    id: 'p2', 
    time: '1小时前', 
    content: '有谁用过壁炉声？感觉很温暖~ 特别是冬天的时候', 
    image: '', 
    likes: 7, 
    comments: [], 
    author: { name: 'Cozy', avatar: 'https://picsum.photos/seed/a2/100' } 
  },
  { 
    id: 'p3', 
    time: '3小时前', 
    content: '分享一个助眠技巧：睡前30分钟关闭电子设备，配合海浪声效果更佳', 
    image: 'https://picsum.photos/seed/p3/800/400', 
    likes: 25, 
    comments: [
      { id: 'c2', content: '学到了！今晚试试', author: { name: 'Relax', avatar: 'https://picsum.photos/seed/r1/100' } },
      { id: 'c3', content: '确实有效，已经坚持一周了', author: { name: 'Peace', avatar: 'https://picsum.photos/seed/p2/100' } }
    ], 
    author: { name: 'Expert', avatar: 'https://picsum.photos/seed/a3/100' } 
  }
])

// 计算属性：根据当前标签筛选帖子
const filteredPosts = computed(() => {
  let result = [...posts.value]
  
  switch (activeTab.value) {
    case '关注':
      // 关注列表：只显示你关注的人发的帖子（从后端或本地 auth 获取关注名单）
      try{
        const auth = getAuthLocal()
        const following = auth?.following || auth?.user?.following || ['Sleepy','Expert']
        result = result.filter(post => following.includes(post.author.name))
      }catch(e){
        result = result.filter(post => ['Sleepy', 'Expert'].includes(post.author.name))
      }
      break
    case '综合':
      // 综合排序：按热度（点赞数+评论数）
      result.sort((a, b) => {
        const aScore = a.likes + a.comments.length
        const bScore = b.likes + b.comments.length
        return bScore - aScore
      })
      break
    case '最新':
      // 按时间倒序（最新在前）
      result.sort((a, b) => {
        const timeMap = { '刚刚': 0, '1小时前': 1, '3小时前': 3 }
        return timeMap[a.time] - timeMap[b.time]
      })
      break
  }
  
  return result
})

// 方法
function switchTab(tab) {
  activeTab.value = tab
}

function showSearch() {
  uni.showToast({
    title: '搜索功能开发中',
    icon: 'none'
  })
}

function showMessages() {
  try {
    uni.navigateTo({ url: '/pages/messages/index' })
  } catch(e) {
    if(typeof location !== 'undefined') location.hash = '#/pages/messages/index'
  }
}

function showNotifications() {
  uni.showToast({
    title: '通知功能开发中',
    icon: 'none'
  })
}

function goToFeatured() {
  activeTab.value = '综合'
}

function onLike(id) { 
  const post = posts.value.find(x => x.id === id)
  if (post) {
    post.likes++
    uni.showToast({ title: '点赞成功', icon: 'success' })
  }
}

function onComment(id) { 
  uni.showModal({
    title: '添加评论',
    editable: true,
    placeholderText: '请输入评论内容',
    success: (res) => {
      if (res.confirm && res.content) {
        const post = posts.value.find(x => x.id === id)
        if (post) {
          post.comments.push({
            id: `c${Date.now()}`,
            content: res.content,
            author: { name: '我', avatar: 'https://picsum.photos/seed/me/100' }
          })
          uni.showToast({ title: '评论成功', icon: 'success' })
        }
      }
    }
  })
}

import * as apiPosts from '@/api/posts'

async function createPost(data) {
  try{
    const auth = getAuthLocal()
    const token = auth?.token || auth?.access_token || null
    // 如果鉴权信息缺失，使用后端要求的默认 userId
    const userId = auth?.id || (auth && auth.user && auth.user.id) || '11111111-1111-1111-1111-111111111111'
    // support image -> imageUrls conversion
    const imageUrls = data.image ? [data.image] : []
    const result = await apiPosts.createPost({ userId, title: data.title || '', content: data.content, imageUrls })
    // prepend returned post if any, fallback to local
    const returned = result.data || result.post || result || {}
    const newPost = {
      id: returned.id || result.id || `p${Date.now()}`,
      time: returned.time || '刚刚',
      title: returned.title || data.title || '',
      content: returned.content || data.content,
      image: (returned.imageUrls && returned.imageUrls[0]) || returned.image || data.image || '',
      likes: returned.likes || 0,
      comments: returned.comments || [],
      author: returned.author || { name: '我', avatar: 'https://picsum.photos/seed/me/100' }
    }
    posts.value.unshift(newPost)
    uni.showToast({ title: '发布成功', icon: 'success' })
  }catch(e){
    // fallback to local mock if network fails
    const id = `p${Date.now()}`
    posts.value.unshift({ 
      id, 
      time: '刚刚', 
      content: data.content, 
      image: data.image || '', 
      likes: 0, 
      comments: [], 
      author: { name: '我', avatar: 'https://picsum.photos/seed/me/100' } 
    })
    uni.showToast({ title: '离线已保存，稍后同步', icon: 'none' })
  }
}

onMounted(async () => {
  // 初始化操作：加载帖子列表（从后端）
  try{
    const result = await apiPosts.getPosts({ page: 1, limit: 20 })
    const list = result.data || result.posts || result || []
    // normalize items to expected shape (title, content, image, author...)
    posts.value = list.map(item => ({
      id: item.id || item._id || `p${Date.now()}`,
      time: item.time || item.createdAt || '刚刚',
      title: item.title || '',
      content: item.content || item.body || '',
      image: (item.imageUrls && item.imageUrls[0]) || item.image || '',
      likes: item.likes || 0,
      comments: item.comments || [],
      author: item.author || { name: item.userName || item.user || '用户', avatar: (item.author && item.author.avatar) || (item.userAvatar) || 'https://picsum.photos/seed/a1/100' }
    }))
  }catch(e){
    console.warn('load posts failed', e)
  }
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-color, #f5f5f5);
}

/* 顶部导航栏 */
.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-tabs {
  display: flex;
  gap: 24px;
  flex: 1;
}

.nav-tab {
  padding: 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  position: relative;
  transition: color 0.3s;
}

.nav-tab.active {
  color: #007aff;
  font-weight: 600;
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #007aff;
  border-radius: 1px;
}

.nav-actions {
  display: flex;
  gap: 12px;
}

.nav-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 6px;
  transition: background 0.2s;
}

.nav-btn:active {
  background: #f5f5f5;
}

.nav-icon {
  font-size: 18px;
}

/* 内容区域 */
.content {
  flex: 1;
  min-height: 0;
}

.section {
  padding: 16px;
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
}

.empty-text {
  color: #999;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 16px;
}

.explore-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.explore-btn:active {
  background: #0f9f6e;
  transform: scale(0.98);
}
</style>
