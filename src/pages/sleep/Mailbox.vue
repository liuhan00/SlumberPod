<template>
  <view class="page" :style="bgStyle">
    <view class="header">
      <text class="title">晚安邮箱</text>
    </view>

    <view class="tabs">
      <view 
        :class="['tab', { active: activeTab === 'send' }]"
        @click="activeTab = 'send'"
      >
        投递晚安
      </view>
      <view 
        :class="['tab', { active: activeTab === 'receive' }]"
        @click="activeTab = 'receive'"
      >
        接收晚安
      </view>
      <view 
        :class="['tab', { active: activeTab === 'mybox' }]"
        @click="activeTab = 'mybox'"
      >
        我的信箱
      </view>
    </view>

    <!-- 投递晚安 -->
    <view v-if="activeTab === 'send'" class="content">
      <view class="input-section">
        <textarea 
          class="message-input" 
          v-model="messageContent"
          placeholder="写下你的晚安消息（最多500字）"
          maxlength="500"
        />
        <text class="char-count">{{ messageContent.length }}/500</text>
      </view>
      <button 
        class="send-btn" 
        @click="sendMessage"
        :disabled="!messageContent.trim() || sending"
      >
        {{ sending ? '投递中...' : '投递' }}
      </button>
    </view>

    <!-- 接收晚安 -->
    <view v-if="activeTab === 'receive'" class="content">
      <view v-if="receivedMessage" class="message-bubble received">
        <text class="message-text">{{ receivedMessage.content }}</text>
        <text class="message-time">{{ formatTime(receivedMessage.time) }}</text>
        <view class="message-actions">
          <button class="action-btn" @click="ignoreMessage">忽略</button>
          <button class="action-btn primary" @click="showReply">回信</button>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-text">暂无消息</text>
        <button class="receive-btn" @click="receiveMessage">接收晚安</button>
      </view>
    </view>

    <!-- 我的信箱 -->
    <view v-if="activeTab === 'mybox'" class="content">
      <scroll-view class="message-list" scroll-y>
        <view 
          v-for="msg in myMessages" 
          :key="msg.id"
          class="message-item"
          @click="viewMessageDetail(msg)"
        >
          <view v-if="!msg.read" class="unread-dot"></view>
          <text class="message-preview">{{ msg.content.substring(0, 20) }}...</text>
          <text class="message-date">{{ formatTime(msg.time) }}</text>
        </view>
        <view v-if="myMessages.length === 0" class="empty-state">
          <text class="empty-text">信箱为空</text>
        </view>
      </scroll-view>
    </view>

    <!-- 回信弹窗 -->
    <view v-if="showReplyModal" class="modal-overlay" @click="closeReply">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">回信</text>
          <button class="modal-close" @click="closeReply">×</button>
        </view>
        <textarea 
          class="reply-input" 
          v-model="replyContent"
          placeholder="写下你的回信（最多300字）"
          maxlength="300"
        />
        <button 
          class="send-btn" 
          @click="sendReply"
          :disabled="!replyContent.trim() || replying"
        >
          {{ replying ? '发送中...' : '发送' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'

const { bgStyle } = useGlobalTheme()

const activeTab = ref('send')
const messageContent = ref('')
const sending = ref(false)
const receivedMessage = ref(null)
const myMessages = ref([])
const showReplyModal = ref(false)
const replyContent = ref('')
const replying = ref(false)
const currentMessageId = ref(null)

function sendMessage() {
  if (!messageContent.value.trim()) {
    uni.showToast({ title: '请输入消息内容', icon: 'none' })
    return
  }
  
  sending.value = true
  // TODO: 调用云函数 throwBottle
  // 模拟发送
  setTimeout(() => {
    sending.value = false
    uni.showToast({ title: '晚安已出发～', icon: 'success' })
    messageContent.value = ''
  }, 1000)
}

function receiveMessage() {
  // TODO: 调用云函数 pickBottle
  // 模拟接收
  receivedMessage.value = {
    id: 1,
    content: '晚安，好梦～',
    time: Date.now()
  }
}

function ignoreMessage() {
  receivedMessage.value = null
}

function showReply() {
  if (!receivedMessage.value) return
  currentMessageId.value = receivedMessage.value.id
  showReplyModal.value = true
}

function closeReply() {
  showReplyModal.value = false
  replyContent.value = ''
  currentMessageId.value = null
}

function sendReply() {
  if (!replyContent.value.trim()) {
    uni.showToast({ title: '请输入回信内容', icon: 'none' })
    return
  }
  
  replying.value = true
  // TODO: 调用云函数保存回信
  setTimeout(() => {
    replying.value = false
    uni.showToast({ title: '回信成功', icon: 'success' })
    closeReply()
    receivedMessage.value = null
  }, 1000)
}

function viewMessageDetail(msg) {
  // TODO: 跳转到详情页
  console.log('View message:', msg)
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

onMounted(() => {
  // TODO: 加载我的信箱消息
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 12px 16px;
}

.header {
  padding: 12px 0;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: var(--fg);
}

.tabs {
  display: flex;
  gap: 8px;
  margin: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab {
  flex: 1;
  padding: 12px;
  text-align: center;
  color: var(--muted);
  border-bottom: 2px solid transparent;
}

.tab.active {
  color: #7B61FF;
  border-bottom-color: #7B61FF;
}

.content {
  margin-top: 16px;
}

.input-section {
  margin-bottom: 16px;
}

.message-input {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border-radius: 12px;
  background: var(--input-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--fg);
  font-size: 14px;
  box-sizing: border-box;
}

.char-count {
  display: block;
  text-align: right;
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
}

.send-btn {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: #7B61FF;
  color: #fff;
  border: none;
  font-size: 16px;
  font-weight: 600;
}

.send-btn:disabled {
  opacity: 0.5;
}

.message-bubble {
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 16px;
}

.message-bubble.received {
  background: #E5E5E5;
}

.message-text {
  display: block;
  font-size: 14px;
  color: var(--fg);
  margin-bottom: 8px;
  line-height: 1.6;
}

.message-time {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
}

.message-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--fg);
  border: none;
  font-size: 14px;
}

.action-btn.primary {
  background: #7B61FF;
  color: #fff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-text {
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 16px;
}

.receive-btn {
  padding: 12px 24px;
  border-radius: 20px;
  background: #7B61FF;
  color: #fff;
  border: none;
  font-size: 14px;
}

.message-list {
  max-height: 500px;
}

.message-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: var(--card-bg);
  margin-bottom: 8px;
  position: relative;
}

.unread-dot {
  position: absolute;
  left: 8px;
  top: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #FF6B6B;
}

.message-preview {
  flex: 1;
  font-size: 14px;
  color: var(--fg);
  margin-left: 16px;
}

.message-date {
  font-size: 12px;
  color: var(--muted);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--muted);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reply-input {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border-radius: 8px;
  background: var(--input-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--fg);
  font-size: 14px;
  margin-bottom: 16px;
  box-sizing: border-box;
}
</style>




