<script setup>
import { ref, computed } from 'vue'
import { getPlaceholder, isValidImageUrl } from '@/utils/image'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['like', 'comment', 'share'])

const avatarSrc = ref(props.post.author?.avatar || getPlaceholder('avatar'))

// 使用utils中的严格图片URL验证函数
const imageSrc = computed(() => {
  return isValidImageUrl(props.post.image)
})

function handleLike() {
  emit('like', props.post.id)
}

function handleComment() {
  emit('comment', props.post.id)
}

// 分享到朋友圈
function handleShare() {
  // 获取当前页面路径
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const baseUrl = `${currentPage.route}?id=${props.post.id}`
  
  // 检查是否支持分享到朋友圈
  if (typeof uni.shareToMoments === 'function') {
    uni.shareToMoments({
      title: props.post.title || '来看看这个有趣的帖子',
      content: props.post.content.substring(0, 50) + '...',
      imageUrl: props.post.image || '',
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
              title: props.post.title || '来看看这个有趣的帖子',
              content: props.post.content.substring(0, 50) + '...',
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
            // 分享到朋友圈（复制链接提示用户手动分享）
            uni.setClipboardData({
              data: `/${baseUrl}`,
              success: () => {
                uni.showToast({ title: '链接已复制，可在微信中分享到朋友圈', icon: 'success' })
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

function viewProfile() {
  uni.navigateTo({
    url: `/pages/profile/index?userId=${props.post.author.name}`
  })
}

function viewDetail() {
  const toId = (typeof props.post.backendId === 'number' && !isNaN(props.post.backendId)) ? props.post.backendId : props.post.id
  uni.navigateTo({
    url: `/pages/community/detail?id=${toId}`
  })
}

function previewImage() {
  if (props.post.image) {
    uni.previewImage({
      urls: [props.post.image]
    })
  }
}

function searchTopic(topic) {
  uni.navigateTo({
    url: `/pages/community/search?keyword=${encodeURIComponent(topic)}`
  })
}

function showMoreActions() {
  uni.showActionSheet({
    itemList: ['分享到朋友圈', '举报', '不感兴趣', '收藏'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          handleShare()
          break
        case 1:
          uni.showToast({ title: '举报成功', icon: 'success' })
          break
        case 2:
          uni.showToast({ title: '已标记', icon: 'success' })
          break
        case 3:
          uni.showToast({ title: '收藏成功', icon: 'success' })
          break
      }
    }
  })
}

function handleAvatarError(e) {
  avatarSrc.value = getPlaceholder('avatar')
}

function handleImageError(e) {
  // 当图片加载失败时，将图片源设置为null，这样就不会显示图片
  // 注意：这里不能直接设置为占位符，因为我们要完全隐藏无效图片
  console.log('图片加载失败:', props.post.image)
}

</script>

<template>
  <view class="post">
    <!-- 头部区域 -->
    <view class="header">
      <image 
        class="avatar" 
        :src="avatarSrc" 
        mode="aspectFill" 
        @error="handleAvatarError"
        @click="viewProfile"
      />
      <view class="author-info">
        <text class="name">{{ post.author?.name || '用户' }}</text>
        <text class="time">{{ post.time }}</text>
      </view>
      <button class="more-btn" @click="showMoreActions">⋯</button>
    </view>

    <!-- 内容区域 -->
    <view class="content-area" @click="viewDetail">
      <text v-if="post.title" class="title">{{ post.title }}</text>
      <text class="content">{{ post.content }}</text>
      <image 
        v-if="imageSrc" 
        class="cover" 
        :src="imageSrc" 
        mode="aspectFill" 
        @error="handleImageError"
        @click.stop="previewImage"
      />
    </view>

    <!-- 统计信息 -->
    <view class="stats">
      <!-- 点赞数 -->
      <view class="stat-item" @click="handleLike">
        <text class="icon">👍</text>
        <text class="count">{{ post.favorite_count || post.likes || 0 }}</text>
      </view>
      
      <!-- 评论数 -->
      <view class="stat-item" @click="handleComment">
        <text class="icon">💬</text>
        <text class="count">{{ post.comment_count || post.comments?.length || 0 }}</text>
      </view>
      
      <!-- 分享 -->
      <view class="stat-item" @click="handleShare">
        <text class="icon">↗️</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.post { 
  /* make card transparent but keep border to indicate card */
  background: transparent;
  border-radius: 12px;
  padding: 16px;
  margin: 0 auto 16px;
  border: 1px solid var(--border, rgba(0,0,0,0.06));
  box-shadow: 0 1px 0 rgba(255,255,255,0.03) inset; /* subtle inner highlight */
  transition: transform 0.2s, background 0.2s;
  width: 100%;
  max-width: 680px;
  box-sizing: border-box;
}

.post:active {
  transform: scale(0.98);
}

/* 头部区域 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}

.author-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 600;
  color: var(--text-contrast, var(--fg)) ;
  font-size: 14px;
  margin-bottom: 2px;
}

.time {
  font-size: 12px;
  color: var(--muted-contrast, #999);
}

.more-btn {
  background: none;
  border: none;
  outline: none;
  font-size: 18px;
  color: var(--muted-contrast, #999);
  padding: 4px;
}

/* 微信小程序去边框 */
.more-btn::after {
  border: none;
}

/* 内容区域 */
.content-area {
  margin-bottom: 16px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-contrast, var(--fg));
  margin-bottom: 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.content {
  display: block;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-contrast, var(--fg));
  margin-bottom: 12px;
  /* 移除 white-space: pre-wrap，改用正常的换行处理 */
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}

.cover {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  margin-top: 8px;
}

/* 统计信息 */
.stats {
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  background: var(--card-bg, rgba(255,255,255,0.05));
  cursor: pointer;
  transition: background 0.2s;
}

.stat-item:hover {
  background: var(--card-bg-hover, rgba(255,255,255,0.1));
}

.icon {
  font-size: 16px;
}

.count {
  font-size: 14px;
  color: var(--text-contrast, var(--fg));
}
</style>