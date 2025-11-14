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
import * as apiPosts from '@/api/posts'
import { safeImageUrl, getPlaceholder } from '@/utils/image'

const themeStore = useThemeStore()
themeStore.load()
const { bgStyle } = useGlobalTheme()

// 导航标签
const tabs = ['关注', '综合', '最新']
const activeTab = ref('最新') // 默认选中"最新"

import * as apiCommunity from '@/api/community'

// 后端数据
const posts = ref([
  { 
    id: 'p1', backendId: null,
    time: '刚刚', 
    content: '昨晚试了雨声+树林组合，很快入睡。推荐给失眠的朋友们！', 
    image: getPlaceholder('post'), 
    likes: 12, 
    comments: [
      { id: 'c1', content: '这个组合确实不错！', author: { name: 'Dreamer', avatar: getPlaceholder('avatar') } }
    ], 
    author: { name: 'Sleepy', avatar: getPlaceholder('avatar') } 
  },
  { 
    id: 'p2', backendId: null,
    time: '1小时前', 
    content: '有谁用过壁炉声？感觉很温暖~ 特别是冬天的时候', 
    image: '', 
    likes: 7, 
    comments: [], 
    author: { name: 'Cozy', avatar: getPlaceholder('avatar') } 
  },
  { 
    id: 'p3', backendId: null,
    time: '3小时前', 
    content: '分享一个助眠技巧：睡前30分钟关闭电子设备，配合海浪声效果更佳', 
    image: getPlaceholder('post'), 
    likes: 25, 
    comments: [
      { id: 'c2', content: '学到了！今晚试试', author: { name: 'Relax', avatar: getPlaceholder('avatar') } },
      { id: 'c3', content: '确实有效，已经坚持一周了', author: { name: 'Peace', avatar: getPlaceholder('avatar') } }
    ], 
    author: { name: 'Expert', avatar: getPlaceholder('avatar') } 
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

// 归一化后端帖子为本地渲染结构
function normalizeList(list){
  return list.map((item, index) => ({
    id: String(item.post_id ?? item.id ?? item._id ?? `p${Date.now()}_${index}`),
    backendId: (typeof item.post_id === 'number' || /^\d+$/.test(String(item.post_id))) ? Number(item.post_id)
      : (typeof item.id === 'number' || /^\d+$/.test(String(item.id))) ? Number(item.id)
      : (typeof item._id === 'number' || /^\d+$/.test(String(item._id))) ? Number(item._id)
      : null,
    time: item.time || item.created_at || item.createdAt || '刚刚',
    title: item.title || '',
    content: item.content || item.body || '',
    image: (item.imageUrls && item.imageUrls[0]) || item.image || '',
    favorite_count: item.favorite_count ?? item.likes ?? 0,
    comment_count: item.comment_count ?? (Array.isArray(item.comments) ? item.comments.length : 0),
    likes: item.likes || item.favorite_count || 0,
    comments: Array.isArray(item.comments) ? item.comments : [],
    author: item.author || { name: item.userName || item.user_name || '用户', avatar: safeImageUrl((item.author && item.author.avatar) || item.user_avatar, 'avatar') }
  }))
}

// 加载"最新"与"热门"
async function loadLatest(){
  try {
    const r = await apiPosts.getLatest()
    const list = r.data || r.items || r.list || r || []
    posts.value = normalizeList(Array.isArray(list) ? list : [])
  } catch(e) {
    console.warn('load latest posts failed', e)
    // 失败时保持现有数据，不抛出错误
    // 尝试使用社区列表作为后备
    try {
      const result = await apiCommunity.getCommunityList({ page: 1, limit: 20 })
      const list = result.data || result.items || result || []
      if (Array.isArray(list) && list.length > 0) {
        posts.value = normalizeList(list)
      }
    } catch(e2) {
      console.warn('fallback community list failed', e2)
    }
  }
}
async function loadHot(){
  try {
    const r = await apiPosts.getHot()
    const list = r.data || r.items || r.list || r || []
    posts.value = normalizeList(Array.isArray(list) ? list : [])
  } catch(e) {
    console.warn('load hot posts failed', e)
    // 失败时保持现有数据，不抛出错误
  }
}

// 方法
function switchTab(tab) {
  activeTab.value = tab
  if(tab === '最新') loadLatest().catch(()=>{})
  if(tab === '综合') loadHot().catch(()=>{})
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
            author: { name: '我', avatar: getPlaceholder('avatar') }
          })
          uni.showToast({ title: '评论成功', icon: 'success' })
        }
      }
    }
  })
}

const creating = ref(false)
async function createPost(data) {
  if (creating.value) return
  creating.value = true
  try{
    // 使用社区API创建帖子
    const result = await apiCommunity.createPost({ 
      title: data.title || '', 
      content: data.content,
      coverImage: data.image || '',
      audioId: data.audioId || undefined
    })
    // prepend returned post if any, fallback to local
    const returned = result.data || result.post || result || {}
    const newPost = {
      id: String(returned.post_id ?? returned.id ?? result.id ?? `p${Date.now()}`),
      backendId: (typeof returned.post_id === 'number' || /^\d+$/.test(String(returned.post_id))) ? Number(returned.post_id)
        : (typeof returned.id === 'number' || /^\d+$/.test(String(returned.id))) ? Number(returned.id)
        : (typeof result.id === 'number' || /^\d+$/.test(String(result.id))) ? Number(result.id)
        : null,
      time: returned.time || returned.created_at || '刚刚',
      title: returned.title || data.title || '',
      content: returned.content || data.content,
      image: (returned.imageUrls && returned.imageUrls[0]) || returned.image || data.image || '',
      likes: returned.likes || returned.favorite_count || 0,
      comments: returned.comments || [],
      author: returned.author || { name: '我', avatar: getPlaceholder('avatar') }
    }
    posts.value.unshift(newPost)
    uni.showToast({ title: '发布成功', icon: 'success' })
  }catch(e){
    console.error('[community] createPost failed', e)
    const msg = (e && e.message) ? e.message : '发布失败'
    uni.showToast({ title: msg, icon: 'none' })
  }finally{
    creating.value = false
  }
}

onMounted(async () => {
  try{
    await loadLatest()
  }catch(e){
    console.warn('load latest posts failed', e)
    // 回退：使用社区列表接口，避免空白
  try{
    const result = await apiCommunity.getCommunityList({ page: 1, limit: 20 })
    const list = result.data || result.items || result || []
      posts.value = normalizeList(list)
    }catch(e2){ console.warn('fallback community list failed', e2) }
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
