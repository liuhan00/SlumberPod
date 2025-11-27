<template>
  <scroll-view class="page" scroll-y>
    <!-- 头部区域 -->
    <view class="header">
      <text class="title">当前播放({{ store.playlist.length }})</text>
      <button class="btn danger" @click="clearQueue">清空</button>
    </view>
    
    <!-- 智能推荐开关 -->
    <view class="smart-recommend-section">
      <view class="switch-container">
        <view class="switch-info">
          <text class="switch-title">随便听听</text>
          <text class="switch-desc">开启后，播放完当前内容将自动推荐相似音效</text>
        </view>
        <view class="switch-wrapper">
          <switch 
            class="smart-switch" 
            :checked="smartRecommend" 
            @change="toggleSmartRecommend"
            color="#007aff"
          />
        </view>
      </view>
      
      <!-- 推荐源提示 -->
      <view v-if="smartRecommend" class="recommend-sources">
        <text class="sources-title">推荐来源：</text>
        <view class="sources-list">
          <text class="source-tag">星眠坞 · 枕边的他</text>
          <text class="source-tag">自然音效</text>
          <text class="source-tag">白噪音</text>
          <text class="source-tag">脑波音乐</text>
        </view>
      </view>
    </view>
    
    <!-- 当前播放列表 -->
    <view class="current-playlist">
      <view class="list-header">
        <text class="list-title">播放列表</text>
        <text class="list-count">{{ store.playlist.length }} 首</text>
      </view>
      
      <view class="list">
        <view 
          class="item" 
          v-for="(t, index) in store.playlist" 
          :key="t.id"
          :class="{ active: t.id === store.currentTrack?.id }"
        >
          <view class="item-left">
            <text class="item-index">{{ index + 1 }}</text>
            <image class="cover" :src="t.cover" mode="aspectFill" />
            <view class="meta">
              <text class="name">{{ t.name }}</text>
              <text class="author">{{ t.author }}</text>
            </view>
          </view>
          <view class="item-actions">
            <button class="action-btn play-btn" @click="playTrack(t)">▶</button>
            <button class="action-btn remove-btn" @click="remove(t.id)">×</button>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="store.playlist.length === 0" class="empty-state">
          <text class="empty-icon">🎵</text>
          <text class="empty-text">当前没有播放内容</text>
          <text class="empty-hint">去首页选择音效开始播放吧</text>
          <button class="empty-btn" @click="goToHome">去首页</button>
        </view>
      </view>
    </view>
    
    <!-- 操作提示 -->
    <view class="operation-tips">
      <text class="tip-text">💡 提示：长按曲目可调整播放顺序</text>
    </view>
  </scroll-view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePlayerStore } from '@/stores/player'

const store = usePlayerStore()

// 智能推荐开关状态
const smartRecommend = ref(false)

// 初始化时从本地存储读取设置
onMounted(() => {
  const savedSetting = uni.getStorageSync('smartRecommend')
  if (savedSetting !== '') {
    smartRecommend.value = savedSetting
  }
})

// 切换智能推荐
function toggleSmartRecommend(e) {
  smartRecommend.value = e.detail.value
  uni.setStorageSync('smartRecommend', smartRecommend.value)
  
  if (smartRecommend.value) {
    uni.showToast({
      title: '已开启智能推荐',
      icon: 'success'
    })
  } else {
    uni.showToast({
      title: '已关闭智能推荐',
      icon: 'none'
    })
  }
}

// 播放曲目
function playTrack(t) { 
  store.play(t)
  uni.navigateTo({ url:`/pages/player/index?id=${t.id}` }) 
}

// 移除曲目
function remove(id) { 
  store.playlist = store.playlist.filter(x => x.id !== id)
  uni.showToast({ title: '已移除', icon: 'success' })
}

// 清空队列
function clearQueue() { 
  uni.showModal({
    title: '清空播放列表',
    content: '确定要清空当前播放列表吗？',
    success: (res) => {
      if (res.confirm) {
        store.playlist = []
        uni.showToast({ title: '播放列表已清空', icon: 'success' })
      }
    }
  })
}

// 跳转首页
function goToHome() {
  uni.switchTab({ url: '/pages/noise/Free' })
}

// 调整播放顺序（长按功能）
function moveUp(id) {
  const i = store.playlist.findIndex(x => x.id === id)
  if (i > 0) {
    const arr = [...store.playlist]
    const [item] = arr.splice(i, 1)
    arr.splice(i - 1, 0, item)
    store.playlist = arr
  }
}

function moveDown(id) {
  const i = store.playlist.findIndex(x => x.id === id)
  if (i >= 0 && i < store.playlist.length - 1) {
    const arr = [...store.playlist]
    const [item] = arr.splice(i, 1)
    arr.splice(i + 1, 0, item)
    store.playlist = arr
  }
}
</script>

<style scoped>
.page { 
  min-height: 100vh;
  background: #f8f9fa;
}

/* 头部区域 */
.header { 
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.title { 
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn { 
  padding: 8px 16px;
  border-radius: 6px;
  background: #f2f3f5;
  border: none;
  font-size: 14px;
}

.danger { 
  background: #ffeded;
  color: #c62828;
}

/* 智能推荐区域 */
.smart-recommend-section {
  background: #fff;
  margin: 12px 16px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.switch-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.switch-info {
  flex: 1;
}

.switch-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.switch-desc {
  display: block;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.switch-wrapper {
  margin-left: 12px;
}

.smart-switch {
  transform: scale(0.9);
}

/* 推荐源提示 */
.recommend-sources {
  padding-top: 12px;
  border-top: 1px solid #f8f8f8;
}

.sources-title {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.sources-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.source-tag {
  background: #f0f7ff;
  color: #007aff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

/* 当前播放列表 */
.current-playlist {
  background: #fff;
  margin: 12px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f8f8f8;
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.list-count {
  font-size: 14px;
  color: #999;
}

.list {
  padding: 0 16px;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f8f8f8;
}

.item:last-child {
  border-bottom: none;
}

.item.active {
  background: #f0f7ff;
  margin: 0 -16px;
  padding: 12px 16px;
  border-radius: 8px;
}

.item-left {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 12px;
}

.item-index {
  font-size: 14px;
  color: #999;
  min-width: 20px;
  text-align: center;
}

.item.active .item-index {
  color: #007aff;
  font-weight: 600;
}

.cover { 
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.meta { 
  flex: 1;
}

.name { 
  display: block;
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.item.active .name {
  color: #007aff;
}

.author { 
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 4px;
  font-size: 14px;
}

.play-btn {
  color: #007aff;
}

.remove-btn {
  color: #999;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.empty-btn {
  background: #007aff;
  color: var(--text-color);
  border: none;
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 14px;
}

/* 操作提示 */
.operation-tips {
  padding: 16px;
  text-align: center;
}

.tip-text {
  font-size: 12px;
  color: #999;
}
</style>
