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

    <!-- player-section only shows when audio is available or playing; clicking it hides the bar -->
    <view class="player-section" v-if="hasAudio && showPlayerBar" @click="togglePlayerBar">
      <view class="player-controls">
        <button class="control-btn" @click.stop="togglePlay">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        <view class="progress-info">
          <text class="time-text">{{ formattedCurrentTime }}/{{ formattedDuration }}</text>
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

async function generateAndPlay() {
  // 当用户点击“听”时立即显示播放器时间线
  hasAudio.value = true
  showPlayerBar.value = true
  // 重置时间显示
  currentTime.value = 0
  duration.value = 0

  // 调用 AI TTS 接口生成音频 URL（示例）
  const apiKey = '<<YOUR_AI_TTS_API_KEY>>' // 假设用户会替换
  const text = storyContent.value
  try {
    // 这是示例请求：请替换为实际可用的 TTS 服务
    const res = await uni.request({
      url: 'https://api.example-tts.com/v1/tts',
      method: 'POST',
      header: { 'Authorization': `Bearer ${apiKey}` },
      data: { text },
      dataType: 'json'
    })
    const audioUrl = res[1].data?.audioUrl || ''
    if (audioUrl) {
      audioCtx.src = audioUrl
      // wait for canplay (duration set)
      audioCtx.onCanplay(() => {
        audioCtx.play()
        isPlaying.value = true
      })
    } else {
      throw new Error('no audioUrl')
    }
  } catch (e) {
    console.error('TTS error:', e)
    uni.showToast({ title: '调用 TTS 失败，使用测试音频', icon: 'none' })
    // 回退到公开测试音频（便于本地调试）
    try {
      const fallback = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
      audioCtx.src = fallback
      audioCtx.onCanplay(() => {
        audioCtx.play()
        isPlaying.value = true
      })
    } catch (err) {
      console.error('fallback failed', err)
      uni.showToast({ title: '无法播放音频', icon: 'none' })
    }
  }
}

function togglePlayerBar() {
  showPlayerBar.value = !showPlayerBar.value
}

onLoad((query) => {
  storyId.value = query.id
  storyTitle.value = query.title ? decodeURIComponent(query.title) : '睡眠故事'
  
  // TODO: 从后端加载故事内容
  // 示例：写入完整睡眠故事文本
  storyContent.value = `很久很久以前，在一片静谧的森林里，住着一只小狐狸。夜幕降临时，森林的树叶轻轻摇曳，星光像银色的琴弦挂在天上。

小狐狸最喜欢坐在一棵老橡树下，听风讲述远方的故事。一天晚上，它听见风里带来一个低低的声音：这是森林深处的一把古老的铃铛，只有心灵柔软的生灵才能听见它的歌声。

小狐狸好奇地循着声音走去，发现了一条幽静的小径，路旁开满了荧光草，微弱的光点指引着它前行。小径的尽头有一座被苔藓覆盖的小屋，屋门半掩，里面传来轻柔的歌声。

屋里住着一位年迈的织梦匠，他的双手能把夜色编成温柔的毯子，给世间的疲惫带去安慰。织梦匠请小狐狸坐下，递给它一杯温热的草药茶，并讲起很久以前的故事。

他说：每当有人在心里心事重重、难以入眠时，就会有一缕梦的线索飘向这片森林。我用这些线索编织梦境，把它们轻轻放回到人们的心里，让他们在梦中找到安宁。

小狐狸听着，眼皮渐渐沉重。织梦匠取出一把小小的铃铛，轻轻摇晃，铃声像星光一样碎成温柔的光点，飘入小狐狸的耳朵。那一刻，小狐狸仿佛看见自己在云朵上慢慢飘过，听见远处河水低声唱着摇篮曲。

当小狐狸醒来时，已经是清晨，薄雾还在林间飘荡。它带着织梦匠的祝福回到自己的窝里，躺在柔软的苔藓上，闭上眼睛，轻轻呼吸。每当夜晚来临，它就会想起那把铃铛和织梦匠，心里充满温暖与安宁。

亲爱的朋友，如果你也有难以入睡的夜晚，想象着小狐狸被星光包裹、被梦的毯子轻轻拥抱，让温柔的呼吸带你走进甜美的梦乡。晚安，好梦。`
  
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
  border: none;
  border-radius: 6px;
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

</style>

















