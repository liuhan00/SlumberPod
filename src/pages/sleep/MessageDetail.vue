<template>
  <view class="page" @click="goBack">
    <!-- 夜空背景 -->
    <view class="night-sky">
      <!-- 星星 -->
      <view class="stars">
        <view v-for="i in 30" :key="i" class="star" :style="getStarStyle(i)"></view>
      </view>
      <!-- 月亮 -->
      <view class="moon"></view>
    </view>

    <!-- 信件内容区域 - 点击卡片内部不会关闭 -->
    <view class="content-container" @click.stop>
      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else-if="error" class="error-state">
        <text class="error-icon">⚠️</text>
        <text class="error-text">{{ error }}</text>
        <button class="retry-btn" @click="loadDetail">重新加载</button>
      </view>

      <view v-else-if="message" class="message-card">
        <!-- 信封样式的头部 -->
        <view class="envelope-header">
          <view class="envelope-flap"></view>
          <view class="envelope-seal">
            <text class="seal-text">🌙</text>
          </view>
        </view>

        <!-- 信件元信息 -->
        <view class="message-meta">
          <view class="meta-item">
            <text class="meta-label">发件人：</text>
            <text class="meta-value">{{ getSenderName() }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-label">时间：</text>
            <text class="meta-value">{{ formatTime(message.time || message.created_at) }}</text>
          </view>
          <view v-if="message.title" class="meta-item">
            <text class="meta-label">主题：</text>
            <text class="meta-value">{{ message.title }}</text>
          </view>
        </view>

        <!-- 信件内容 -->
        <view class="message-content">
          <view class="content-paper">
            <text class="content-text">{{ message.content || '空消息内容' }}</text>
          </view>
        </view>

        <!-- 系统信件标识 -->
        <view v-if="message.isSystemMail || message.type === 'system'" class="system-badge">
          <text class="badge-text">📮 系统信件</text>
        </view>

        <!-- 已读/未读状态 -->
        <view class="read-status" :class="{ unread: !message.read }">
          <text class="status-text">{{ message.read ? '✓ 已读' : '✉️ 未读' }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="action-buttons">
          <button 
            v-if="!message.read" 
            class="action-btn mark-read-btn"
            @click="markAsRead"
            :disabled="marking"
          >
            {{ marking ? '标记中...' : '标记为已读' }}
          </button>
          <button 
            v-if="canReply()" 
            class="action-btn reply-btn"
            @click="replyToMessage"
          >
            回信
          </button>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-text">信件不存在</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMessageDetail, markMessageAsRead } from '@/api/mailbox'

const message = ref(null)
const loading = ref(true)
const error = ref(null)
const marking = ref(false)

// 从页面参数获取信件ID
const threadId = ref(null)

onMounted(async () => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}
  
  threadId.value = options.id || options.threadId
  
  console.log('[MessageDetail] threadId:', threadId.value)
  
  if (!threadId.value) {
    error.value = '缺少信件ID参数'
    loading.value = false
    return
  }
  
  await loadDetail()
})

// 加载信件详情
async function loadDetail() {
  if (!threadId.value) return
  
  loading.value = true
  error.value = null
  
  try {
    const raw = uni.getStorageSync('app_auth_user')
    const auth = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
    const token = auth?.token
    
    console.log('[MessageDetail] 加载信件详情，threadId:', threadId.value)
    const res = await getMessageDetail({ token, threadId: threadId.value })
    console.log('[MessageDetail] 信件详情:', res)
    
    message.value = res
    
    // 如果获取到的是嵌套在 data 里的数据
    if (res?.data) {
      message.value = res.data
    }
  } catch (e) {
    console.error('[MessageDetail] 加载失败:', e)
    error.value = e.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 标记为已读
async function markAsRead() {
  if (!threadId.value || marking.value) return
  
  marking.value = true
  
  try {
    const raw = uni.getStorageSync('app_auth_user')
    const auth = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
    const token = auth?.token
    
    await markMessageAsRead({ token, threadId: threadId.value })
    
    // 更新本地状态
    if (message.value) {
      message.value.read = true
    }
    
    uni.showToast({
      title: '已标记为已读',
      icon: 'success',
      duration: 1500
    })
    
    // 延迟返回，让用户看到成功提示，并通知列表页面刷新
    setTimeout(() => {
      // 设置一个标记，表示需要刷新列表
      uni.setStorageSync('mailbox_need_refresh', true)
      // 设置一个标记，表示某个信件已被标记为已读
      uni.setStorageSync('mailbox_read_message_id', threadId.value)
      goBack()
    }, 1500)
  } catch (e) {
    console.error('[MessageDetail] 标记已读失败:', e)
    uni.showToast({
      title: e.message || '操作失败',
      icon: 'none',
      duration: 2000
    })
  } finally {
    marking.value = false
  }
}

// 回信
function replyToMessage() {
  // 跳转到回信页面或显示回信弹窗
  // 这里暂时返回上一页并切换到投递晚安面板
  uni.showToast({
    title: '回信功能开发中',
    icon: 'none',
    duration: 1500
  })
}

// 是否可以回信
function canReply() {
  // 系统信件不能回信
  if (message.value?.isSystemMail || message.value?.type === 'system') {
    return false
  }
  return true
}

// 获取发件人名称
function getSenderName() {
  if (message.value?.isSystemMail || message.value?.type === 'system') {
    return '系统'
  }
  if (message.value?.sender_name) {
    return message.value.sender_name
  }
  if (message.value?.sender_openid) {
    return `用户${message.value.sender_openid.substring(0, 8)}`
  }
  return '匿名用户'
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '未知时间'
  
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return '时间格式错误'
  
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

// 返回上一页
function goBack() {
  uni.navigateBack({
    delta: 1
  })
}

// 生成星星样式
function getStarStyle(index) {
  const left = Math.random() * 100
  const top = Math.random() * 100
  const size = Math.random() * 2 + 1
  const delay = Math.random() * 3
  const duration = Math.random() * 2 + 2
  
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  position: relative;
  background: linear-gradient(180deg, #1a1a3e 0%, #0f0f2e 50%, #0a0a1a 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

/* 夜空背景 */
.night-sky {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
}

.star {
  position: absolute;
  background: #fff;
  border-radius: 50%;
  animation: twinkle 3s infinite;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
}

.star:nth-child(3n) {
  background: #fff8dc;
  box-shadow: 0 0 6px rgba(255, 248, 220, 0.9);
}

.star:nth-child(5n) {
  background: #e6f3ff;
  box-shadow: 0 0 5px rgba(230, 243, 255, 0.8);
}

@keyframes twinkle {
  0%, 100% { 
    opacity: 0.3;
    transform: scale(1);
  }
  50% { 
    opacity: 1;
    transform: scale(1.2);
  }
}

.moon {
  position: absolute;
  top: 10%;
  right: 10%;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f5f5dc 0%, #fff8dc 100%);
  border-radius: 50%;
  box-shadow: 0 0 40px rgba(245, 245, 220, 0.6),
              0 0 80px rgba(245, 245, 220, 0.3),
              inset -10px -10px 0 rgba(0, 0, 0, 0.1);
  animation: moonGlow 4s ease-in-out infinite;
}

@keyframes moonGlow {
  0%, 100% {
    box-shadow: 0 0 40px rgba(245, 245, 220, 0.6),
                0 0 80px rgba(245, 245, 220, 0.3),
                inset -10px -10px 0 rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow: 0 0 50px rgba(245, 245, 220, 0.8),
                0 0 100px rgba(245, 245, 220, 0.4),
                inset -10px -10px 0 rgba(0, 0, 0, 0.1);
  }
}

/* 内容容器 */
.content-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 460px;
  max-height: 85vh;
  overflow-y: auto;
}

/* 加载状态 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.loading-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%);
  border-radius: 28px;
  backdrop-filter: blur(40px) saturate(150%);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.error-icon {
  font-size: 56px;
  margin-bottom: 20px;
  opacity: 0.8;
}

.error-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 28px;
  text-align: center;
  line-height: 1.6;
}

.retry-btn {
  background: linear-gradient(135deg, #7B61FF 0%, #6B51EF 100%);
  color: #fff;
  border: none;
  border-radius: 28px;
  padding: 14px 36px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 6px 20px rgba(123, 97, 255, 0.4),
              0 2px 8px rgba(123, 97, 255, 0.2);
  transition: all 0.3s ease;
}

.retry-btn:active {
  transform: scale(0.96);
  box-shadow: 0 4px 12px rgba(123, 97, 255, 0.3);
}

/* 信件卡片 */
.message-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%);
  border-radius: 28px;
  overflow: hidden;
  backdrop-filter: blur(40px) saturate(150%);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3),
              0 4px 12px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 信封样式头部 */
.envelope-header {
  position: relative;
  height: 140px;
  background: linear-gradient(135deg, rgba(123, 97, 255, 0.3) 0%, rgba(107, 81, 239, 0.2) 100%);
  overflow: hidden;
}

.envelope-flap {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 160px solid transparent;
  border-right: 160px solid transparent;
  border-top: 90px solid rgba(123, 97, 255, 0.15);
}

.envelope-seal {
  position: absolute;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #7B61FF 0%, #6B51EF 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 24px rgba(123, 97, 255, 0.5),
              0 2px 8px rgba(123, 97, 255, 0.3),
              inset 0 2px 0 rgba(255, 255, 255, 0.25);
  animation: sealPulse 3s ease-in-out infinite;
}

@keyframes sealPulse {
  0%, 100% {
    transform: translateX(-50%) scale(1);
    box-shadow: 0 6px 24px rgba(123, 97, 255, 0.5),
                0 2px 8px rgba(123, 97, 255, 0.3),
                inset 0 2px 0 rgba(255, 255, 255, 0.25);
  }
  50% {
    transform: translateX(-50%) scale(1.08);
    box-shadow: 0 8px 32px rgba(123, 97, 255, 0.6),
                0 4px 12px rgba(123, 97, 255, 0.4),
                inset 0 2px 0 rgba(255, 255, 255, 0.3);
  }
}

.seal-text {
  font-size: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* 信件元信息 */
.message-meta {
  padding: 24px 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.meta-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14px;
}

.meta-item:last-child {
  margin-bottom: 0;
}

.meta-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 70px;
  font-weight: 500;
}

.meta-value {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.95);
  flex: 1;
  font-weight: 500;
}

/* 信件内容 */
.message-content {
  padding: 24px 20px;
}

.content-paper {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 16px;
  padding: 24px;
  min-height: 200px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.content-text {
  font-size: 16px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.95);
  white-space: pre-wrap;
  word-wrap: break-word;
  letter-spacing: 0.3px;
}

/* 系统标识 */
.system-badge {
  margin: 0 20px 16px;
  padding: 10px 18px;
  background: linear-gradient(135deg, rgba(123, 97, 255, 0.2) 0%, rgba(107, 81, 239, 0.15) 100%);
  border-radius: 24px;
  border: 1px solid rgba(123, 97, 255, 0.3);
  text-align: center;
  backdrop-filter: blur(10px);
}

.badge-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 已读状态 */
.read-status {
  margin: 0 20px 20px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(67, 160, 71, 0.15) 100%);
  border-radius: 16px;
  text-align: center;
  border: 1px solid rgba(76, 175, 80, 0.3);
  backdrop-filter: blur(10px);
}

.read-status.unread {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(251, 140, 0, 0.15) 100%);
  border-color: rgba(255, 152, 0, 0.3);
}

.status-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  padding: 0 20px 24px;
}

.action-btn {
  flex: 1;
  height: 52px;
  border-radius: 26px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.5px;
}

.mark-read-btn {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: #fff;
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.35),
              0 2px 8px rgba(76, 175, 80, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.mark-read-btn:active {
  transform: scale(0.97);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3),
              0 1px 4px rgba(76, 175, 80, 0.2);
}

.reply-btn {
  background: linear-gradient(135deg, #7B61FF 0%, #6B51EF 100%);
  color: #fff;
  box-shadow: 0 6px 20px rgba(123, 97, 255, 0.35),
              0 2px 8px rgba(123, 97, 255, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.reply-btn:active {
  transform: scale(0.97);
  box-shadow: 0 4px 12px rgba(123, 97, 255, 0.3),
              0 1px 4px rgba(123, 97, 255, 0.2);
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
