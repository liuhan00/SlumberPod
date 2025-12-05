<template>
  <view class="page" :style="bgStyle">
    <!-- 顶部导航栏 -->
    <view class="nav-header">
      <view class="nav-back" @click="goBack">
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
function goBack() {
  uni.navigateBack()
}

function goToStudy() {
  uni.switchTab({
    url: '/pages/sleep/index'
  })
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
</style>