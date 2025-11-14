<template>
  <view class="page" :style="bgStyle">
    <view class="header">
      <button class="back-btn" @click="goBack">←</button>
      <text class="title">{{ storyTitle }}</text>
    </view>

    <scroll-view class="content" scroll-y>
      <view class="story-content">
        <text class="story-text">{{ storyContent }}</text>
      </view>
    </scroll-view>

    <view class="player-section">
      <view class="player-controls">
        <button class="control-btn" @click="togglePlay">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        <view class="progress-info">
          <text class="time-text">{{ formattedCurrentTime }}/{{ formattedDuration }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { usePlayerStore } from '@/stores/player'

const { bgStyle } = useGlobalTheme()
const player = usePlayerStore()

const storyTitle = ref('')
const storyContent = ref('')
const storyId = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

let audioCtx = null

const formattedCurrentTime = computed(() => {
  const mm = String(Math.floor(currentTime.value / 60)).padStart(2, '0')
  const ss = String(currentTime.value % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

const formattedDuration = computed(() => {
  const mm = String(Math.floor(duration.value / 60)).padStart(2, '0')
  const ss = String(duration.value % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

onLoad((query) => {
  storyId.value = query.id
  storyTitle.value = query.title ? decodeURIComponent(query.title) : '睡眠故事'
  
  // TODO: 从后端加载故事内容
  // 示例内容
  storyContent.value = '这是一个温暖的睡眠故事...'
  
  // 初始化音频
  initAudio()
})

function initAudio() {
  audioCtx = uni.createInnerAudioContext()
  audioCtx.obeyMuteSwitch = false
  
  // TODO: 设置音频URL
  // audioCtx.src = storyAudioUrl
  
  audioCtx.onTimeUpdate(() => {
    currentTime.value = Math.floor(audioCtx.currentTime)
  })
  
  audioCtx.onCanplay(() => {
    duration.value = Math.floor(audioCtx.duration)
  })
  
  audioCtx.onEnded(() => {
    isPlaying.value = false
  })
}

function togglePlay() {
  if (isPlaying.value) {
    audioCtx?.pause()
    isPlaying.value = false
  } else {
    audioCtx?.play()
    isPlaying.value = true
  }
}

function goBack() {
  uni.navigateBack()
}

onMounted(() => {
  // 预加载故事内容
  // TODO: 从缓存或后端加载
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.back-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--fg);
  padding: 8px;
  margin-right: 12px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
}

.content {
  flex: 1;
  padding: 16px;
}

.story-content {
  padding: 16px;
  background: var(--card-bg);
  border-radius: 12px;
}

.story-text {
  font-size: 16px;
  line-height: 1.6;
  color: var(--fg);
  white-space: pre-wrap;
}

.player-section {
  padding: 16px;
  background: var(--card-bg);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-btn {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: #7B61FF;
  color: #fff;
  border: none;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-info {
  flex: 1;
}

.time-text {
  font-size: 12px;
  color: var(--muted);
  font-family: 'Courier New', monospace;
}
</style>




