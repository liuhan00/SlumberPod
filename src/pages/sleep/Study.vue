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
          <view v-if="loadingAudios">加载中...</view>
          <view v-else-if="loadAudiosError">获取音频失败：{{ loadAudiosError }}</view>
          <view 
            v-else
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

    <!-- 底部控制栏（固定底部，顺序：音乐 按钮 | 计时器 | 播放/暂停） -->
    <view class="bottom-controls">
      <button class="control-btn" @click="toggleMusic" aria-label="音乐">
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
import * as apiAudios from '@/api/audios'

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
// 全部可选音频（示例），包含 category 字段以便筛选
const allAudios = [
  { id: 1, name: '雨声轻柔', src: '', category: '雨声' },
  { id: 2, name: '雨声深沉', src: '', category: '雨声' },
  { id: 3, name: '咖啡厅雨声', src: '', category: '咖啡' },
  { id: 4, name: '咖啡轻响', src: '', category: '咖啡' },
  { id: 5, name: '图书馆低语', src: '', category: '图书馆' },
  { id: 6, name: '森林鸟鸣', src: '', category: '森林' }
]

const focusAudios = ref(allAudios.slice(0,4)) // 初始显示部分列表
const loadingAudios = ref(false)
const loadAudiosError = ref('')

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

async function loadCoffeeRainAudios(){
  console.log('[Study] loadCoffeeRainAudios start')
  // 先尝试从后端查分类拿到对应的 category_id，再分别请求两类音频
  try{
    const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.123:3003'
    const url = BASE + '/api/categories?limit=1000'
    console.log('[Study] fetch categories url', url)
    let resp
    if(typeof fetch === 'function'){
      const r = await fetch(url)
      resp = await r.json()
      console.log('[Study] fetch categories response', resp)
    } else {
      resp = await new Promise((resolve,reject)=>{
        uni.request({ url, method:'GET', success(res){ console.log('[Study] uni.request categories success', res); resolve(res.data) }, fail(err){ console.warn('[Study] uni.request categories fail', err); reject(err) } })
      })
    }
    const items = Array.isArray(resp) ? resp : (resp.data || resp.items || [])
    // find ids for names '咖啡' 和 '雨声'（后端可能使用不同命名，尝试多种匹配）
    const findIdByName = name => {
      const lower = String(name).toLowerCase()
      const found = items.find(it => String(it.name || '').toLowerCase() === lower || String(it.slug || '').toLowerCase() === lower)
      if(found) return found.id || found.category_id || found._id || found.uuid
      // try includes
      const includes = items.find(it => String(it.name || '').toLowerCase().includes(lower))
      return includes ? (includes.id || includes.category_id || includes._id || includes.uuid) : null
    }
    const rainId = findIdByName('雨声')
    const coffeeId = findIdByName('咖啡')
    console.log('[Study] found category ids', { rainId, coffeeId })

    const results = []
    // 确保 apiAudios 可用（某些构建/运行环境下 import 可能失败）
    let api = typeof apiAudios !== 'undefined' ? apiAudios : null
    if(!api){
      try{ api = (await import('@/api/audios')) }
      catch(e){ console.warn('[Study] dynamic import @/api/audios failed', e) }
    }

    loadingAudios.value = true
    try{
      if(rainId && api && api.getAudios) {
        console.log('[Study] fetching rain audios with id', rainId)
        const r = await api.getAudios({ category_id: rainId, limit: 50 })
        console.log('[Study] rain audios response', r)
        const arr = Array.isArray(r) ? r : (r.data || r.items || [])
        results.push(...arr.map(it=>({ name: it.title || it.name || it.audioName || '', category: '雨声' })))
      }
      if(coffeeId && api && api.getAudios) {
        console.log('[Study] fetching coffee audios with id', coffeeId)
        const r2 = await api.getAudios({ category_id: coffeeId, limit: 50 })
        console.log('[Study] coffee audios response', r2)
        const arr2 = Array.isArray(r2) ? r2 : (r2.data || r2.items || [])
        results.push(...arr2.map(it=>({ name: it.title || it.name || it.audioName || '', category: '咖啡' })))
      }
    }catch(e){
      console.warn('[Study] fetch audios failed', e)
      loadAudiosError.value = String(e.message || e)
    }finally{
      loadingAudios.value = false
    }

    // 如果都没有结果，回退到本地示例数据
    if(results.length === 0) {
      console.log('[Study] no remote results, fallback to local')
      focusAudios.value = allAudios.filter(a => a.category === '咖啡' || a.category === '雨声')
    } else {
      // normalize to shape used by UI
      focusAudios.value = results.map((it, idx) => ({ id: 'r:'+idx, name: it.name, src: '', category: it.category }))
      console.log('[Study] focusAudios set from remote', focusAudios.value)
    }
  }catch(e){
    console.warn('[Study] loadCoffeeRainAudios failed, fallback to local', e)
    focusAudios.value = allAudios.filter(a => a.category === '咖啡' || a.category === '雨声')
  }
}

function toggleMusic() {
  showMusicSelector.value = !showMusicSelector.value
  if (showMusicSelector.value) {
    // 打开时请求后端音频分类（优先获取真实数据）
    loadCoffeeRainAudios()
  }
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
  padding: 56px 12px 0 12px; /* 顶部留出导航/状态高度，左右内边距避免内容贴边 */
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
  bottom: 0; /* 固定在最底端 */
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 1200; /* 提升 z-index 确保在 tabBar 之上 */
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  height: 56px;
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

/* 确保三个底部按钮没有文字标签并垂直居中 */
.control-btn .pillow-label, .control-btn .pillow-text { display: none }
.control-btn { height: 44px; width: 44px; border-radius: 8px }


/* 睡觉按钮样式 - 抱枕风格 */
/* 删除抱枕样式（使用统一底部三个按钮） */
.pillow-btn, .pillow-inner, .pillow-highlight, .pillow-label, .sleep-btn { display: none !important }

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

