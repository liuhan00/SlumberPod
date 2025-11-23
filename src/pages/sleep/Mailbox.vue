<template>
  <view class="page">
    <!-- 夜空背景 -->
    <view class="night-sky">
      <!-- 星星 -->
      <view class="stars">
        <view v-for="i in 30" :key="i" class="star" :style="getStarStyle(i)"></view>
      </view>
      <!-- 月亮 -->
      <view class="moon"></view>
      <!-- 云朵 -->
      <view class="cloud cloud1"></view>
      <view class="cloud cloud2"></view>
      <view class="cloud cloud3"></view>
    </view>

    <!-- 邮局建筑 - 始终显示 -->
    <view class="post-office-container">
      <view class="post-office">
        <!-- 招牌 -->
        <view class="signboard">
          <text class="signboard-text">晚安邮局</text>
        </view>
        <!-- 建筑主体 -->
        <view class="building">
          <!-- 窗户 -->
          <view class="window window-left">
            <view class="window-light"></view>
            <view class="cat-silhouette"></view>
          </view>
          <view class="window window-right">
            <view class="window-light"></view>
          </view>
          <!-- 门 -->
          <view class="door"></view>
        </view>
        <!-- 树木 -->
        <view class="tree tree-left"></view>
        <view class="tree tree-right"></view>
        <!-- 邮箱 -->
        <view class="mailbox"></view>
      </view>
    </view>

    <!-- 内容区域 - 覆盖在邮局上方 -->
    <view class="content-area">
      <!-- 投递晚安 -->
      <view v-show="activeTab === 'send'" class="content-panel send-panel">
        <!-- 顶部装饰 -->
        <view class="panel-header">
          <view class="airplane-container">
            <view class="paper-airplane">✈</view>
            <view class="sparkle sparkle1">✨</view>
            <view class="sparkle sparkle2">✨</view>
            <view class="sparkle sparkle3">✨</view>
          </view>
          <view class="header-info">
            <text class="greeting">hi 眠友</text>
            <text class="char-count-header">{{ messageContent.length }}/150</text>
          </view>
        </view>
        
        <!-- 提示文字 -->
        <view class="prompt-text">
          <text>传递一封简单的"晚安",为每一个孤单的夜晚,增添一些幸福的小元素。</text>
        </view>
        
        <!-- 输入区域 -->
        <view class="input-section">
          <view class="input-wrapper">
            <textarea 
              class="message-input" 
              v-model="messageContent"
              placeholder=""
              maxlength="150"
            />
            <view class="footer-info">
              <text class="sender-name">星眠坞</text>
              <text class="message-date">{{ currentDate }}</text>
            </view>
          </view>
        </view>
        
        <!-- 底部按钮 -->
        <view class="panel-footer">
          <button 
            class="send-btn" 
            @click="sendMessage"
            :disabled="!messageContent.trim() || sending"
          >
            {{ sending ? '投递中...' : '投递晚安' }}
          </button>
        </view>
      </view>

      <!-- 接收晚安 -->
      <view v-show="activeTab === 'receive'" class="content-panel">
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
      <view v-show="activeTab === 'mybox'" class="content-panel">
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
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-buttons">
      <view 
        :class="['bottom-btn', { active: activeTab === 'send' }]"
        @click="toggleTab('send')"
      >
        <view class="btn-icon send-icon">✈</view>
        <text class="btn-text">投递晚安</text>
      </view>
      <view 
        :class="['bottom-btn', { active: activeTab === 'receive' }]"
        @click="toggleTab('receive')"
      >
        <view class="btn-icon receive-icon">✉</view>
        <text class="btn-text">接收晚安</text>
      </view>
      <view 
        :class="['bottom-btn', { active: activeTab === 'mybox' }]"
        @click="toggleTab('mybox')"
      >
        <view class="btn-icon mailbox-icon">📮</view>
        <text class="btn-text">我的信箱</text>
      </view>
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

const activeTab = ref(null)
const messageContent = ref('')
const sending = ref(false)
const receivedMessage = ref(null)
const myMessages = ref([])
const showReplyModal = ref(false)
const replyContent = ref('')
const replying = ref(false)
const currentMessageId = ref(null)

// 获取当前日期
function getCurrentDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const currentDate = ref(getCurrentDate())

function goBack() {
  uni.navigateBack()
}

function toggleTab(tab) {
  if (activeTab.value === tab) {
    activeTab.value = null
  } else {
    activeTab.value = tab
  }
}

function getStarStyle(index) {
  const size = Math.random() * 3 + 2
  const left = Math.random() * 100
  const top = Math.random() * 50
  const delay = Math.random() * 2
  return {
    width: size + 'px',
    height: size + 'px',
    left: left + '%',
    top: top + '%',
    animationDelay: delay + 's'
  }
}

import { getMyMails, sendMail, pickMail } from '@/api/mailbox'
import { getMe } from '@/api/auth'

async function sendMessage() {
  if (!messageContent.value.trim()) {
    uni.showToast({ title: '请输入消息内容', icon: 'none' })
    return
  }

  sending.value = true
  try {
    // 获取 token
    const raw = uni.getStorageSync('app_auth_user')
    const auth = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
    const token = auth?.token
    await sendMail({ content: messageContent.value.trim(), token })
    sending.value = false
    uni.showToast({ title: '晚安已出发～', icon: 'success' })
    messageContent.value = ''
    // 刷新我的已投递列表
    loadMyMessages('sent')
  } catch (e) {
    sending.value = false
    console.error(e)
    uni.showToast({ title: '投递失败，请重试', icon: 'none' })
  }
}

async function receiveMessage() {
  // 防多次点击
  if (sending.value) return
  sending.value = true
  try {
    const raw = uni.getStorageSync('app_auth_user')
    const auth = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
    const token = auth?.token
    const res = await pickMail({ token })
    sending.value = false
    const data = res?.data || res
    if (!data) {
      uni.showToast({ title: '暂无可领取的晚安', icon: 'none' })
      return
    }
    receivedMessage.value = data
    // 刷新我的收到列表
    loadMyMessages('received')
  } catch (e) {
    sending.value = false
    console.error(e)
    uni.showToast({ title: '领取失败，请重试', icon: 'none' })
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

async function sendReply() {
  if (!replyContent.value.trim()) {
    uni.showToast({ title: '请输入回信内容', icon: 'none' })
    return
  }

  replying.value = true
  // TODO: 如果需要后端回信接口可在此调用
  setTimeout(() => {
    replying.value = false
    uni.showToast({ title: '回信成功', icon: 'success' })
    closeReply()
    receivedMessage.value = null
  }, 1000)
}

function viewMessageDetail(msg) {
  // 跳转到详情页或显示 modal
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

async function loadMyMessages(type = 'sent') {
  try {
    const raw = uni.getStorageSync('app_auth_user')
    const auth = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
    const token = auth?.token
    const res = await getMyMails({ token, type })
    const data = res?.data || res
    if (type === 'sent') myMessages.value = data || []
    if (type === 'received') myMessages.value = data || []
  } catch (e) {
    console.error('loadMyMessages error', e)
  }
}

onMounted(() => {
  loadMyMessages('sent')
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  position: relative;
  background: linear-gradient(180deg, #1a1a3e 0%, #0f0f2e 50%, #0a0a1a 100%);
  overflow: hidden;
  padding-bottom: 120px;
}

/* 夜空背景 */
.night-sky {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60%;
  overflow: hidden;
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
  top: 15%;
  right: 10%;
  width: 90px;
  height: 90px;
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

.cloud {
  position: absolute;
  background: rgba(100, 120, 150, 0.3);
  border-radius: 50px;
  opacity: 0.6;
}

.cloud:before,
.cloud:after {
  content: '';
  position: absolute;
  background: rgba(100, 120, 150, 0.3);
  border-radius: 50px;
}

.cloud1 {
  width: 100px;
  height: 40px;
  top: 20%;
  right: 15%;
}

.cloud1:before {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 10px;
}

.cloud1:after {
  width: 60px;
  height: 40px;
  top: -15px;
  right: 10px;
}

.cloud2 {
  width: 80px;
  height: 30px;
  top: 30%;
  right: 25%;
}

.cloud2:before {
  width: 40px;
  height: 40px;
  top: -20px;
  left: 5px;
}

.cloud3 {
  width: 70px;
  height: 25px;
  top: 25%;
  right: 5%;
}

.cloud3:before {
  width: 35px;
  height: 35px;
  top: -18px;
  left: 8px;
}

/* 邮局建筑 - 始终显示在背景 */
.post-office-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 300px;
  pointer-events: none;
}

.post-office {
  position: relative;
  width: 280px;
  height: 280px;
}

.signboard {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 248, 220, 0.95) 100%);
  padding: 10px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.4),
              0 0 30px rgba(255, 255, 255, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
  z-index: 3;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.signboard-text {
  font-size: 17px;
  font-weight: 700;
  color: #2a3a5a;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.building {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #2a3a5a 0%, #1a2a4a 100%);
  border-radius: 8px 8px 0 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4),
              0 0 20px rgba(0, 0, 0, 0.2),
              inset 0 -2px 0 rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.building:before {
  content: '';
  position: absolute;
  top: -20px;
  left: 0;
  width: 100%;
  height: 30px;
  background: #1a2a4a;
  border-radius: 8px 8px 0 0;
}

.window {
  position: absolute;
  width: 50px;
  height: 60px;
  background: #ffd700;
  border: 3px solid #1a1a3e;
  border-radius: 4px;
  overflow: hidden;
}

.window-left {
  top: 30px;
  left: 20px;
}

.window-right {
  top: 30px;
  right: 20px;
}

.window-light {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #fff8dc 100%);
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.7),
              0 0 50px rgba(255, 215, 0, 0.4),
              inset 0 0 10px rgba(255, 255, 255, 0.3);
  animation: glow 2.5s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { 
    opacity: 0.85;
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.7),
                0 0 50px rgba(255, 215, 0, 0.4),
                inset 0 0 10px rgba(255, 255, 255, 0.3);
  }
  50% { 
    opacity: 1;
    box-shadow: 0 0 35px rgba(255, 215, 0, 0.9),
                0 0 70px rgba(255, 215, 0, 0.5),
                inset 0 0 15px rgba(255, 255, 255, 0.4);
  }
}

.cat-silhouette {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 25px;
  background: #1a1a3e;
  border-radius: 50% 50% 0 0;
}

.cat-silhouette:before {
  content: '';
  position: absolute;
  top: -8px;
  left: 5px;
  width: 8px;
  height: 8px;
  background: #1a1a3e;
  border-radius: 50%;
}

.cat-silhouette:after {
  content: '';
  position: absolute;
  top: -8px;
  right: 5px;
  width: 8px;
  height: 8px;
  background: #1a1a3e;
  border-radius: 50%;
}

.door {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 80px;
  background: #8b7355;
  border-radius: 4px 4px 0 0;
  border: 2px solid #6b5a45;
}

.tree {
  position: absolute;
  bottom: 0;
  width: 40px;
  height: 120px;
  background: #1a2a3a;
  border-radius: 20px 20px 0 0;
}

.tree-left {
  left: -30px;
}

.tree-right {
  right: -30px;
}

.tree:before {
  content: '';
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 60px;
  background: #1a2a3a;
  border-radius: 50%;
}

.mailbox {
  position: absolute;
  bottom: 20px;
  right: -40px;
  width: 38px;
  height: 52px;
  background: linear-gradient(135deg, #c41e3a 0%, #a01a2f 100%);
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(196, 30, 58, 0.4),
              0 0 15px rgba(196, 30, 58, 0.2),
              inset 0 -2px 0 rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mailbox:before {
  content: '';
  position: absolute;
  top: -8px;
  left: 0;
  width: 100%;
  height: 12px;
  background: linear-gradient(135deg, #8b0000 0%, #6b0000 100%);
  border-radius: 6px 6px 0 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

/* 内容区域 - 覆盖在邮局上方 */
.content-area {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  width: 90%;
  max-width: 400px;
  pointer-events: none;
}

.content-panel {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15),
              0 0 0 1px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto;
  max-height: 70vh;
  overflow-y: auto;
  animation: panelSlideIn 0.3s ease-out;
}

@keyframes panelSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 投递晚安面板特殊样式 */
.send-panel {
  background: linear-gradient(135deg, #F5E6D3 0%, #FFF8E7 50%, #F5E6D3 100%);
  padding: 28px;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(139, 111, 71, 0.2),
              0 0 0 1px rgba(139, 111, 71, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  pointer-events: auto;
  max-height: 70vh;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  position: relative;
}

.airplane-container {
  position: relative;
  margin-right: 12px;
}

.paper-airplane {
  font-size: 32px;
  line-height: 1;
  transform: rotate(-20deg);
}

.sparkle {
  position: absolute;
  font-size: 14px;
  color: #FFD700;
  animation: sparkle 2s ease-in-out infinite;
}

.sparkle1 {
  top: -8px;
  left: 20px;
  animation-delay: 0s;
}

.sparkle2 {
  top: 8px;
  left: 30px;
  animation-delay: 0.5s;
}

.sparkle3 {
  top: 0px;
  left: 40px;
  animation-delay: 1s;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.header-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.greeting {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.char-count-header {
  font-size: 14px;
  color: #666;
}

.prompt-text {
  margin-bottom: 20px;
  padding: 12px 0;
}

.prompt-text text {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.input-section {
  margin-bottom: 20px;
}

.input-wrapper {
  position: relative;
  min-height: 220px;
  background: transparent;
  border-radius: 12px;
}

.message-input {
  width: 100%;
  min-height: 220px;
  padding: 16px;
  padding-bottom: 60px;
  border-radius: 12px;
  background: transparent;
  border: none;
  color: #333;
  font-size: 15px;
  box-sizing: border-box;
  line-height: 1.8;
}

.message-input::placeholder {
  color: #999;
}

.char-count {
  display: block;
  text-align: right;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.panel-footer {
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer-info {
  position: absolute;
  bottom: 12px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  pointer-events: none;
}

.sender-name {
  font-size: 13px;
  color: #666;
}

.message-date {
  font-size: 12px;
  color: #999;
}

.send-btn {
  flex: 1;
  max-width: 200px;
  padding: 16px 32px;
  border-radius: 28px;
  background: linear-gradient(135deg, #8B6F47 0%, #6B5A3A 100%);
  color: #fff;
  border: none;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 15px rgba(139, 111, 71, 0.4),
              0 0 0 1px rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.send-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(139, 111, 71, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  transform: none;
}

.message-bubble {
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 16px;
}

.message-bubble.received {
  background: linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.message-text {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.6;
}

.message-time {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.message-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 10px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e8e8e8 0%, #d8d8d8 100%);
  color: #333;
  border: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.action-btn.primary {
  background: linear-gradient(135deg, #7B61FF 0%, #6B51EF 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(123, 97, 255, 0.4);
}

.action-btn.primary:active {
  box-shadow: 0 2px 8px rgba(123, 97, 255, 0.3);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.empty-text {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.receive-btn {
  padding: 14px 32px;
  border-radius: 24px;
  background: linear-gradient(135deg, #7B61FF 0%, #6B51EF 100%);
  color: #fff;
  border: none;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(123, 97, 255, 0.4);
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.receive-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(123, 97, 255, 0.3);
}

.message-list {
  max-height: 400px;
}

.message-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  margin-bottom: 10px;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.message-item:active {
  transform: translateY(1px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
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
  color: #333;
  margin-left: 16px;
}

.message-date {
  font-size: 12px;
  color: #999;
}

/* 底部按钮 */
.bottom-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px 16px 24px;
  background: linear-gradient(180deg, rgba(26, 26, 62, 0.98) 0%, rgba(15, 15, 46, 0.95) 100%);
  backdrop-filter: blur(20px);
  z-index: 100;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.bottom-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.btn-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a5a7a 0%, #3a4a6a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.bottom-btn.active .btn-icon {
  background: linear-gradient(135deg, #7B61FF 0%, #6B51EF 100%);
  transform: scale(1.15) translateY(-4px);
  box-shadow: 0 8px 20px rgba(123, 97, 255, 0.4),
              0 0 0 2px rgba(123, 97, 255, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-icon:active {
  transform: scale(0.95);
}

.send-icon {
  font-size: 24px;
}

.receive-icon {
  font-size: 24px;
}

.mailbox-icon {
  font-size: 24px;
}

.btn-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  transition: all 0.3s ease;
  font-weight: 500;
  margin-top: 4px;
}

.bottom-btn.active .btn-text {
  color: #fff;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(123, 97, 255, 0.5);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
  border-radius: 24px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
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
  padding: 14px;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  color: #333;
  font-size: 14px;
  margin-bottom: 16px;
  box-sizing: border-box;
  transition: all 0.3s ease;
  line-height: 1.6;
}

.reply-input:focus {
  border-color: #7B61FF;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(123, 97, 255, 0.1);
}
</style>