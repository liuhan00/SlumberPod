<template>
  <view class="page" :style="bgStyle">
    <!-- 顶部导航栏 -->
    <view class="topbar">
      <button class="tb-btn tb-back" @click="goBack">←</button>
      <text class="tb-title">晚安邮箱</text>
      <button class="tb-btn tb-refresh" @click="refresh">↻</button>
    </view>

    <!-- 标签页 -->
    <view class="tabs">
      <button 
        :class="['tab', mailboxCategory === 'inbox' ? 'active' : '']" 
        @click="switchMailboxCategory('inbox')"
      >
        我的信箱({{ inboxUnreadCount }})
      </button>
      <button 
        :class="['tab', mailboxCategory === 'sent' ? 'active' : '']" 
        @click="switchMailboxCategory('sent')"
      >
        我发送的
      </button>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="content" scroll-y>
      <!-- 加载状态 -->
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <!-- 错误状态 -->
      <view v-else-if="error" class="error">
        {{ error }}
        <button @click="refresh">重新加载</button>
      </view>

      <!-- 空状态 -->
      <view v-else-if="filteredMessages.length === 0" class="empty">
        <text>暂无信件</text>
      </view>

      <!-- 消息列表 -->
      <view v-else class="messages">
        <view 
          v-for="msg in filteredMessages" 
          :key="msg.id" 
          class="message-card"
          @click="openMessage(msg)"
        >
          <view class="message-header">
            <text class="sender">{{ msg.sender }}</text>
            <text class="time">{{ formatTime(msg.created_at) }}</text>
          </view>
          <text class="title">{{ msg.title }}</text>
          <text class="excerpt">{{ msg.content.substring(0, 50) }}...</text>
          <view class="message-footer">
            <view v-if="!msg.is_read && mailboxCategory === 'inbox'" class="unread-dot"></view>
            <text v-if="msg.is_read" class="read-status">已读</text>
            <text v-else class="read-status unread">未读</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 悬浮按钮 -->
    <button class="floating-btn" @click="composeMessage">✉</button>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import * as apiMailbox from '@/api/mailbox'
import { onLoad, onShow } from '@dcloudio/uni-app'

const { bgStyle } = useGlobalTheme()

// 状态
const loading = ref(false)
const error = ref('')
const messages = ref([])

// 邮箱分类状态
const mailboxCategory = ref('inbox') // 'inbox' 或 'sent'

// 切换邮箱分类
function switchMailboxCategory(category) {
  mailboxCategory.value = category
  loadMyMessages()
}

// 计算属性：过滤后的消息
const filteredMessages = computed(() => {
  if (mailboxCategory.value === 'inbox') {
    return messages.value.filter(msg => !msg.is_sent)
  } else {
    return messages.value.filter(msg => msg.is_sent)
  }
})

// 计算属性：收件箱未读数量
const inboxUnreadCount = computed(() => {
  return messages.value.filter(msg => !msg.is_sent && !msg.is_read).length
})

// 格式化时间
function formatTime(timeStr) {
  if (!timeStr) return ''
  try {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now - date
    
    // 如果是今天
    if (date.toDateString() === now.toDateString()) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 如果是昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 其他情况显示日期
    return `${date.getMonth() + 1}-${date.getDate()}`
  } catch {
    return timeStr
  }
}

// 加载我的消息
async function loadMyMessages() {
  loading.value = true
  error.value = ''
  
  try {
    const res = await apiMailbox.getMyMails({ type: mailboxCategory.value === 'inbox' ? 'received' : 'sent' })
    messages.value = Array.isArray(res) ? res : []
  } catch (err) {
    console.error('加载消息失败:', err)
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

// 刷新
function refresh() {
  loadMyMessages()
}

// 打开消息
function openMessage(message) {
  // 标记为已读
  if (!message.is_read && !message.is_sent) {
    markAsRead(message.id)
  }
  
  // 跳转到详情页
  uni.navigateTo({
    url: `/pages/sleep/MessageDetail?id=${message.id}`
  })
}

// 标记为已读
async function markAsRead(messageId) {
  try {
    await apiMailbox.markMessageAsRead({ threadId: messageId })
    // 更新本地状态
    const message = messages.value.find(msg => msg.id === messageId)
    if (message) {
      message.is_read = true
    }
  } catch (err) {
    console.error('标记已读失败:', err)
  }
}

// 写信
function composeMessage() {
  uni.navigateTo({
    url: '/pages/sleep/MessageDetail'
  })
}

// 返回
function goBack() {
  uni.navigateBack()
}

// 页面加载时获取消息
onMounted(() => {
  loadMyMessages()
})

// 页面显示时刷新（从详情页返回时）
onShow(() => {
  // 检查是否需要刷新（例如从详情页返回）
  const needRefresh = uni.getStorageSync('mailbox_refresh_required')
  if (needRefresh) {
    loadMyMessages()
    uni.removeStorageSync('mailbox_refresh_required')
  }
})

// 处理页面参数
onLoad((options) => {
  // 如果有参数指定分类，切换到对应分类
  if (options.category) {
    mailboxCategory.value = options.category
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-color, #f5f5f5);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.tb-btn {
  background: none;
  border: none;
  font-size: 18px;
  padding: 8px;
}

.tb-title {
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.tab {
  flex: 1;
  padding: 16px;
  text-align: center;
  background: none;
  border: none;
  font-size: 16px;
  color: #666;
  position: relative;
}

.tab.active {
  color: #007aff;
  font-weight: 600;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 3px;
  background: #007aff;
  border-radius: 2px;
}

.content {
  flex: 1;
}

.loading, .error, .empty {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.error {
  color: #ff3b30;
}

.messages {
  padding: 16px;
}

.message-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sender {
  font-weight: 600;
  color: #333;
}

.time {
  font-size: 12px;
  color: #999;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.excerpt {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #ff3b30;
  border-radius: 50%;
}

.read-status {
  font-size: 12px;
  color: #999;
}

.read-status.unread {
  color: #ff3b30;
  font-weight: 600;
}

.floating-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0,122,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-btn:active {
  background: #0062cc;
  transform: scale(0.95);
}
</style>