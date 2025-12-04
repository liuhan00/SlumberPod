<template>
  <scroll-view class="page" scroll-y :style="bgStyle">
    <view class="section">
      <view class="header-row">
        <text class="title">我的评论</text>
        <text class="count">{{ comments.length }} 条</text>
      </view>

      <view class="list" v-if="comments.length">
        <view class="item" v-for="comment in comments" :key="comment.id">
          <view class="comment-header">
            <text class="post-title">评论于：{{ comment.post_title }}</text>
            <text class="time">{{ formatTime(comment.created_at) }}</text>
          </view>
          <text class="content">{{ comment.content }}</text>
          <view class="comment-footer">
            <text class="likes">👍 {{ comment.like_count }}</text>
          </view>
        </view>
      </view>
      <view class="empty" v-else>暂无评论</view>
    </view>
  </scroll-view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { getAuthLocal } from '@/store/auth'
import * as apiCommunity from '@/api/community'

const { bgStyle } = useGlobalTheme()
const comments = ref([])

// 格式化时间
function formatTime(timeStr) {
  if (!timeStr) return '未知时间'
  // 简单的时间格式化
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 加载用户评论
async function loadComments() {
  try {
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

    const res = await apiCommunity.getUserComments(auth.token)
    const data = res?.data || res || []
    comments.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('加载评论失败:', e)
    uni.showToast({
      title: '加载评论失败',
      icon: 'none'
    })
  }
}

onMounted(() => {
  loadComments()
})
</script>

<style scoped>
.page {
  min-height: 100vh
}

.section {
  padding: 18px 16px
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: var(--fg)
}

.count {
  color: var(--muted);
  font-size: 13px
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px
}

.item {
  background: var(--card-bg);
  color: var(--card-fg);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 14px var(--shadow);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.post-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--primary);
}

.time {
  font-size: 12px;
  color: var(--muted);
}

.content {
  display: block;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.comment-footer {
  display: flex;
  justify-content: flex-end;
}

.likes {
  font-size: 12px;
  color: var(--muted);
}

.empty {
  text-align: center;
  color: var(--muted);
  padding: 40px 0;
}
</style>