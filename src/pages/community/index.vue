<template>
  <view class="page">
    <!-- 背景图片容器 -->
    <view class="background-container">
      <image class="background-image" src="/static/find.png" mode="aspectFill" />
    </view>
    
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
    <scroll-view class="content" scroll-y>
      <view class="section">
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
            {{ activeTab === '关注' ? '去「最热」逛逛吧' : '' }}
          </text>
          <button v-if="activeTab === '关注'" class="explore-btn" @click="goToFeatured">
            去逛逛
          </button>
        </view>
      </view>
    </scroll-view>
    
    <!-- 悬浮发帖按钮 -->
    <view class="floating-post-btn" @click="goToCreatePost">
      <text class="plus-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAuthLocal } from '@/store/auth'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { getPlaceholder, safeImageUrl } from '@/utils/image'
import PostCard from '@/components/PostCard.vue'
import * as apiPosts from '@/api/posts'
import * as apiCommunity from '@/api/community'

// 导航标签
const tabs = ['关注', '最热', '最新']
const activeTab = ref('最新') // 默认选中"最新"

// 后端数据
const posts = ref([])

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
    // 使用数据库中的真实点赞和评论数量
    favorite_count: item.favorite_count ?? item.like_count ?? item.likes ?? 0,
    comment_count: item.comment_count ?? item.commentCount ?? (Array.isArray(item.comments) ? item.comments.length : 0),
    likes: item.likes || item.favorite_count || item.like_count || 0,
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
    const r = await apiCommunity.getHotPosts()
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
  if(tab === '最热') loadHot().catch(()=>{})
}

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
    case '最热':
      // 最热排序：按热度（点赞数+评论数）
      result.sort((a, b) => {
        // 使用 favorite_count 和 comment_count 字段进行排序
        const aScore = (a.favorite_count || a.likes || 0) + (a.comment_count || a.comments?.length || 0)
        const bScore = (b.favorite_count || b.likes || 0) + (b.comment_count || b.comments?.length || 0)
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

function showSearch() {
  // 修改跳转到搜索页面，指定类型为community
  uni.navigateTo({
    url: '/pages/search/index?type=community'
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
  activeTab.value = '最热'
}

// 处理点赞
async function onLike(id) { 
  const post = posts.value.find(x => x.id === id)
  if (post) {
    try {
      // 检查用户是否已登录
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
      await apiCommunity.likePost({ postId: post.backendId || post.id }, auth.token)
      
      // 更新本地数据
      post.likes++
      post.favorite_count++
      
      uni.showToast({ title: '点赞成功', icon: 'success' })
    } catch (e) {
      console.error('点赞失败:', e)
      uni.showToast({ title: '点赞失败', icon: 'none' })
    }
  }
}

// 处理评论
async function onComment(id) { 
  const post = posts.value.find(x => x.id === id)
  if (post) {
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
    
    uni.showModal({
      title: '添加评论',
      editable: true,
      placeholderText: '请输入评论内容',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            // 调用评论API
            const result = await apiCommunity.createComment({ 
              postId: post.backendId || post.id, 
              content: res.content 
            }, auth.token)
            
            // 更新本地数据
            const newComment = {
              id: result.data?.id || `c${Date.now()}`,
              content: res.content,
              author: { name: '我', avatar: getPlaceholder('avatar') }
            }
            
            post.comments.push(newComment)
            post.comment_count++
            
            uni.showToast({ title: '评论成功', icon: 'success' })
          } catch (e) {
            console.error('评论失败:', e)
            uni.showToast({ title: '评论失败', icon: 'none' })
          }
        }
      }
    })
  }
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
      comment_count: returned.comment_count || returned.commentCount || 0,
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

function goToCreatePost() {
  try {
    uni.navigateTo({ url: '/pages/create-post/index' })
  } catch(e) {
    if(typeof location !== 'undefined') location.hash = '#/pages/create-post/index'
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

/* 顶部导航栏 */
.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
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
  outline: none; /* 去掉聚焦时的边框 */
}

/* 去掉所有边框样式，包括微信小程序的默认边框 */
.nav-btn::after {
  border: none;
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
  margin-top: 10px;
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
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  margin: 16px;
  backdrop-filter: blur(5px);
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

/* 悬浮发帖按钮 */
.floating-post-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  transition: background 0.2s;
  z-index: 100;
}

.floating-post-btn:active {
  background: #0f9f6e;
  transform: scale(0.98);
}

.plus-icon {
  font-size: 24px;
}
</style>