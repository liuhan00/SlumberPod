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
          <text class="message-time">{{ formatTime(receivedMessage.time || receivedMessage.created_at || receivedMessage.createdAt) }}</text>
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
        <!-- 分类标签 -->
        <view class="category-tabs">
          <view 
            :class="['tab', { active: mailCategory === 'sent' }]"
            @click="switchMailCategory('sent')"
          >
            我发送的
          </view>
          <view 
            :class="['tab', { active: mailCategory === 'received' }]"
            @click="switchMailCategory('received')"
          >
            我接收的
          </view>
        </view>
        
        <scroll-view class="message-list" scroll-y>
          <view 
            v-for="msg in filteredMessages" 
            :key="msg.id || msg.threadId || msg.thread_id || msg.messageId || msg.message_id || msg._id || msg.content.substring(0, 10)"
            class="message-item"
            @click="viewMessageDetail(msg)"
          >
            <view v-if="!msg.read" class="unread-dot"></view>
            <text class="message-preview">{{ msg.content.substring(0, 20) }}...</text>
            <text class="message-date">{{ formatTime(msg.time || msg.created_at || msg.createdAt) }}</text>
          </view>
          <view v-if="filteredMessages.length === 0" class="empty-state">
            <text class="empty-text">暂无消息</text>
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

    <!-- 统计信息弹窗 -->
    <view v-if="showStatsModal" class="modal-overlay" @click="closeStatsModal">
      <view class="modal-content stats-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">信箱统计</text>
          <button class="modal-close" @click="closeStatsModal">×</button>
        </view>
        <view class="stats-content">
          <view class="stat-item">
            <text class="stat-label">总信件数：</text>
            <text class="stat-value">{{ mailboxStats.totalCount }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">未读信件：</text>
            <text class="stat-value">{{ mailboxStats.unreadCount }}</text>
          </view>
        </view>
        <button class="confirm-btn" @click="closeStatsModal">确定</button>
      </view>
    </view>


  </view>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMyMails, sendMail, getMailboxStats, dailyAssignment, getReceivedMessages, getMessageDetail } from '@/api/mailbox'
import { getMe } from '@/api/auth'

const activeTab = ref(null)
const messageContent = ref('')
const sending = ref(false)
const receivedMessage = ref(null)
const myMessages = ref([])
const showReplyModal = ref(false)
const replyContent = ref('')
const replying = ref(false)
const currentMessageId = ref(null)
const mailCategory = ref('sent') // 默认显示发送的信件
const sentMessages = ref([]) // 我发送的信件
const receivedMessages = ref([]) // 我接收的信件
const showStatsModal = ref(false) // 是否显示统计信息弹窗
const mailboxStats = ref({ unreadCount: 0, totalCount: 0 }) // 信箱统计信息

// 获取当前日期
function getCurrentDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const currentDate = ref(getCurrentDate())

// 计算属性：根据分类过滤消息
const filteredMessages = computed(() => {
  if (mailCategory.value === 'sent') {
    return sentMessages.value
  } else {
    return receivedMessages.value
  }
})

function goBack() {
  uni.navigateBack()
}

function toggleTab(tab) {
  if (activeTab.value === tab) {
    activeTab.value = null
  } else {
    activeTab.value = tab
    // 当切换到我的信箱时，加载数据
    if (tab === 'mybox') {
      loadMyMessages('sent')
      loadMyMessages('received')
    }
    // 当切换到接收晚安时，自动加载接收的信件
    else if (tab === 'receive') {
      // 确保系统信件已分配
      assignDailyMail()
      // 加载接收的信件
      loadMyMessages('received')
    }
  }
}

// 切换邮件分类
function switchMailCategory(category) {
  mailCategory.value = category
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
    console.error('[Mailbox] sendMessage error:', e)
    // 显示具体错误信息
    const errorMsg = (e && e.message) ? e.message : '投递失败，请重试'
    uni.showToast({ title: errorMsg, icon: 'none' })
  }
}

async function receiveMessage() {
  // 防多次点击
  if (sending.value) return
  sending.value = true
  
  try {
    // 直接加载我接收的信件列表
    await loadMyMessages('received')
    
    // 如果有信件，自动显示第一封信的详情
    if (receivedMessages.value && receivedMessages.value.length > 0) {
      // 切换到我的信箱标签并显示接收的信件
      activeTab.value = 'mybox'
      mailCategory.value = 'received'
      
      // 自动打开第一封信的详情
      const firstMessage = receivedMessages.value[0]
      console.log('[Mailbox] First message:', firstMessage)
      
      // 检查消息对象是否完整
      if (!firstMessage) {
        uni.showToast({ 
          title: '信件信息为空', 
          icon: 'none',
          duration: 2000
        })
        return
      }
      
      // 检查消息中是否有id字段，如果没有则尝试其他可能的字段
      let threadId = firstMessage.id;
      if (!threadId) {
        // 尝试其他可能的ID字段名（包括下划线格式）
        threadId = firstMessage.threadId || firstMessage.thread_id || firstMessage.messageId || firstMessage.message_id || firstMessage._id;
      }
      
      if (!threadId) {
        uni.showToast({ 
          title: '信件缺少ID', 
          icon: 'none',
          duration: 2000
        })
        return
      }
      
      // 创建一个包含正确ID字段的消息对象
      const messageWithId = { ...firstMessage };
      if (!messageWithId.id && threadId) {
        messageWithId.id = threadId;
      }
      await viewMessageDetail(messageWithId)
    } else {
      uni.showToast({ 
        title: '暂无分配的信件', 
        icon: 'none',
        duration: 2000
      })
    }
  } catch (e) {
    console.error('receiveMessage error', e)
    uni.showToast({ 
      title: '获取信件失败', 
      icon: 'none',
      duration: 2000
    })
  } finally {
    sending.value = false
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

function closeStatsModal() {
  showStatsModal.value = false
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

async function viewMessageDetail(msg) {
  console.log('[Mailbox] viewMessageDetail called with:', msg)
  
  if (!msg) {
    uni.showToast({ title: '信件信息为空', icon: 'none' })
    return
  }
  
  // 检查消息中是否有id字段，如果没有则尝试其他可能的字段
  let threadId = msg.id;
  if (!threadId) {
    // 尝试其他可能的ID字段名（包括下划线格式）
    threadId = msg.threadId || msg.thread_id || msg.messageId || msg.message_id || msg._id;
  }
  
  if (!threadId) {
    uni.showToast({ title: '信件缺少ID', icon: 'none' })
    return
  }
  
  // 跳转到信件详情页面
  uni.navigateTo({
    url: `/pages/sleep/MessageDetail?id=${threadId}`
  })
}

function formatTime(timestamp) {
  // 如果没有时间戳，返回默认值
  if (!timestamp) return '未知时间'
  
  // 尝试创建日期对象
  let date;
  if (typeof timestamp === 'string' && !isNaN(Date.parse(timestamp))) {
    // 如果是字符串格式的时间
    date = new Date(timestamp);
  } else if (typeof timestamp === 'number') {
    // 如果是数字格式的时间戳（秒或毫秒）
    // 检查是否是秒级时间戳
    if (timestamp < 10000000000) {
      date = new Date(timestamp * 1000); // 转换为毫秒
    } else {
      date = new Date(timestamp); // 已经是毫秒级时间戳
    }
  } else {
    // 其他情况直接尝试转换
    date = new Date(timestamp);
  }
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) return '时间格式错误'
  
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
    
    // 检查 token 是否存在
    if (!token) {
      console.warn('[Mailbox] Token 不存在，用户可能未登录')
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    let data = []
    if (type === 'sent') {
      const res = await getMyMails({ token, type })
      data = res?.data || res || []
      console.log('[Mailbox] Sent messages:', data)
      sentMessages.value = data
    } else if (type === 'received') {
      // 使用专门的接口获取接收的晚安列表
      const res = await getReceivedMessages({ token })
      data = res || []
      console.log('[Mailbox] Received messages:', data)
      receivedMessages.value = data
    }
  } catch (e) {
    console.error('loadMyMessages error', e)
    // 显示具体错误信息
    const errorMsg = e?.message || '加载消息失败'
    uni.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 2000
    })
  }
}

// 系统自动分配信件（仅在第一次登录时）
async function assignDailyMail() {
  try {
    const raw = uni.getStorageSync('app_auth_user')
    const auth = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
    const token = auth?.token
    
    // 检查 token 是否存在
    if (!token) {
      console.warn('[Mailbox] Token 不存在，用户可能未登录')
      return
    }
    
    // 检查是否已经分配过系统信件（通过本地存储标记）
    const assignedFlag = uni.getStorageSync('daily_mail_assigned')
    if (assignedFlag) {
      console.log('[Mailbox] 系统信件已分配过，跳过')
      return
    }
    
    // 调用系统自动分配信件接口
    await dailyAssignment({ token })
    
    // 设置分配标记，避免重复分配
    uni.setStorageSync('daily_mail_assigned', true)
    
    console.log('[Mailbox] 系统自动分配信件成功')
  } catch (e) {
    console.error('[Mailbox] 系统自动分配信件失败:', e)
    // 即使分配失败也不影响其他功能
  }
}

// 获取信箱统计信息
async function loadMailboxStats() {
  try {
    const raw = uni.getStorageSync('app_auth_user')
    const auth = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
    const token = auth?.token
    
    // 检查 token 是否存在
    if (!token) {
      console.warn('[Mailbox] Token 不存在，用户可能未登录')
      return
    }
    
    const stats = await getMailboxStats({ token })
    mailboxStats.value = stats || { unreadCount: 0, totalCount: 0 }
    
    // 如果有未读或总信件，则显示弹窗
    if (stats?.unreadCount > 0 || stats?.totalCount > 0) {
      showStatsModal.value = true
    }
  } catch (e) {
    console.error('loadMailboxStats error', e)
  }
}

// 页面显示时检查是否需要刷新数据
function checkRefresh() {
  // 检查是否有需要刷新的标记
  const needRefresh = uni.getStorageSync('mailbox_need_refresh')
  const readMessageId = uni.getStorageSync('mailbox_read_message_id')
  
  console.log('[Mailbox] checkRefresh called, needRefresh:', needRefresh, 'readMessageId:', readMessageId)
  
  if (needRefresh) {
    // 清除刷新标记
    uni.removeStorageSync('mailbox_need_refresh')
    
    // 如果在信箱页面，刷新数据
    if (activeTab.value === 'mybox') {
      console.log('[Mailbox] Refreshing messages')
      // 重新加载数据
      loadMyMessages('sent')
      loadMyMessages('received')
      
      // 如果有已读消息ID，等待数据加载完成后更新本地数据
      if (readMessageId) {
        console.log('[Mailbox] Updating read status for message:', readMessageId)
        // 使用 setTimeout 确保在数据加载完成后更新
        setTimeout(() => {
          // 更新发送的消息列表
          sentMessages.value = sentMessages.value.map(msg => {
            // 检查各种可能的ID字段
            const msgId = msg.id || msg.thread_id || msg.threadId || msg.messageId || msg.message_id || msg._id
            if (msgId === readMessageId) {
              console.log('[Mailbox] Marking sent message as read:', msgId)
              return { ...msg, read: true }
            }
            return msg
          })
          
          // 更新接收的消息列表
          receivedMessages.value = receivedMessages.value.map(msg => {
            // 检查各种可能的ID字段
            const msgId = msg.id || msg.thread_id || msg.threadId || msg.messageId || msg.message_id || msg._id
            if (msgId === readMessageId) {
              console.log('[Mailbox] Marking received message as read:', msgId)
              return { ...msg, read: true }
            }
            return msg
          })
          
          // 清除已读消息ID标记
          uni.removeStorageSync('mailbox_read_message_id')
        }, 100)
      }
    }
  }
}

// 监听页面显示事件
onMounted(() => {
  // 系统自动分配信件（仅在第一次登录时）
  assignDailyMail()
  // 初始化时加载信箱统计信息
  loadMailboxStats()
  // 初始化时加载发送的信件
  loadMyMessages('sent')
  // 同时加载接收的信件
  loadMyMessages('received')
  // 默认激活发送晚安标签
  activeTab.value = 'send'
})

// 页面显示时的生命周期钩子
onShow(() => {
  checkRefresh()
})

// 清理监听器
onUnmounted(() => {
  // 不需要清理任何监听器
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

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 4px;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tab.active {
  background: #7B61FF;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(123, 97, 255, 0.3);
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

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 4px;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tab.active {
  background: #7B61FF;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(123, 97, 255, 0.3);
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

/* 统计信息弹窗样式 */
.stats-modal {
  text-align: center;
}

.stats-content {
  margin: 20px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 16px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #7B61FF;
}

.confirm-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #7B61FF 0%, #5D4CE0 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(123, 97, 255, 0.3);
}

</style>

