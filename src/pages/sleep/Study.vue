<template>
  <view class="page">
    <!-- 学习场景背景 -->
    <view class="scene-bg">
      <image class="scene-bg-img" :src="learnPng" mode="aspectFill" />
      <view class="scene-content">
        <!-- 可以在这里添加学习场景的装饰元素 -->
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view class="content-wrapper">
      <!-- 顶部状态栏（可选，显示时间等） -->
      <view class="top-status">
        <text class="status-time">{{ currentTime }}</text>
      </view>

      <!-- 左下角计时器 -->
      <view class="timer-display">
        <text class="timer-text">{{ formattedTime }}</text>
      </view>

      <!-- 音乐选择区域（右上角或中间） -->
      <view class="music-selector" v-if="showMusicSelector">
        <scroll-view class="music-list" scroll-y>
          <view 
            v-for="audio in focusAudios" 
            :key="audio.id"
            :class="['music-item', { active: currentAudio?.id === audio.id }]"
            @click="selectAudio(audio)"
          >
            <text class="music-name">{{ audio.name }}</text>
            <text v-if="currentAudio?.id === audio.id" class="playing-icon">▶</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 底部控制栏（去掉屏幕设置按钮） -->
    <view class="bottom-controls">
      <button class="control-btn" @click="toggleMusic">
        <view class="icon-svg">
          <image src="/static/icons/music.svg" mode="aspectFit" />
        </view>
      </button>
      <button class="control-btn" @click="toggleTimer">
        <view class="icon-svg">
          <image src="/static/icons/timer.svg" mode="aspectFit" />
        </view>
      </button>
      <button class="control-btn" @click="togglePause">
        <view class="icon-svg">
          <image src="/src/static/icons/pause.svg" v-if="isTimerRunning" mode="aspectFit" />
          <image src="/src/static/icons/play.svg" v-else mode="aspectFit" />
        </view>
      </button>
    </view>

    <!-- 计时器设置弹窗：选择退出后是否继续计时 -->
    <view v-if="showTimerSettings" class="timer-settings-overlay" @click="closeTimerSettings">
      <view class="timer-settings" @click.stop>
        <text class="ts-title">退出后下一次计时</text>
        <view class="ts-option" @click="setResumePolicy(true)">
          <text class="ts-label">继续计时（下次打开接着本次时间）</text>
          <text class="ts-check">{{ resumePolicy ? '●' : '○' }}</text>
        </view>
        <view class="ts-option" @click="setResumePolicy(false)">
          <text class="ts-label">重新计时（下次打开从 00:00 开始）</text>
          <text class="ts-check">{{ !resumePolicy ? '●' : '○' }}</text>
        </view>
        <view class="ts-actions">
          <button class="ts-cancel" @click="closeTimerSettings">取消</button>
          <button class="ts-save" @click="saveTimerSettings">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import learnPng from '@/static/learn.png'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { usePlayerStore } from '@/stores/player'

const { bgStyle } = useGlobalTheme()
const player = usePlayerStore()

// 正向计时器（从00:00开始）
const elapsedSeconds = ref(0)
const isTimerRunning = ref(false)
const currentAudio = ref(null)
const showMusicSelector = ref(false)
let timerInterval = null
let timeInterval = null
const showTimerSettings = ref(false)
const resumePolicy = ref(true) // true: resume next time; false: reset next time

// 当前时间显示
const currentTime = ref('')

// 专注类白噪音列表（示例数据，实际应从后端获取）
const focusAudios = ref([
  { id: 1, name: '雨声', src: '' },
  { id: 2, name: '咖啡厅', src: '' },
  { id: 3, name: '图书馆', src: '' },
  { id: 4, name: '森林', src: '' }
])

// 格式化计时器时间（正向计时）
const formattedTime = computed(() => {
  const mm = String(Math.floor(elapsedSeconds.value / 60)).padStart(2, '0')
  const ss = String(elapsedSeconds.value % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

// 更新当前时间
function updateCurrentTime() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  currentTime.value = `${hh}:${mm}`
}

function togglePause() {
  if (isTimerRunning.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

function startTimer() {
  isTimerRunning.value = true
  
  timerInterval = setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
}

function pauseTimer() {
  isTimerRunning.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function resetTimer() {
  pauseTimer()
  elapsedSeconds.value = 0
}

function toggleMusic() {
  showMusicSelector.value = !showMusicSelector.value
}

function toggleTimer() {
  showTimerSettings.value = true
}

function closeTimerSettings(){ showTimerSettings.value = false }
function setResumePolicy(val){ resumePolicy.value = !!val }
function saveTimerSettings(){
  // 保存设置到本地
  uni.setStorageSync('studyTimerResumePolicy', { resume: resumePolicy.value })
  showTimerSettings.value = false
  uni.showToast({ title: '保存成功', icon: 'success' })
}

function toggleScreen() {
  // 屏幕设置已删除，功能不再需要
}

function selectAudio(audio) {
  currentAudio.value = audio
  showMusicSelector.value = false
  // 这里应该调用播放器播放音频
  // player.play(audio)
}

onMounted(() => {
  updateCurrentTime()
  // 每秒更新一次当前时间
  timeInterval = setInterval(updateCurrentTime, 1000)
  
  // 恢复上次状态
  const savedState = uni.getStorageSync('studyTimerState')
  const cfg = uni.getStorageSync('studyTimerResumePolicy')
  if(typeof cfg === 'object' && cfg !== null){ resumePolicy.value = !!cfg.resume }
  if (savedState) {
    // 根据用户选择的策略决定是否恢复计时
    if(resumePolicy.value){
      elapsedSeconds.value = savedState.elapsedSeconds || 0
      isTimerRunning.value = savedState.isTimerRunning || false
      if (isTimerRunning.value) {
        startTimer()
      }
    } else {
      // 不恢复计时，只恢复状态为未运行
      elapsedSeconds.value = 0
      isTimerRunning.value = false
    }
  }
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  // 保存状态
  uni.setStorageSync('studyTimerState', {
    elapsedSeconds: elapsedSeconds.value,
    isTimerRunning: isTimerRunning.value
  })
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 学习场景背景 */
.scene-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  overflow: hidden;
}
.scene-bg-img{
  position:absolute;
  left:0; top:0; right:0; bottom:0;
  width:100%; height:100%;
  z-index: 0;
}

.scene-content {
  width: 100%;
  height: 100%;
  /* 可以添加背景图片或更多装饰元素 */
}

/* 主要内容区域 */
.content-wrapper {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* 顶部状态栏 */
.top-status {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.status-time {
  font-size: 14px;
  color: var(--fg);
  font-weight: 500;
}

/* 左下角计时器 */
.timer-display {
  position: absolute;
  bottom: 80px;
  left: 16px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 12px;
}

.timer-text {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}

/* 音乐选择器 */
.music-selector {
  position: absolute;
  top: 60px;
  right: 16px;
  width: 200px;
  max-height: 400px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.music-list {
  max-height: 350px;
}

.music-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 4px;
  cursor: pointer;
}

.music-item.active {
  background: rgba(123, 97, 255, 0.1);
}

.music-name {
  font-size: 14px;
  color: var(--fg);
}

.playing-icon {
  font-size: 12px;
  color: #7B61FF;
}

/* 底部控制栏 */
.bottom-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.control-btn {
  background: transparent;
  border: none;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.control-btn:active {
  background: rgba(0, 0, 0, 0.05);
}

.control-btn .icon {
  font-size: 24px;
  line-height: 1;
  color: #111; /* 统一黑色图标（开始/暂停均为黑色） */
  display: none; /* 隐藏原始文本符号，使用 SVG */
}
.control-btn .icon-svg{ width:44px; height:44px; display:flex; align-items:center; justify-content:center }
.control-btn .icon-svg image{ width:28px; height:28px; display:block }
.control-btn .icon-svg svg{ width:28px; height:28px; display:block }

/* 计时器设置弹窗样式：固定居中，不影响页面高度 */
.timer-settings-overlay{
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.timer-settings{
  width: calc(100vw - 48px);
  max-width: 420px;
  background: rgba(255,255,255,0.98);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.28);
}
.timer-settings .ts-title{ font-size:16px; font-weight:700; margin-bottom:12px; color:#111 }
.timer-settings .ts-option{ display:flex; justify-content:space-between; align-items:center; padding:12px; border-radius:8px; cursor:pointer }
.timer-settings .ts-option:hover{ background: rgba(0,0,0,0.03) }
.timer-settings .ts-label{ color:#222 }
.timer-settings .ts-check{ color:#7B61FF; font-size:18px }
.timer-settings .ts-actions{ display:flex; gap:10px; justify-content:flex-end; margin-top:12px }
.timer-settings .ts-cancel{ background:transparent; border:1px solid rgba(0,0,0,0.06); padding:8px 12px; border-radius:8px }
.timer-settings .ts-save{ background:#111; color:#fff; border:none; padding:8px 12px; border-radius:8px }

/* 响应式调整 */
@media (max-width: 750px) {
  .timer-display {
    bottom: 100px;
    left: 12px;
  }
  
  .timer-text {
    font-size: 20px;
  }
  
  .music-selector {
    width: 180px;
    right: 12px;
  }
}
</style>

