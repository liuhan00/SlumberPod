<template>
  <view class="page" :style="bgStyle">
    <view class="header">
      <view class="back-btn" @click="goBack">←</view>
      <text class="title">{{ storyTitle }}</text>
    </view>

    <scroll-view class="content" scroll-y>
      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
      <view v-else class="story-content">
        <text class="story-text">{{ storyContent }}</text>
      </view>
    </scroll-view>

    <!-- player-section only shows when audio is available or playing; clicking it hides the bar -->
    <view class="player-section" v-if="hasAudio && showPlayerBar" @click="togglePlayerBar">
      <view class="player-controls">
        <button class="control-btn" @click.stop="togglePlay">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        <view class="progress-info">
          <text class="time-text">{{ formattedCurrentTime }}/{{ formattedDuration }}</text>
        </view>
        <!-- 音量弹窗按钮 -->
        <button class="control-btn" @click.stop="openVolumeModal">
          音量
        </button>
      </view>

      <!-- 音量/倍速弹窗 -->
      <view v-if="showVolumeModal" class="volume-modal-overlay" @click="closeVolumeModal">
        <view class="volume-modal" @click.stop>
          <view class="vm-header">
            <text>播放器&声幕音量</text>
            <button class="vm-reset" @click="resetVolumes">重置</button>
          </view>

          <scroll-view class="vm-list" style="max-height:260px">
            <view v-for="(track, idx) in audioTracks" :key="track.id" class="vm-item">
              <view class="vm-item-row">
                <text class="vm-name">{{ track.name }}</text>
                <text class="vm-value">{{ Math.round(track.volume * 100) }}%</text>
              </view>
              <slider :value="track.volume * 100" @change="onVolumeChange($event, idx)" show-value disabled-value="false"></slider>
              <view class="vm-speed-row">
                <text>倍速</text>
                <picker mode="selector" :range="speedOptions" :value="track.speedIndex" @change="onSpeedChange($event, idx)">
                  <view class="picker">{{ speedOptions[track.speedIndex] }}x</view>
                </picker>
              </view>
            </view>
          </scroll-view>

          <view class="vm-actions">
            <button class="vm-close" @click="closeVolumeModal">关闭</button>
          </view>
        </view>
      </view>
    </view>

    <!-- floating circular listen button (above player-section) -->
    <button class="floating-play" @click="generateAndPlay">听</button>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { usePlayerStore } from '@/stores/player'
import { getStoryDetail } from '@/api/stories'

const { bgStyle } = useGlobalTheme()
const player = usePlayerStore()

const storyTitle = ref('')
const storyContent = ref('')
const storyId = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const hasAudio = ref(false)
const showPlayerBar = ref(false)
const loading = ref(false)
const audioUrl = ref('')

const showVolumeModal = ref(false)

let audioCtx = null

// 支持的音轨：单音频或组合音频（示例）
const audioTracks = ref([
  // 如果是单音频：只包含一个 track
  { id: 't1', name: '主音轨', volume: 0.5, speedIndex: 1 },
  // 组合时可有更多 track
  { id: 't2', name: '背景音', volume: 0.3, speedIndex: 1 },
  { id: 't3', name: '环绕', volume: 0.25, speedIndex: 1 }
])

const speedOptions = ['0.5', '0.75', '1.0', '1.25', '1.5']

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

async function generateAndPlay() {
  // 当用户点击"听"时立即显示播放器时间线
  showPlayerBar.value = true
  // 重置时间显示
  currentTime.value = 0
  duration.value = 0

  try {
    // 如果已经有音频URL，直接使用
    if (audioUrl.value) {
      audioCtx.src = audioUrl.value
      audioCtx.onCanplay(() => {
        duration.value = Math.floor(audioCtx.duration || 0)
        audioCtx.play()
        isPlaying.value = true
      })
      return
    }
    
    // 如果没有音频URL，显示提示
    uni.showToast({
      title: '该故事暂无音频',
      icon: 'none',
      duration: 2000
    })
    
  } catch (e) {
    console.error('play audio error:', e)
    uni.showToast({ 
      title: '播放失败，请重试', 
      icon: 'none',
      duration: 2000 
    })
  }
}

function togglePlayerBar() {
  showPlayerBar.value = !showPlayerBar.value
}

function openVolumeModal(){
  showVolumeModal.value = true
}
function closeVolumeModal(){
  showVolumeModal.value = false
}

function onVolumeChange(e, idx){
  const val = Number(e.detail.value) / 100
  audioTracks.value[idx].volume = val
  // TODO: 将音量应用到对应音轨的播放器实例
}

function onSpeedChange(e, idx){
  const newIndex = Number(e.detail.value)
  audioTracks.value[idx].speedIndex = newIndex
  const speed = Number(speedOptions[newIndex])
  // TODO: 应用倍速到对应音轨
}

function resetVolumes(){
  audioTracks.value.forEach(t => { t.volume = 0.5; t.speedIndex = 2 })
}

async function loadStoryDetail() {
  if (!storyId.value) return
  
  try {
    loading.value = true
    const storyData = await getStoryDetail(storyId.value)
    
    // 更新故事信息
    storyTitle.value = storyData.title || storyData.name || '睡眠故事'
    storyContent.value = storyData.content || storyData.description || '暂无内容'
    
    // 如果有音频URL，设置为可播放
    if (storyData.audio_url || storyData.audioUrl) {
      audioUrl.value = storyData.audio_url || storyData.audioUrl
      hasAudio.value = true
    }
    
    // 更新页面标题
    uni.setNavigationBarTitle({
      title: storyTitle.value
    })
    
    console.log('[StoryDetail] loaded story:', storyData)
    
  } catch (error) {
    console.error('[StoryDetail] loadStoryDetail error:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
      duration: 2000
    })
    
    // 加载失败时使用默认内容
    storyContent.value = '很抱歉，故事加载失败。请稍后再试。'
  } finally {
    loading.value = false
  }
}

onLoad(async (query) => {
  storyId.value = query.id
  const title = query.title ? decodeURIComponent(query.title) : '睡眠故事'
  storyTitle.value = title
  
  // 初始化音频
  initAudio()
  
  // 加载故事详情
  await loadStoryDetail()
})

function initAudio() {
  audioCtx = uni.createInnerAudioContext()
  audioCtx.obeyMuteSwitch = false
  
  // 如果有音频URL，设置音频源
  if (audioUrl.value) {
    audioCtx.src = audioUrl.value
  }
  
  audioCtx.onTimeUpdate(() => {
    currentTime.value = Math.floor(audioCtx.currentTime)
  })
  
  audioCtx.onCanplay(() => {
    duration.value = Math.floor(audioCtx.duration || 0)
  })
  
  audioCtx.onEnded(() => {
    isPlaying.value = false
  })
  
  audioCtx.onError((err) => {
    console.error('Audio context error:', err)
    uni.showToast({
      title: '音频加载失败',
      icon: 'none',
      duration: 2000
    })
  })
}

function togglePlay() {
  if (!hasAudio.value) return
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.back-btn {
  position: absolute;
  left: 8px;
  top: 8px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  font-size: 16px;
  line-height: 34px;
  color: var(--fg);
  padding: 0;
  box-shadow: none;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
}

.content {
  flex: 1;
  padding: 12px 16px 80px; /* bottom padding to avoid floating button */
  box-sizing: border-box;
}

.story-content {
  width: 100%;
  padding: 14px;
  background: var(--card-bg);
  border-radius: 12px;
  box-sizing: border-box;
  overflow: hidden;
}

.story-text {
  font-size: 16px;
  line-height: 1.8;
  color: var(--fg);
  white-space: pre-wrap;
  word-break: break-word;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  color: var(--muted);
  font-size: 14px;
}

.player-section {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 90px; /* float above bottom controls */
  padding: 12px 16px;
  background: rgba(255,255,255,0.85);
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 720px;
  margin: 0 auto;
  z-index: 20;
  backdrop-filter: blur(6px);
}

.floating-play {
  position: fixed;
  right: 18px;
  bottom: 110px; /* place above player-section */
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: linear-gradient(135deg, #7B61FF, #5A47D1);
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(91, 65, 200, 0.35);
  border: none;
  z-index: 40;
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
.floating-play {
  position: fixed;
  right: 18px;
  bottom: 18px;
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: linear-gradient(135deg, #7B61FF, #5A47D1);
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(91, 65, 200, 0.35);
  border: none;
}


/* 音量弹窗样式 */
.volume-modal-overlay{ position: fixed; left:0; right:0; top:0; bottom:0; background: rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:2000 }
.volume-modal{ width: calc(100vw - 48px); max-width:720px; background: var(--card-bg); border-radius:12px; padding:16px; box-shadow:0 12px 40px rgba(0,0,0,0.28) }
.vm-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px }
.vm-reset{ background:transparent; border:none; color:var(--muted) }
.vm-list{ margin-top:8px }
.vm-item{ padding:10px; border-radius:10px; background: rgba(0,0,0,0.02); margin-bottom:8px }
.vm-item-row{ display:flex; justify-content:space-between; align-items:center; margin-bottom:6px }
.vm-name{ font-size:14px; color:var(--fg) }
.vm-value{ font-size:12px; color:var(--muted) }
.vm-speed-row{ display:flex; align-items:center; gap:8px; margin-top:8px }
.vm-actions{ display:flex; justify-content:center; margin-top:12px }
.vm-close{ padding:8px 12px; border-radius:8px; background:#111; color:#fff; border:none }

</style>

















