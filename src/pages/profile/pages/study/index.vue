<template>
  <view class="page" :style="bgStyle">
    <!-- 顶部导航栏 -->
    <view class="nav-header">
      <view class="nav-back" @click="handleBackClick">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">我的学习</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="content" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <!-- 错误信息 -->
      <view v-else-if="error" class="error">
        <text>{{ error }}</text>
        <button class="retry-btn" @click="loadStudyHistory">重新加载</button>
      </view>

      <!-- 空状态 -->
      <view v-else-if="studyHistory.length === 0" class="empty-state">
        <text class="empty-icon">📚</text>
        <text class="empty-text">暂无学习记录</text>
        <text class="empty-desc">快去自习室开始学习吧</text>
        <button class="study-btn" @click="goToStudy">前往自习室</button>
      </view>

      <!-- 学习记录列表 -->
      <view v-else class="history-list">
        <view 
          v-for="record in studyHistory" 
          :key="record.id" 
          class="history-item"
        >
          <view class="item-header">
            <text class="item-date">{{ formatDateTime(record.date || record.created_at || record.createdAt) }}</text>
          </view>
          
          <view class="item-content">
            <view class="duration-section">
              <text class="duration-label">学习时长</text>
              <text class="duration-value">{{ formatDuration(record.duration || record.study_duration || 0) }}</text>
            </view>
            
            <view v-if="record.subject || record.topic" class="subject-section">
              <text class="subject-label">学习内容</text>
              <text class="subject-value">{{ record.subject || record.topic }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 计时器设置弹窗：选择退出后是否继续计时 -->
    <view v-if="showTimerSettings" class="timer-settings-overlay" @click="closeTimerSettings">
      <view class="timer-settings" @click.stop>
        <text class="ts-title">退出学习</text>
        <text class="ts-subtitle">请选择退出方式</text>
        <view class="ts-option" @click="handleContinueAndReturn">
          <view class="ts-option-content">
            <text class="ts-label">继续计时</text>
            <text class="ts-desc">暂停当前计时，下次进入接着计时</text>
          </view>
          <text class="ts-icon">→</text>
        </view>
        <view class="ts-option" @click="handleResetAndReturn">
          <view class="ts-option-content">
            <text class="ts-label">重新计时</text>
            <text class="ts-desc">结束本次学习，下次从 00:00 开始</text>
          </view>
          <text class="ts-icon">→</text>
        </view>
        <view class="ts-actions">
          <button class="ts-cancel" @click="closeTimerSettings">取消</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { getAuthLocal } from '@/store/auth'
import * as apiStudyHistory from '@/api/studyHistory'

const { bgStyle } = useGlobalTheme()

// 数据状态
const studyHistory = ref([])
const loading = ref(false)
const error = ref('')
const showTimerSettings = ref(false)

// 加载学习历史记录
async function loadStudyHistory() {
  try {
    loading.value = true
    error.value = ''
    
    const auth = getAuthLocal()
    if (!auth || !auth.token) {
      throw new Error('请先登录')
    }
    
    const list = await apiStudyHistory.getStudyHistory({ page: 1, limit: 50 })
    
    // 处理学习记录数据
    studyHistory.value = Array.isArray(list) ? list : []
  } catch (e) {
    console.error('[profile.study] load study history failed', e)
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '未知时间'
  try {
    const date = new Date(dateTimeStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  } catch (e) {
    return dateTimeStr
  }
}

// 格式化学习时长
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0分钟'
  
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return `${hours}小时${remainingMinutes}分钟`
  }
  
  return `${minutes}分钟`
}

// 导航函数
function goToStudy() {
  uni.switchTab({
    url: '/pages/sleep/index'
  })
}

// 处理返回按钮点击
function handleBackClick() {
  console.log('[Profile Study] 用户点击返回按钮')
  // 显示计时器设置弹窗
  showTimerSettings.value = true
  console.log('[Profile Study] 显示计时器设置弹窗')
}

// 关闭计时器设置弹窗
function closeTimerSettings() {
  console.log('[Profile Study] 关闭计时器设置弹窗')
  showTimerSettings.value = false
}

// 继续计时并返回
function handleContinueAndReturn() {
  console.log('[Profile Study] 用户选择继续计时')
  // 保存设置：下次继续计时
  uni.setStorageSync('studyTimerResumePolicy', { resume: true })
  
  // 关闭弹窗并返回
  closeTimerSettings()
  setTimeout(() => {
    uni.navigateBack()
  }, 300)
}

// 重新计时并返回
function handleResetAndReturn() {
  console.log('[Profile Study] 用户选择重新计时')
  // 保存设置：下次重新计时
  uni.setStorageSync('studyTimerResumePolicy', { resume: false })
  
  // 关闭弹窗并返回
  closeTimerSettings()
  setTimeout(() => {
    uni.navigateBack()
  }, 300)
}

// 页面加载时获取数据
onMounted(() => {
  loadStudyHistory()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg, #f5f5f5);
  overflow-x: hidden;
}

/* 顶部导航栏 */
.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--card-bg, #ffffff);
  border-bottom: 1px solid var(--border, #f0f0f0);
  position: sticky;
  top: 0;
  z-index: 100;
  box-sizing: border-box;
}

.nav-back {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--input-bg, #f8f9fa);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-icon {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg, #333);
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg, #333);
}

.nav-placeholder {
  width: 32px;
}

/* 内容区域 */
.content {
  flex: 1;
  padding: 16px;
  box-sizing: border-box;
  overflow-x: hidden;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.retry-btn, .study-btn {
  margin-top: 16px;
  padding: 10px 20px;
  border-radius: 20px;
  background: var(--uni-color-primary, #007aff);
  color: white;
  border: none;
  font-size: 14px;
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
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg, #333);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--muted, #999);
  margin-bottom: 24px;
}

/* 学习记录列表 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  box-sizing: border-box;
}

.history-item {
  background: var(--card-bg, #ffffff);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  box-sizing: border-box;
  width: 100%;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border, #f0f0f0);
}

.item-date {
  font-size: 14px;
  color: var(--muted, #999);
  font-weight: 500;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.duration-section, .subject-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.duration-label, .subject-label {
  font-size: 12px;
  color: var(--muted, #999);
}

.duration-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg, #333);
}

.subject-value {
  font-size: 14px;
  color: var(--fg, #333);
  line-height: 1.4;
}

/* 计时器设置弹窗样式 */
.timer-settings-overlay {
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

.timer-settings {
  background: var(--card-bg, #ffffff);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 320px;
  box-sizing: border-box;
}

.ts-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--fg, #333);
  text-align: center;
  display: block;
  margin-bottom: 8px;
}

.ts-subtitle {
  font-size: 14px;
  color: var(--muted, #999);
  text-align: center;
  display: block;
  margin-bottom: 20px;
}

.ts-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 12px;
  background: var(--input-bg, #f8f9fa);
  margin-bottom: 12px;
  cursor: pointer;
}

.ts-option-content {
  display: flex;
  flex-direction: column;
}

.ts-label {
  font-size: 16px;
  font-weight: 500;
  color: var(--fg, #333);
  margin-bottom: 4px;
}

.ts-desc {
  font-size: 12px;
  color: var(--muted, #999);
}

.ts-icon {
  font-size: 16px;
  color: var(--muted, #999);
}

.ts-actions {
  margin-top: 16px;
  text-align: center;
}

.ts-cancel {
  background: none;
  border: none;
  color: var(--uni-color-primary, #007aff);
  font-size: 16px;
  padding: 8px 16px;
  cursor: pointer;
}
</style>
