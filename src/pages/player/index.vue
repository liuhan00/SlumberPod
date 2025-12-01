<template>
  <view class="page" :style="bgStyle" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
    <!-- Top small bar -->
    <view class="topbar">
      <button class="collapse" @click="uni.navigateBack()">˅</button>
      <button class="share" @click="shareToCommunity">⤴</button>
      <!-- hit area fallback: 防止顶部系统遮挡或元素被覆盖时无响应，额外放置高优先级透明捕获层 -->
      <button class="share-hit" @click.stop.prevent="shareToCommunity" aria-hidden="true"></button>
    </view>

    <!-- Vinyl turntable visual -->
    <view class="timer-wrap">
      <view class="vinyl">
        <view class="vinyl-shadow"></view>
        <view class="disk" :class="{ spinning: store.isPlaying }">
          <view class="grooves"></view>
          <view class="label"><text>♪</text></view>
        </view>
        <view class="tonearm" :class="{ on: store.isPlaying }">
          <view class="pivot"></view>
          <view class="arm"></view>
          <view class="head"></view>
        </view>
      </view>
    </view>

    <!-- meta area -->
    <view class="meta">
      <view class="title-row">
        <text class="fixed-label text-contrast">白噪音</text>
        <view class="meta-actions">
          <view class="favorite-wrapper">
            <button class="favorite-btn" :class="{ active: isFav }" @click="toggleFav">
              <view class="badge-anchor">
                <text class="heart-text">{{ isFav ? '❤️' : '♡' }}</text>
                <text class="favorite-badge">{{ formattedFavoriteCount }}</text>
              </view>
            </button>
          </view>
          

        </view>
      </view>
      <text class="author text-contrast">{{ displayNames }}</text>
      <!-- 音频时长显示 -->
      <view class="time-display">
        <text class="time-text">{{ formattedCurrentTime }}/{{ formattedDuration }}</text>
      </view>
    </view>

    <!-- small tags -->
    <view class="tags">
      <button class="tag" @click.stop="openVolumeModal">音量</button>
      <text class="tag">标注</text>
    </view>

    <!-- 音量/倍速弹窗（播放详情页） -->
    <view v-if="showVolumeModal" class="volume-modal-overlay" data-debug="v2" @click="closeVolumeModal">
      <view class="volume-modal" data-debug="v2" @click.stop>
        <view class="vm-header">
          <text class="vm-title">播放器 & 声幕音量</text>
          <button class="vm-reset" @click="resetVolumes">重置</button>
        </view>

        <scroll-view class="vm-list" :style="{ height: listHeight + 'px' }" scroll-y>

          <view v-for="(track, idx) in audioTracks" :key="track.id" class="vm-item compact">
            <view class="vm-row">
              <button :class="['vm-name', { disabled: !track.enabled }]" @click="toggleTrackEnabled(idx)">{{ track.name }}</button>
              <view class="vm-right">
                <text class="vm-percent">{{ Math.round(track.volume * 100) }}%</text>
              </view>
            </view>

            <view class="vm-row slider-row">
              <slider class="vm-slider" :value="track.volume * 100" @change="onVolumeChange($event, idx)" activeColor="#7bd38a" backgroundColor="#eef4fb"></slider>
              <view class="vm-actions-inline mini">
                <button class="small-btn" @click="onVolumeChange({ detail: { value: Math.max(0, Math.round((track.volume*100)-5)) } }, idx)">-</button>
                <button class="small-btn" @click="onVolumeChange({ detail: { value: Math.min(100, Math.round((track.volume*100)+5)) } }, idx)">+</button>
              </view>
            </view>
          </view>

          <view class="vm-divider"></view>

          <view class="vm-subtitle">倍速</view>
          <view v-for="(track, idx) in audioTracks" :key="track.id + '-speed'" class="vm-item compact speed-block">
            <view class="vm-row">
              <button :class="['vm-name', { disabled: !track.enabled }]" @click="toggleTrackEnabled(idx)">{{ track.name }}</button>
              <view class="vm-right">
                <text class="vm-percent">{{ speedOptions[track.speedIndex] }}x</text>
              </view>
            </view>
            <view class="vm-row speed-row">
              <view class="vm-actions-inline mini">
                <button class="small-btn" @click="(function(){ const ni = Math.max(0, track.speedIndex-1); onSpeedChange({ detail: { value: ni } }, idx) })()">-</button>
                <button class="small-btn" @click="(function(){ const ni = Math.min(speedOptions.length-1, track.speedIndex+1); onSpeedChange({ detail: { value: ni } }, idx) })()">+</button>
              </view>
            </view>
          </view>
        </scroll-view>

      </view>
    </view>

    <!-- controls -->
    <view class="controls">
      <button class="ctrl settings-btn" @click="openSettings">⚙</button>
      <button class="ctrl" @click="prev">◀◀</button>
      <button class="play-btn" @click="toggle">
        <view class="icon-svg">
          <image src="/static/icons/pause.svg" v-if="store.isPlaying" mode="aspectFit" />
          <image src="/static/icons/play.svg" v-else mode="aspectFit" />
        </view>
      </button>
      <button class="ctrl" @click="next">▶▶</button>
      <button class="ctrl playlist-btn" @click="showPlaylist" style="pointer-events: auto;">≡</button>
    </view>

    <!-- 播放列表弹窗 -->
    <view class="playlist-modal" v-if="showPlaylistModal" @click="hidePlaylist">
      <view class="playlist-content" @click.stop>
        <view class="playlist-header">
          <text class="playlist-title">播放列表</text>
          <button class="playlist-close" @click="hidePlaylist">×</button>
        </view>
        
        <scroll-view class="playlist-scroll" scroll-y>
          <view class="playlist-list">
            <view 
              v-for="track in store.playlist" 
              :key="track.id" 
              :class="['playlist-item', { active: track.id === store.currentTrack?.id }]"
              @click="playTrack(track)"
            >
              <image class="playlist-cover" :src="track.cover" mode="aspectFill" />
              <view class="playlist-info">
                <text class="playlist-name">{{ track.name }}</text>
                <text class="playlist-author">{{ track.author }}</text>
              </view>
              <view class="playlist-actions">
                <button class="playlist-action-btn" @click.stop="removeFromPlaylist(track.id)">×</button>
              </view>
            </view>
            
            <view v-if="store.playlist.length === 0" class="playlist-empty">
              <text class="empty-icon">🎵</text>
              <text class="empty-text">播放列表为空</text>
              <button class="empty-btn" @click="goToHome">去首页添加</button>
            </view>
          </view>
        </scroll-view>
        
        <view class="playlist-footer">
          <text class="playlist-count">共 {{ store.playlist.length }} 首</text>
          <button class="playlist-clear" @click="clearPlaylist">清空列表</button>
        </view>
      </view>
    </view>

    <!-- 播放设置半屏弹窗 -->
    <view class="settings-overlay" v-if="showSettingsModal" @click="closeSettings">
      <view class="settings-content" @click.stop>
        <view class="settings-header">
          <text class="settings-title">播放设置</text>
          <button class="settings-close" @click="closeSettings">×</button>
        </view>
        
        <!-- 音量调节 -->
        <view class="settings-section">
          <text class="section-title">音量</text>
          <slider 
            class="volume-slider"
            :value="store.volume * 100" 
            min="0" 
            max="100" 
            step="1"
            @change="onVolumeChange"
            activeColor="#7B61FF"
            backgroundColor="rgba(255,255,255,0.1)"
          />
          <text class="volume-value">{{ Math.round(store.volume * 100) }}%</text>
        </view>
        
        <!-- Play Mode Options -->
        <view class="settings-section">
          <text class="section-title">播放模式</text>
          <view class="mode-options">
            <view class="mode-option" :class="{ active: store.loopMode === 'one' }" @click="setLoopMode('one')">
              <text class="mode-icon">①</text>
              <text class="mode-label">单曲循环</text>
            </view>
            <view class="mode-option" :class="{ active: store.loopMode === 'all' }" @click="setLoopMode('all')">
              <text class="mode-icon">🔁</text>
              <text class="mode-label">列表循环</text>
            </view>
            <view class="mode-option" :class="{ active: store.loopMode === 'off' }" @click="setLoopMode('off')">
              <text class="mode-icon">→</text>
              <text class="mode-label">单曲一次</text>
            </view>
          </view>
        </view>
        
        <!-- Timer Options -->
        <view class="settings-section">
          <text class="section-title">定时关闭</text>
          <view class="timer-options">
            <view class="timer-option" :class="{ active: timerMinutes === 0 }" @click="setTimer(0)">
              <text class="timer-label">关闭</text>
            </view>
            <view class="timer-option" :class="{ active: timerMinutes === 15 }" @click="setTimer(15)">
              <text class="timer-label">15分钟</text>
            </view>
            <view class="timer-option" :class="{ active: timerMinutes === 30 }" @click="setTimer(30)">
              <text class="timer-label">30分钟</text>
            </view>
            <view class="timer-option" :class="{ active: timerMinutes === 45 }" @click="setTimer(45)">
              <text class="timer-label">45分钟</text>
            </view>
            <view class="timer-option" :class="{ active: timerMinutes === 60 }" @click="setTimer(60)">
              <text class="timer-label">60分钟</text>
            </view>
            <view class="timer-option" :class="{ active: timerMinutes === 90 }" @click="setTimer(90)">
              <text class="timer-label">90分钟</text>
            </view>
          </view>
          
          <!-- Custom Timer -->
          <view class="custom-timer">
            <text class="custom-label">自定义时间</text>
            <view class="custom-input-group">
              <input 
                class="custom-input" 
                type="number" 
                v-model="customTimerMinutes" 
                placeholder="分钟" 
                min="1" 
                max="120"
              />
              <button class="custom-confirm" @click="setCustomTimer">确定</button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>

    <!-- Meta Popup -->
    <view class="modal-overlay" v-if="showMeta" @click="closeMeta">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">音频信息</text>
          <button class="modal-close" @click="closeMeta">×</button>
        </view>
        <view v-if="metaLoading">
          <text>加载中...</text>
        </view>
        <view v-else>
          <view v-if="metaMulti && metaMulti.length > 1" class="meta-grid">
            <view v-for="(m, i) in metaMulti" :key="i" class="meta-card">
              <view class="meta-title-row">
                <text class="meta-title">{{ m?.title || m?.name || '-' }}</text>
                <text class="meta-duration">{{ fmtSeconds(m?.duration_seconds ?? m?.durationSeconds) }}</text>
              </view>
              <view class="meta-chips">
                <view class="meta-chip"><text class="chip-icon">▶</text><text class="chip-text">{{ m?.play_count ?? m?.playCount ?? 0 }}</text></view>
                <view class="meta-chip"><text class="chip-icon">❤</text><text class="chip-text">{{ m?.favorite_count ?? m?.favoriteCount ?? 0 }}</text></view>
                <view class="meta-chip"><text class="chip-icon">💬</text><text class="chip-text">{{ m?.comment_count ?? m?.commentCount ?? 0 }}</text></view>
              </view>
            </view>
          </view>
          <view v-else class="meta-grid">
            <view class="meta-card">
              <view class="meta-title-row">
                <text class="meta-title">{{ metaData?.title || metaData?.name || '-' }}</text>
                <text class="meta-duration">{{ fmtSeconds(metaData?.duration_seconds ?? metaData?.durationSeconds) }}</text>
              </view>
              <view class="meta-chips">
                <view class="meta-chip"><text class="chip-icon">▶</text><text class="chip-text">{{ metaData?.play_count ?? metaData?.playCount ?? 0 }}</text></view>
                <view class="meta-chip"><text class="chip-icon">❤</text><text class="chip-text">{{ metaData?.favorite_count ?? metaData?.favoriteCount ?? 0 }}</text></view>
                <view class="meta-chip"><text class="chip-icon">💬</text><text class="chip-text">{{ metaData?.comment_count ?? metaData?.commentCount ?? 0 }}</text></view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

</template>
<script setup>
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { computed, watch, ref, onMounted } from 'vue'
import PlayerControls from '@/components/PlayerControls.vue'
import { usePlayerStore } from '@/stores/player'
import { useHistoryStore } from '@/stores/history'
import { useFavoritesStore } from '@/stores/favorites'
import { allNoises } from '@/data/noises'
import { getAuthLocal } from '@/store/auth'
import { useGlobalTheme } from '@/composables/useGlobalTheme'

const { bgStyle } = useGlobalTheme()
const store = usePlayerStore()
const historyStore = useHistoryStore()
const favStore = useFavoritesStore(); favStore.load()
historyStore.load()
const track = computed(()=> store.currentTrack)
const isFav = computed(()=>{
  if(!track.value) return false
  const metaId = track.value?.metaId
  const numericMeta = metaId != null && /^\d+$/.test(String(metaId)) ? Number(metaId) : null
  if(numericMeta === null) return false
  return favStore.items.some(x=> x.id === numericMeta)
})

async function toggleFav(){ 
  if(!track.value) return; 
  
  // 检查用户是否登录（兼容多种本地存储结构）
  const auth = getAuthLocal()
  console.log('[Auth] toggleFav auth value:', auth)
  const loggedIn = Boolean(
    // 游客登录有 guest: true，需要排除
    !auth?.guest &&
    !auth?.user?.guest &&
    (
      auth?.id ||
      auth?.user?.id ||
      auth?.userId ||
      auth?.user?.userId ||
      auth?.token ||
      auth?.access_token
    )
  )
  if(!loggedIn){
    uni.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 2000
    })
    // 跳转到登录页面
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/auth/Login'
      })
    }, 1500)
    return
  }
  
  // 仅允许使用后端真实ID metaId
  const metaId = track.value?.metaId
  const isNumericMeta = metaId != null && /^\d+$/.test(String(metaId))
  if(!isNumericMeta){
    uni.showToast({ title: '该音频暂不支持收藏', icon: 'none', duration: 1800 })
    return
  }

  const wasFav = isFav.value
  // 单曲收藏：直接切换收藏与计数；组合(≥3)才弹出命名
  if(!wasFav){
    const isCombo = Array.isArray(store.playlist) && store.playlist.length >= 3
    if(!isCombo){
      try{
        await favStore.toggle(track.value)
        updateFavoriteCount(+1)
        uni.showToast({ title:'已收藏', icon:'success', duration:800 })
      }catch(e){ uni.showToast({ title:'收藏失败', icon:'none' }) }
      return
    }
  }
  
  // 如果是收藏，弹出命名输入框
  if (!wasFav) {
    uni.showModal({
      title: '收藏组合',
      editable: true,
      placeholderText: '请输入组合名称（1-12字）',
      success: async (res) => {
        if (res.confirm) {
          const combName = res.content?.trim() || '白噪音组合'
          if (combName.length > 12) {
            uni.showToast({ title: '名称不能超过12字', icon: 'none' })
            return
          }
  try {
    await favStore.toggle(track.value)
            // TODO: 保存组合名称到后端
    uni.showToast({
              title: '组合收藏成功',
      icon: 'success',
      duration: 1000
    })
            // 更新收藏数量
            updateFavoriteCount()
  } catch (error) {
    console.error('收藏操作失败:', error)
    uni.showToast({
      title: '操作失败，请重试',
      icon: 'none',
      duration: 2000
    })
          }
        }
      }
    })
  } else {
    // 取消收藏
    try {
      await favStore.toggle(track.value)
      updateFavoriteCount(-1)
      uni.showToast({ title:'已取消收藏', icon:'success', duration:800 })
    } catch (error) {
      console.error('收藏操作失败:', error)
      uni.showToast({
        title: '操作失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  }
}

// 更新收藏数量
function updateFavoriteCount(delta = 0) {
  // 优先用后端元数据；若没有则在前端做微调，给用户即时反馈
  const current = Number(liveFavoriteCount.value) || 0
  const next = Math.max(0, current + Number(delta))
  // 仅当后端未返回有效计数时，使用本地计数缓存
  if(Number.isNaN(metaData.value?.favorite_count) && Number.isNaN(track.value?.favorite_count)){
    favoriteCount.value = next
  }
}

// three selected noises (for triangle corners)
const threeTracks = ref([null,null,null]) // will be filled on mounted; fallback to data if API fails
// display label and joined names for bottom line
const playlistTitleOverride = ref('')
const displayNames = computed(()=>{
  // if override present (from Free.vue via query) use it
  if(playlistTitleOverride.value) return playlistTitleOverride.value
  // otherwise use threeTracks or store.currentTrack
  const byThree = threeTracks.value.map(n=> n?.name || n?.title || '').filter(Boolean)
  if(byThree.length) return byThree.join(' | ')
  if(store.currentTrack) return store.currentTrack.name || store.currentTrack.title || ''
  return ''
})

function getNoiseIcon(n){ if(!n) return '♪'; return getNoiseIconFromName(n.name) }
function getNoiseIconFromName(name){ const map = { '海浪':'🌊','雨声':'🌧️','壁炉':'🔥','树林':'🌲','地铁':'🚇' }; return map[name] || '🎵' }

// positions for triangle corner icons (absolute px)
const threePositions = ref([{left:0,top:0},{left:0,top:0},{left:0,top:0}])
function updateTriPositions(){
  const svgRect = svgRef.value?.getBoundingClientRect?.() || null
  if(!svgRect) return

  // compute center and scale based on SVG (300x300 viewBox)
  const scale = svgRect.width / 300
  const cx = svgRect.left + (150 * scale)
  const cy = svgRect.top + (150 * scale)
  // place icons evenly around outer ring, slightly outside radius
  const outerRadius = 110 * scale
  const offsetOut = 36 * scale // distance beyond ring to place icons
  const r = outerRadius + offsetOut
  // angles for three icons: top (-90deg), bottom-left (150deg), bottom-right (30deg)
  const angles = [-90, 150, 30]
  threePositions.value = angles.map(a=>{
    const rad = a * Math.PI / 180
    const x = cx + r * Math.cos(rad)
    const y = cy + r * Math.sin(rad)
    return { left: x + 'px', top: y + 'px' }
  })
}
function triStyle(idx){ const p = threePositions.value[idx] || {left:'0px', top:'0px'}; return { left: p.left, top: p.top, transform: 'translate(-50%,-50%)' } }



// keep only triangle decoration state
const svgRef = ref(null)
const canvasRef = ref(null)

const ringLabels = [ { angle:-90, text:'∞' }, { angle:-30, text:'120' }, { angle:30, text:'90' }, { angle:90, text:'60' }, { angle:150, text:'30' }, { angle:210, text:'0' } ]

// minimal runtime flags
const draggingRef = ref(false)

// Settings modal
const showSettingsModal = ref(false)
const timerMinutes = ref(0)
const customTimerMinutes = ref('')

// 音量弹窗（播放详情）
const showVolumeModal = ref(false)
// audioTracks: each track controls an individual source in the "声幕" mix
// fields: id, name, volume (0-1), enabled (bool), speedIndex
const listHeight = ref(260)

const audioTracks = ref([
  { id: 't1', name: store.currentTrack?.name || store.currentTrack?.title || store.currentTrack?.audioName || '主音轨', volume: store.volume || 0.5, enabled: true, speedIndex: 2 },
  { id: 't2', name: store.playlist[1]?.name || store.playlist[1]?.title || store.playlist[1]?.audioName || store.playlist[1]?.audio_name || '音轨2', volume: 0.8, enabled: true, speedIndex: 2 },
  { id: 't3', name: store.playlist[2]?.name || store.playlist[2]?.title || store.playlist[2]?.audioName || store.playlist[2]?.audio_name || '音轨3', volume: 0.8, enabled: true, speedIndex: 2 }
])
const speedOptions = ['0.5','0.75','1.0','1.25','1.5']

// toggle a track on/off (enabled -> playing); when disabled we set volume to 0 visually
function toggleTrackEnabled(idx){
  const t = audioTracks.value[idx]
  console.log('[player] toggleTrackEnabled', idx, t)
  if(!t) return
  const next = !t.enabled
  t.enabled = next
  console.log('[player] track enabled state ->', t.enabled)
  // map to actual audio context if exists
  try{ setTrackEnabled(idx, next) }catch(e){ console.warn('toggleTrackEnabled -> setTrackEnabled failed', e) }
  // if single track, also sync store volume
  if(audioTracks.value.length === 1){ setVolume(t.enabled ? (t.volume || 0.5) : 0) }
}

// meta popup state
const showMeta = ref(false)
const metaData = ref(null)
const metaMulti = ref([])
const metaLoading = ref(false)

const favoriteCount = ref(0)
const liveFavoriteCount = computed(()=>{
  const meta = metaData.value
  const metaFav = meta?.favorite_count ?? meta?.favoriteCount
  if(typeof metaFav === 'number' && !Number.isNaN(metaFav)) return metaFav

  const trackFav = track.value?.favorite_count ?? track.value?.favoriteCount
  if(typeof trackFav === 'number' && !Number.isNaN(trackFav)) return trackFav

  return favoriteCount.value || 0
})
const formattedFavoriteCount = computed(()=> formatFavoriteCount(liveFavoriteCount.value))

function formatFavoriteCount(count){
  if(!count || Number.isNaN(count)) return '0'
  if(count >= 10000){
    const wan = Math.floor(count / 10000)
    return `${wan}w+`
  }
  return String(count)
}

// 下滑返回相关
const touchStartY = ref(0)
const touchMoveY = ref(0)
const isDragging = ref(false)
// timer state refs (fix ReferenceError: knobAngle is not defined)
const knobAngle = ref(0)
const durationMinutes = ref(30)
const remainingSeconds = ref(durationMinutes.value * 60)
const timerPercent = computed(()=> (durationMinutes.value % 120) / 120)
const showTime = ref(false)

function handleTouchStart(e) {
  touchStartY.value = e.touches[0].clientY
  isDragging.value = true
}

function handleTouchMove(e) {
  if (!isDragging.value) return
  
  touchMoveY.value = e.touches[0].clientY
  const deltaY = touchMoveY.value - touchStartY.value
  
  // 如果向下滑动超过50px，触发返回
  if (deltaY > 50) {
    uni.navigateBack()
    isDragging.value = false
  }
}

function handleTouchEnd() {
  isDragging.value = false
}

// Playlist modal
const showPlaylistModal = ref(false)

// Get loop mode icon
// Set loop mode
function setLoopMode(mode) {
  store.setLoopMode(mode)
}

function openSettings() {
  showSettingsModal.value = true
}

function closeSettings() {
  showSettingsModal.value = false
}

function openVolumeModal(){
  console.log('[player] openVolumeModal called, store.playlist.length=', Array.isArray(store.playlist)?store.playlist.length:0, 'currentTrack=', store.currentTrack)
  
  // 优先使用当前已加载的 audioTracks（如果已经有数据）
  if(audioTracks.value && audioTracks.value.length > 0 && audioTracks.value[0].name !== '主音轨'){
    console.log('[player] using existing audioTracks', audioTracks.value)
    showVolumeModal.value = true
    return
  }
  
  // 构造音轨列表：若当前播放为组合，使用 store.playlist，否则单项
  let playlist = store.playlist && store.playlist.length > 1 ? store.playlist : [store.currentTrack].filter(Boolean)
  // 如果 store 数据为空（dev/初始化问题），回退到内置 sample 列表，避免弹窗空内容
  if(!playlist || playlist.length === 0){
    console.warn('[player] playlist and currentTrack empty — falling back to sample noises')
    playlist = allNoises.slice(0,3).map((n,i)=> ({ id: n.id || `sample${i}`, name: n.name || n.title || `示例 ${i+1}`, volume: 0.8 }))
  }
  // 获取真实音频名称：优先使用 name，其次 title，再次 audioName，最后才用默认值
  audioTracks.value = playlist.map((t, i)=> ({ 
    id: t?.id || `t${i}`, 
    name: t?.name || t?.title || t?.audioName || t?.audio_name || `音轨 ${i+1}`, 
    icon: '', 
    volume: (typeof t?.volume === 'number' ? t.volume : (store.volume ?? 0.5)), 
    enabled: true, 
    speedIndex: 2 
  }))
  console.log('[player] audioTracks constructed', audioTracks.value)
  showVolumeModal.value = true
}
function closeVolumeModal(){ showVolumeModal.value = false }

function onVolumeChange(e, idx){
  const val = Number(e.detail.value) / 100
  audioTracks.value[idx].volume = val
  // set volume on audioCtx if exists
  try{ const ctx = audioCtxs[idx]; if(ctx){ ctx.volume = val } }catch(e){ console.warn('set volume on ctx failed', e) }
  // 如果是单音频，直接调整主 player 音量
  if(audioTracks.value.length === 1){ setVolume(val) }
}

function onSpeedChange(e, idx){
  const newIndex = Number(e.detail.value)
  audioTracks.value[idx].speedIndex = newIndex
  const speed = Number(speedOptions[newIndex])
  // 如果单音轨，尝试设置 audioCtx.playbackRate（部分小程序平台不支持）
  if(audioTracks.value.length === 1 && audioCtx){
    try{ audioCtx.playbackRate = speed }catch(e){ console.warn('playbackRate not supported', e) }
  }
}

function resetVolumes(){
  audioTracks.value.forEach((t, i)=>{ t.volume = i===0 ? (store.volume || 0.5) : 0.8; t.speedIndex = 2; t.enabled = true; try{ const ctx = audioCtxs[i]; if(ctx){ ctx.volume = t.volume; if(!ctx.src){} } }catch(e){} })
}

// 将 store.volume 同步到 audioTracks（如果只存在单音轨）
watch(()=>store.volume, v => { if(audioTracks.value.length===1){ audioTracks.value[0].volume = v } })

// 监听 store.playlist 和 store.currentTrack 的变化，自动更新 audioTracks
watch([()=>store.playlist, ()=>store.currentTrack], ([newPlaylist, newTrack]) => {
  console.log('[player] store changed, updating audioTracks', { playlist: newPlaylist, currentTrack: newTrack })
  
  // 构造新的音轨列表
  let tracks = []
  if(Array.isArray(newPlaylist) && newPlaylist.length > 0){
    tracks = newPlaylist.slice(0, 3)
  } else if(newTrack){
    tracks = [newTrack]
  }
  
  // 如果有有效数据，更新 audioTracks
  if(tracks.length > 0){
    audioTracks.value = tracks.map((t, i) => ({
      id: t?.id || `t${i}`,
      name: t?.name || t?.title || t?.audioName || t?.audio_name || `音轨 ${i+1}`,
      icon: '',
      volume: (typeof t?.volume === 'number' ? t.volume : (store.volume ?? 0.5)),
      enabled: true,
      speedIndex: 2
    }))
    console.log('[player] audioTracks updated from store', audioTracks.value)
  }
}, { deep: true })

function onVolumeChangeSetting(e){
  const volume = e.detail.value / 100
  setVolume(volume)
}

// 格式化时间
const formattedCurrentTime = computed(() => {
  const seconds = Math.floor(store.positionMs / 1000)
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

const formattedDuration = computed(() => {
  const seconds = Math.floor(store.durationMs / 1000)
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

// 分享功能
function shareAudio() {
  const track = store.currentTrack
  if (!track) {
    uni.showToast({ title: '暂无播放内容', icon: 'none' })
    return
  }
  
  // 微信小程序分享
  if (typeof wx !== 'undefined' && wx.showShareMenu) {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }
  
  // 触发分享
  uni.showShareMenu({
    withShareTicket: true,
    success: () => {
      console.log('分享菜单显示成功')
    }
  })
}

// 分享到社区页跳转
function shareToCommunity(){
  let t = store.currentTrack
  console.log('[shareToCommunity] clicked, track:', t)
  // 如果没有正在播放的 track，尝试用播放列表的第一个项作为候选
  if(!t || Object.keys(t).length===0){
    const fallback = (Array.isArray(store.playlist) && store.playlist.length>0) ? store.playlist[0] : null
    if(fallback){
      console.log('[shareToCommunity] no currentTrack, using playlist[0] as fallback', fallback)
      t = fallback
    }
  }
  // 如果仍然没有任何候选，允许用户进入分享页并手动选择/填写（空字段）
  if(!t){
    console.log('[shareToCommunity] no track available, opening share page with empty params')
    try{ uni.showToast({ title: '打开分享页面', icon: 'none', duration: 600 }) }catch(e){}
    uni.navigateTo({ url: '/pages/player/share' })
    return
  }

  // quickly provide visual feedback to ensure click works during debugging
  try{ uni.showToast({ title: '正在跳转...', icon: 'none', duration: 700 }) }catch(e){}
  const params = [
    `audioId=${encodeURIComponent(t.id||'')}`,
    `title=${encodeURIComponent(t.name||t.title||'')}`,
    `subtitle=${encodeURIComponent(t.author||t.subtitle||'')}`,
    `cover=${encodeURIComponent(t.cover||'')}`
  ].join('&')
  console.log('[shareToCommunity] navigating to /pages/player/share?', params)
  uni.navigateTo({ url: `/pages/player/share?${params}` })
}

// 分享给好友
function onShareAppMessage() {
  const track = store.currentTrack
  const title = track ? `推荐 ${track.name} 白噪音` : '推荐白噪音组合'
  const path = `/pages/player/index?id=${track?.id || ''}`
  
  return {
    title,
    path,
    imageUrl: track?.cover || ''
  }
}

// 分享到朋友圈
function onShareTimeline() {
  const track = store.currentTrack
  return {
    title: '星眠坞助眠白噪音，一起来听～',
    query: `id=${track?.id || ''}`
  }
}

// Set timer
function setTimer(minutes) {
  timerMinutes.value = minutes
  if (minutes === 0) {
    cancelTimer()
  } else {
    durationMinutes.value = minutes
    remainingSeconds.value = minutes * 60
    knobAngle.value = (minutes / 120) * 360
    startTimer()
  }
  closeSettings()
}

// Set custom timer
function setCustomTimer() {
  const minutes = parseInt(customTimerMinutes.value)
  if (minutes && minutes >= 1 && minutes <= 120) {
    setTimer(minutes)
    customTimerMinutes.value = ''
  }
}

async function openMetaPopup(id){
  showMeta.value = true; metaLoading.value = true; metaData.value = null; metaMulti.value = []
  const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.123:3003'
  // 构建ID列表：优先参数id；否则从当前播放或混合列表取 metaId/id（最多3个）
  let ids = []
  if(id){ ids = [id] }
  else {
    // 仅使用后端提供的 metaId，避免用本地/临时 id 造成 404
    if(store.currentTrack?.metaId){ ids.push(store.currentTrack.metaId) }
    if((playlistTitleOverride.value && playlistTitleOverride.value.includes('|')) || (store.playlist?.length > 1)){
      const extra = (store.playlist||[]).map(t=> t.metaId).filter(Boolean)
      const seen = new Set(ids.map(x=> String(x)))
      for(const x of extra){ const sx = String(x); if(!seen.has(sx)){ ids.push(x); seen.add(sx) } if(ids.length>=3) break }
    }
  }
  // 仅保留纯数字的有效后端 ID
  ids = ids.filter(x=> { const s = String(x); return /^[0-9]+$/.test(s) && s.length <= 10 })
  if(ids.length===0){ metaLoading.value=false; metaData.value={ _error: '无有效音频ID' }; return }
  
  const urls = ids.map(x=> `${BASE}/api/audios/${x}`)
  console.log('[openMetaPopup] fetching meta urls', urls)
  try{
    // try fetch first (browser/node). In some miniapp runtimes fetch may be unavailable or blocked — fallback to uni.request below.
    if (typeof fetch === 'function'){
      const results = await Promise.all(urls.map(u=> fetch(u, { method:'GET' }).then(async res=>{ if(!res.ok) throw new Error(`HTTP ${res.status}`); try{ const j = await res.json(); return (j && (j.data||j)) ? (j.data||j) : j } catch(e){ const txt = await res.text(); try{ const j = JSON.parse(txt); return (j && (j.data||j)) ? (j.data||j) : j } catch(_){ return { _raw: txt } } } }).catch(err=>({ _error:String(err), _url:u }))))
      metaMulti.value = results
      metaData.value = results[0] || null
      console.log('[openMetaPopup] metaMulti', metaMulti.value)
    } else {
      // uni.request fallback for miniapp environments
      // miniapp并发请求多个详情
      metaMulti.value = []
      await Promise.all(urls.map(u=> new Promise((resolve)=>{
        try{
          uni.request({ url: u, method:'GET', success(r){ try{ const payload = r?.data; const data = (payload && (payload.data||payload)) ? (payload.data||payload) : payload; metaMulti.value.push(data); resolve() }catch(err){ metaMulti.value.push({ _error:String(err), _url:u }); resolve() } }, fail(err){ metaMulti.value.push({ _error:String(err), _url:u }); resolve() } })
        }catch(e){ metaMulti.value.push({ _error:String(e), _url:u }); resolve() }
      })))
      metaData.value = metaMulti.value[0] || null
    }
  }catch(e){
    console.warn('openMetaPopup fetch failed', e)
    // show error in modal rather than silent toast so user sees it
    metaData.value = { _error: String(e) }
  } finally {
    metaLoading.value = false
  }
}

function closeMeta(){ showMeta.value = false; metaData.value = null }

// helper to format seconds -> mm:ss
function fmtSeconds(s){ if(!s && s!==0) return '-' ; const m = Math.floor(s/60); const sec = String(s%60).padStart(2,'0'); return `${m}:${sec}` }

function startDrag(e){ 
  // timer interactions disabled — static decoration only
  return
}

function onRingTouchStart(e){
  // disabled
  return
}

function onRingTouchMove(e){
  // disabled
  return
}

function onRingTouchEnd(){
  // disabled
  return
}

function onRingMove(touch){
  // 计算相对于圆心的角度
  const rect = { left: 0, top: 0, width: 280, height: 280 } // CSS ring 的尺寸
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = touch.clientX - cx
  const dy = touch.clientY - cy
  // 调整角度计算：让顶部为0度，顺时针递增
  let ang = Math.atan2(dy, dx) * 180 / Math.PI + 90
  if(ang < 0) ang += 360
  // 反转角度：从右到左滑动（顺时针递减）
  ang = 360 - ang
  if(ang >= 360) ang = ang - 360
  knobAngle.value = ang
  durationMinutes.value = Math.max(0, Math.min(120, Math.round((ang % 360) / 360 * 120)))
  remainingSeconds.value = durationMinutes.value * 60
  showTime.value = true
}
function startDragMouse(e){ 
  // disabled
  return
}

function toggleCorner(idx){ const n = threeTracks.value[idx]; if(!n) return; // toggle individual play
  const exists = store.playlist.some(t=>t.id===n.id)
  if(!exists) store.addToQueue(n)
  // play single track
  store.play(n)
}
function onDrag(e){ 
  // disabled
  return
}
function onDragMouse(e){ 
  // disabled
  return
}
function endDrag(e){ 
  // disabled
  return
}
function endDragMouse(e){ 
  // disabled
  return
}

function startTimer(){ if(timerId) clearInterval(timerId); remainingSeconds.value = durationMinutes.value*60; timerId = setInterval(()=>{ remainingSeconds.value -=1; if(remainingSeconds.value <=0){ clearInterval(timerId); timerId=null; // stop playback and close page
      store.pause(); try{ uni.navigateBack() }catch(e){ /* no-op */ }
    } }, 1000) }
function cancelTimer(){ if(timerId){ clearInterval(timerId); timerId=null } }

let audioCtxs = [] // array of InnerAudioContext for multi-track

function createAudioCtxForTrack(track, idx){
  try{
    const ctx = uni.createInnerAudioContext()
    ctx.autoplay = !!track.enabled
    ctx.obeyMuteSwitch = false
    ctx.src = track.src || track.url || ''
    ctx.volume = typeof track.volume === 'number' ? track.volume : (store.volume || 0.5)
    ctx.onTimeUpdate(()=>{
      try{ if(idx===0){ store.positionMs = ctx.currentTime * 1000 } }catch(e){}
    })
    ctx.onEnded(()=>{ try{ /* if one track ends, keep others running */ }catch(e){} })
    ctx.onError((err)=>{ console.warn('[player] audioCtx error idx', idx, err); uni.showToast({ title:'音频加载失败', icon:'none' }) })
    return ctx
  }catch(e){ console.warn('createAudioCtxForTrack failed', e); return null }
}

onLoad((query)=>{
  // read optional title override from query
  if(query?.title){
    try{ playlistTitleOverride.value = decodeURIComponent(query.title) }catch(e){ playlistTitleOverride.value = query.title }
  }

  // build initial playlist for multi-track: prefer store.playlist, fallback to currentTrack or samples
  let tracks = (Array.isArray(store.playlist) && store.playlist.length>0) ? store.playlist.slice(0,3) : (store.currentTrack ? [store.currentTrack] : [])
  if(tracks.length === 0) tracks = allNoises.slice(0,3)
  // normalize tracks to include src and enabled
  const normalized = tracks.map((t,i)=> ({ id: t.id || `t${i}`, name: t.name || t.title || `音轨 ${i+1}`, src: t.src || t.url || '', volume: (t.volume || store.volume || 0.8), enabled: true }))
  audioTracks.value = normalized

  // create audio contexts for each track and autoplay
  try{
    // cleanup old
    audioCtxs.forEach(c=>{ try{ c.pause(); c.destroy && c.destroy() }catch(e){} })
    audioCtxs = []
    normalized.forEach((t, i)=>{
      const ctx = createAudioCtxForTrack(t, i)
      if(ctx){
        audioCtxs.push(ctx)
        try{ if(t.enabled && ctx.src){ ctx.play() } }catch(e){ console.warn('play failed', e) }
      }
    })
  }catch(e){ console.warn('multi audio init failed', e) }

  // existing behavior: if query.id open target
  try{
    if(query?.id){
      const target = allNoises.find(n=>n.id===query.id)
      if(target){
        store.setPlaylist(allNoises)
        store.play(target)
        historyStore.add(target)
      }
    }
  }catch(e){ console.warn('audio init failed', e) }
})

onUnload(()=>{
  try{ audioCtxs.forEach(c=>{ try{ c.stop && c.stop(); c.destroy && c.destroy() }catch(e){} }) }catch(e){}
})

// update single track enabled -> control audioCtxs
function setTrackEnabled(idx, enabled){
  const t = audioTracks.value[idx]
  if(!t) return
  t.enabled = !!enabled
  const ctx = audioCtxs[idx]
  if(!ctx) return
  try{
    if(t.enabled){ if(ctx.src) ctx.play(); // restore volume
      ctx.volume = t.volume
    }
    else { // fade out and pause
      rampVolumeForCtx(idx, 0, 240).then(()=>{ try{ ctx.pause() }catch(e){} })
    }
  }catch(e){ console.warn('setTrackEnabled failed', e) }
}

// Canvas drawing and interaction for timer ring (兼容 小程序)
function polarToCartesian(cx, cy, r, angle){
  const a = (angle-90) * Math.PI/180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function drawRing(ctx, cx, cy, r){
  // background ring
  ctx.lineWidth = 6
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke()
}

function drawProgress(ctx, cx, cy, r, percent){
  const start = -Math.PI/2
  const end = start + percent * Math.PI*2
  ctx.lineWidth = 6
  ctx.strokeStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(cx, cy, r, start, end); ctx.stroke()
}

function drawTicks(ctx, cx, cy, r){
  const labels = [{angle:0,text:'∞'},{angle:60,text:'120'},{angle:120,text:'90'},{angle:180,text:'60'},{angle:240,text:'30'},{angle:300,text:'0'}]
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '12px Arial'
  labels.forEach(l=>{
    const ang = (l.angle-90) * Math.PI/180
    const x = cx + r * Math.cos(ang)
    const y = cy + r * Math.sin(ang)
    ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill()
    ctx.fillText(l.text, x-6, y-12)
  })
}

function drawKnob(ctx, cx, cy, r, angle){
  const p = polarToCartesian(cx,cy,r,angle)
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(p.x,p.y,8,0,Math.PI*2); ctx.fill()
}

function clearCanvas(ctx, w, h){ ctx.clearRect(0,0,w,h) }

function initCanvas(){
  const canvas = canvasRef.value
  if(!canvas) {
    console.warn('Canvas element not found')
    return
  }
  
  console.log('Initializing canvas...')
  
  // 微信小程序需要通过 uni.createCanvasContext 获取上下文
  const ctx = uni.createCanvasContext('timerCanvas', this)
  if(!ctx) {
    console.warn('Could not get canvas context')
    return
  }
  
  const w = 420
  const h = 420
  const cx = w/2
  const cy = h/2
  const r = 140
  
  function render(){
    console.log('Rendering canvas...', { knobAngle: knobAngle.value, timerPercent: timerPercent.value })
    
    // 清空画布
    ctx.clearRect(0, 0, w, h)
    
    // 绘制外圈背景
    ctx.setLineWidth(8)
    ctx.setStrokeStyle('rgba(255,255,255,0.08)')
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, 2*Math.PI)
    ctx.stroke()
    
    // 绘制刻度和标签
    const labels = [{angle:0,text:'∞'},{angle:60,text:'120'},{angle:120,text:'90'},{angle:180,text:'60'},{angle:240,text:'30'},{angle:300,text:'0'}]
    ctx.setFillStyle('rgba(255,255,255,0.6)')
    ctx.setFontSize(14)
    ctx.setTextAlign('center')
    labels.forEach(l=>{
      const ang = (l.angle-90) * Math.PI/180
      const x = cx + r * Math.cos(ang)
      const y = cy + r * Math.sin(ang)
      // 刻度点
      ctx.setFillStyle('rgba(255,255,255,0.6)')
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2*Math.PI)
      ctx.fill()
      // 标签文字
      ctx.setFillStyle('rgba(255,255,255,0.8)')
      ctx.fillText(l.text, x, y-15)
    })
    
    // 绘制进度
    const startAngle = -Math.PI/2
    const endAngle = startAngle + timerPercent.value * 2*Math.PI
    ctx.setLineWidth(8)
    ctx.setStrokeStyle('#ffffff')
    ctx.setLineCap('round')
    ctx.beginPath()
    ctx.arc(cx, cy, r, startAngle, endAngle)
    ctx.stroke()
    
    // 绘制可拖动的白色圆点
    const knobAngleRad = (knobAngle.value - 90) * Math.PI/180
    const knobX = cx + r * Math.cos(knobAngleRad)
    const knobY = cy + r * Math.sin(knobAngleRad)
    
    // 外圈阴影
    ctx.setFillStyle('rgba(0,0,0,0.3)')
    ctx.beginPath()
    ctx.arc(knobX+2, knobY+2, 12, 0, 2*Math.PI)
    ctx.fill()
    
    // 白色主圆点
    ctx.setFillStyle('#ffffff')
    ctx.beginPath()
    ctx.arc(knobX, knobY, 12, 0, 2*Math.PI)
    ctx.fill()
    
    // 内部小点
    ctx.setFillStyle('rgba(0,0,0,0.1)')
    ctx.beginPath()
    ctx.arc(knobX, knobY, 4, 0, 2*Math.PI)
    ctx.fill()
    
    // 提交绘制
    ctx.draw()
  }
  
  // 初始渲染
  setTimeout(render, 100)
  
  // watch knobAngle and timerPercent
  watch([knobAngle, () => timerPercent.value], ()=>{ 
    try{ 
      console.log('Canvas update triggered')
      render() 
    }catch(e){ 
      console.error('Canvas render error:', e) 
    } 
  })

  // 微信小程序触摸事件处理
  let draggingLocal = false
  
  function handleTouchStart(e){
    console.log('Touch start on canvas')
    draggingLocal = true
    if(e.touches && e.touches[0]){
      onCanvasMove(e.touches[0])
    }
  }
  
  function handleTouchMove(e){
    if(draggingLocal && e.touches && e.touches[0]){
      e.preventDefault()
      onCanvasMove(e.touches[0])
    }
  }
  
  function handleTouchEnd(){
    draggingLocal = false
  }

  function onCanvasMove(touch){
    const rect = { left: 0, top: 0, width: w, height: h } // Canvas的矩形区域
    const cxAbs = rect.left + cx
    const cyAbs = rect.top + cy
    const dx = touch.clientX - cxAbs
    const dy = touch.clientY - cyAbs
    let ang = Math.atan2(dy,dx) * 180/Math.PI + 90
    if(ang<0) ang+=360
    knobAngle.value = ang
    durationMinutes.value = Math.max(0, Math.min(120, Math.round((ang%360)/360*120)))
    remainingSeconds.value = durationMinutes.value * 60
    console.log('Canvas drag:', { ang, durationMinutes: durationMinutes.value })
  }
}
function toggle(){
  // toggle global play/pause across multi-track contexts
  const anyPlaying = store.isPlaying
  if(anyPlaying) {
    fadePause()
  } else {
    fadePlay()
  }
}
async function fadePlay(){
  try{
    store.play()
    // ramp up volumes from 0 to target for each enabled ctx
    const targets = audioTracks.value.map((t,i)=> ({ idx:i, vol: t.enabled ? t.volume : 0 }))
    // set all to 0 then play
    audioCtxs.forEach((c, i)=>{ try{ c.volume = 0; if(audioTracks.value[i]?.enabled && c.src) c.play() }catch(e){} })
    // ramp each to its target in parallel
    await Promise.all(targets.map(t=> rampVolumeForCtx(t.idx, t.vol, 400)))
    store.isPlaying = true
  }catch(e){ console.warn('fadePlay failed', e) }
}
async function fadePause(){
  try{
    // ramp all to 0 then pause
    await Promise.all(audioCtxs.map((c,i)=> rampVolumeForCtx(i, 0, 300).catch(()=>{})))
    audioCtxs.forEach((c,i)=>{ try{ c.pause() }catch(e){} })
    store.pause()
  }catch(e){ console.warn('fadePause failed', e) }
}
function rampVolumeForCtx(idx, target, ms){
  return new Promise(resolve=>{
    const ctx = audioCtxs[idx]
    if(!ctx) return resolve()
    const steps = 10
    const start = typeof ctx.volume === 'number' ? ctx.volume : 0
    const delta = (target - start) / steps
    let i = 0
    const id = setInterval(()=>{
      i++
      try{ ctx.volume = Math.max(0, Math.min(1, start + delta * i)) }catch(e){}
      if(i>=steps){ clearInterval(id); resolve() }
    }, Math.max(10, ms/steps))
  })
}

function seek(ms){
  store.seek(ms)
  // seek primary ctx (idx 0) if exists
  try{ if(audioCtxs[0] && typeof audioCtxs[0].seek === 'function'){ audioCtxs[0].seek(ms/1000) } }catch(e){ console.warn('seek failed', e) }
}
function setVolume(v){
  store.setVolume(v)
  // apply to primary track and update audioTracks[0]
  try{ if(audioTracks.value[0]){ audioTracks.value[0].volume = v } }catch(e){}
  audioCtxs.forEach((c,i)=>{ try{ if(i===0) c.volume = store.volume; }catch(e){} })
}
function muteToggle(){
  store.toggleMute()
  // when muted, set volumes to 0; when unmuted restore from audioTracks
  const muted = !!store.muted
  audioCtxs.forEach((c,i)=>{ try{ c.volume = muted ? 0 : (audioTracks.value[i]?.volume || store.volume || 0.5) }catch(e){} })
}
function toggleLoop(){
  const nextMode = store.loopMode==='all' ? 'one' : store.loopMode==='one' ? 'off' : 'all'
  store.setLoopMode(nextMode)
}
function prev(){
  store.prev()
  if (store.currentTrack) { historyStore.add(store.currentTrack); // update primary ctx src
    try{ if(audioCtxs[0]){ audioCtxs[0].src = store.currentTrack.src; fadePlay() }else{ fadePlay() } }catch(e){ fadePlay() }
  }
}
function next(){
  store.next()
  if (store.currentTrack) { historyStore.add(store.currentTrack); try{ if(audioCtxs[0]){ audioCtxs[0].src = store.currentTrack.src; fadePlay() }else{ fadePlay() } }catch(e){ fadePlay() } }
}
function goQueue(){ uni.navigateTo({ url:'/pages/queue/index' }) }

// Playlist methods
function showPlaylist() {
  showPlaylistModal.value = true
}

function hidePlaylist() {
  showPlaylistModal.value = false
}

function playTrack(track) {
  store.play(track)
  hidePlaylist()
}

function removeFromPlaylist(trackId) {
  store.playlist = store.playlist.filter(track => track.id !== trackId)
}

function clearPlaylist() {
  store.playlist = []
  uni.showToast({ title: '播放列表已清空', icon: 'success' })
}

function goToHome() {
  hidePlaylist()
  uni.switchTab({ url: '/pages/noise/Free' })
}

watch(()=>store.volume, v=>{ if(audioCtx) audioCtx.volume = v })

onMounted(()=>{
  // initialize knob position from durationMinutes and pick three random noises from playlist
  knobAngle.value = 360 - (durationMinutes.value/120) * 360
  const pool = store.playlist.length ? store.playlist : allNoises
  setTimeout(()=>{
    try{
      if(canvasRef.value) {
        initCanvas()
      }
    }catch(e){ console.warn('initCanvas failed', e) }
  }, 150)
  const shuffled = [...pool].sort(()=>0.5 - Math.random())
  const fallback = [ allNoises[0] || null, allNoises[1] || null, allNoises[2] || null ]
  threeTracks.value = [shuffled[0]||fallback[0], shuffled[1]||fallback[1], shuffled[2]||fallback[2]]
  // 同步服务端收藏，确保进入播放页即可拿到最新收藏状态
  try{ favStore.syncFromServer?.() }catch(e){ /* silent */ }
  // 更新收藏数量
  updateFavoriteCount()

  // compute listHeight for scroll-view so it can scroll on miniapp
  try{
    const sys = uni.getSystemInfoSync()
    const winH = sys.windowHeight || sys.screenHeight || 667
    // reserve about 180px for title and close button area (approx)
    const reserved = 180
    listHeight.value = Math.max(160, winH - reserved)
  }catch(e){ listHeight.value = 260 }
})

function openCozeChat(){
  const url = encodeURIComponent('https://www.coze.cn/store/agent/7568816236197363712?bot_id=true')
  uni.navigateTo({ url: `/pages/chat/Webview?url=${url}` })
}
</script>
<style scoped>
.page{ min-height:100vh; padding-bottom: 24px; position:relative; /* use theme background from bgStyle */ }
.topbar{ display:flex; justify-content:space-between; align-items:center; padding:12px 16px; position:relative }
.page button::after{ border:none }
.collapse, .share{ background:transparent; border:none; color:inherit; font-size:18px }
.collapse{ position:absolute; left:12px; top:12px }
.share{ position:absolute; right:12px; top:12px }
.share-hit{ position:absolute; right:8px; top:8px; width:48px; height:48px; z-index:1600; background:transparent; border:none; padding:0; margin:0; border-radius:999px }

.nav{ display:flex; justify-content:space-between; align-items:center; padding: 0 16px }
.btn{ padding:6px 10px; border-radius:6px; background:#f2f3f5 }
.heart{ padding:6px 10px; border-radius:999px; background: var(--input-bg); color: var(--fg) }
.cover-wrap{ padding:24px 16px; display:flex; justify-content:center }
.cover{ width:220px; height:220px; border-radius:50%; box-shadow: 0 4px 18px rgba(0,0,0,.15); overflow:hidden }
.spinning{ animation: spin 6s linear infinite }
@keyframes spin{ from{ transform: rotate(0deg) } to{ transform: rotate(360deg) } }
.meta{ padding: 0 16px }
.name{ font-size:18px; font-weight:600; color: var(--text-primary) }
.author{ margin-top:4px; font-size:14px; color:#666 }
.count{ margin-top:4px; font-size:12px; color:#999 }
.timer-wrap{ padding-top:36px; display:flex; flex-direction:column; align-items:center; position:relative }
.timer-svg{ width:84vw; max-width:420px; height:84vw; max-height:420px }
.timer-bg-layer{ position:absolute; width:84vw; max-width:420px; height:84vw; max-height:420px; /* background-image removed for build compatibility */ background-repeat:no-repeat; background-position:center; background-size:55%; opacity:0.0; z-index:10; pointer-events:none }
.timer-bg-img{ position:absolute; width:84vw; max-width:420px; height:84vw; max-height:420px; top:0; left:0; right:0; bottom:0; margin:auto; opacity:0.12; z-index:10; pointer-events:none }
.triangle-fallback{ position:absolute; width:80%; height:80%; max-width:360px; max-height:360px; display:flex; align-items:center; justify-content:center; z-index:12; pointer-events:none; opacity:0.85 }
.tri-f{ position:absolute; left:50%; transform:translateX(-50%); border-left: 80px solid transparent; border-right: 80px solid transparent }
.tri-f-outer{ bottom:26%; border-bottom: 140px solid rgba(255,255,255,0.20) }
.tri-f-middle{ bottom:34%; border-bottom: 100px solid rgba(255,255,255,0.14) }
.tri-f-inner{ bottom:42%; border-bottom: 60px solid rgba(255,255,255,0.10) }
.tri-center-icon{ position:absolute; bottom:44%; left:50%; transform:translateX(-50%); background:rgba(255,255,255,0.08); padding:8px 10px; border-radius:8px; font-size:14px; color:rgba(255,255,255,0.95) }
.timer-canvas{ position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); /* hidden to avoid canvas/SVG render conflicts during debugging */ display:none !important; z-index:10; width:84vw; max-width:420px; height:84vw; max-height:420px } 
.timer-svg{ position:relative; z-index:300 !important }

/* CSS Timer Ring */
.css-timer-ring{ position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:300px; height:300px; z-index:200 }
.ring-outer-bg{ position:absolute; left:0; top:0; width:100%; height:100%; border:8px solid rgba(255,255,255,0.08); border-radius:50% }
.ring-progress{ position:absolute; left:0; top:0; width:100%; height:100%; border-radius:50% }
.ring-progress-fill{ position:absolute; left:0; top:0; width:100%; height:100%; border:8px solid #fff; border-radius:50%; border-color: #fff transparent transparent transparent; border-width: 8px }

.tick-marks{ position:absolute; left:0; top:0; width:100%; height:100% }
.tick-mark{ position:absolute; left:50%; top:0; width:2px; height:6px; margin-left:-1px; margin-top:-3px; transform-origin: center 150px }
.tick-dot{ position:absolute; left:50%; top:0; width:6px; height:6px; background:rgba(255,255,255,0.6); border-radius:50%; margin-left:-3px; margin-top:-3px }
.tick-text{ position:absolute; left:50%; top:-20px; transform:translateX(-50%); font-size:12px; color:rgba(255,255,255,0.8); white-space:nowrap }

.draggable-knob{ position:absolute; width:24px; height:24px; z-index:300; cursor:pointer }
.knob-shadow{ position:absolute; left:2px; top:2px; width:24px; height:24px; background:rgba(0,0,0,0.3); border-radius:50% }
.knob-main{ position:absolute; left:0; top:0; width:24px; height:24px; background:#fff; border-radius:50%; box-shadow:0 4px 12px rgba(0,0,0,0.4) }
.knob-inner{ position:absolute; left:8px; top:8px; width:8px; height:8px; background:rgba(0,0,0,0.1); border-radius:50% }
.ring-bg{ fill:none; stroke:rgba(255,255,255,0.06); stroke-width:6 }
.ring-progress{ fill:none; stroke:rgba(255,255,255,0.98); stroke-width:6; stroke-linecap:round; transform:rotate(-90deg); transform-origin:center; transition: stroke-dashoffset 200ms linear }
.ring-bg, .outer-ring-bg{ fill:none; stroke:rgba(255,255,255,0.06); stroke-width:4 }
.outer-ring-progress{ fill:none; stroke:rgba(255,255,255,0.12); stroke-width:4; stroke-linecap:round; transform:rotate(-90deg); transform-origin:center }
.knob{ fill:#fff; stroke:rgba(0,0,0,0.08); stroke-width:1; filter: drop-shadow(0 8px 26px rgba(0,0,0,0.5)); cursor:pointer }
.knob-handle{ fill:#fff; stroke:rgba(0,0,0,0.08); stroke-width:1; filter: drop-shadow(0 8px 26px rgba(0,0,0,0.5)) }
.tick-label{ font-size:12px; fill:rgba(255,255,255,0.75); text-anchor:middle }
.timer-center{ position:absolute; left:0; right:0; top:44%; transform:translateY(-50%); font-size:16px; color:rgba(255,255,255,0.85); text-align:center }
.timer-center .time-big{ display:block; font-size:22px; font-weight:800; margin-top:6px; font-family: 'Courier New', monospace }
.timer-wrap{ height:420px; position:relative; display:flex; align-items:center; justify-content:center }
.triangle-icons{ position:absolute; left:0; top:0; right:0; bottom:0; pointer-events:none }
.tri-icon{ position:absolute; display:flex; flex-direction:column; align-items:center; pointer-events:auto }
.tri-btn{ width:44px; height:44px; border-radius:0; background: transparent; display:flex; align-items:center; justify-content:center; border:none; box-shadow: none }
.icon-svg{ width:56px; height:56px; display:flex; align-items:center; justify-content:center }
.icon-svg image{ width:36px; height:36px; display:block }
.tri-label{ margin-top:6px; color:#fff; font-size:12px }
.tri-icon{ position:absolute }
.triangle-icons{ position:relative }
.tri-icon{ left:50%; top:50%; transform:translate(-50%,-50%) }
/* position classes for triangle corner icons relative to timer-wrap center */
.tri-icon.pos-0{ transform: translate(-50%,-50%) translateY(-110px) }
.tri-icon.pos-1{ transform: translate(-50%,-50%) translate(95px,55px) }
.tri-icon.pos-2{ transform: translate(-50%,-50%) translate(-95px,55px) }

/* ensure triangle icons are positioned over the timer, not page bottom */
.timer-wrap{ height:420px; position:relative; display:flex; align-items:center; justify-content:center }
.triangle-icons{ position:absolute; left:0; top:0; right:0; bottom:0; pointer-events:none }
.tri-icon{ position:absolute; left:50%; top:50% }

.ticks .tick{ fill:rgba(255,255,255,0.6) }
.tick-label{ font-size:12px; fill:rgba(255,255,255,0.6); text-anchor:middle }
.triangles .tri{ fill:rgba(255,255,255,0.12); stroke:rgba(255,255,255,0.06); stroke-width:1 }
.triangles .tri2{ fill:rgba(255,255,255,0.18); stroke:rgba(255,255,255,0.08); stroke-width:1 }
.triangles .tri3{ fill:rgba(255,255,255,0.24); stroke:rgba(255,255,255,0.1); stroke-width:1 }
.icons-row{ display:flex; justify-content:space-between; padding:12px 36px }
.icon-left, .icon-right{ color:#fff; opacity:0.8 }
.meta{ padding: 18px 16px }
.title-row{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.fixed-label{ font-size:24px; font-weight:800; color: var(--text-primary); }
.author{ margin-top:6px; color: var(--text-primary) }
.name{ font-size:20px; color:#fff; font-weight:700 }
.meta-actions{
  display:flex;
  align-items:center;
  gap:12px;
  margin-right: 4px;
}
.favorite-wrapper { position:relative; width:28px; height:24px; }
.favorite-btn{ color:#0f172a; 
  position:relative;
  border:none;
  padding:0;
  background:transparent;
  display:flex;
  align-items:center;
  justify-content:center;
  width:32px;
  height:32px;
  color:inherit;
  transition:opacity 0.15s ease;
}
.favorite-btn:active{ opacity:0.8; }
.heart-shape{ position:relative; width:28px; height:26px; color:#0f172a; }
.heart-shape .heart-l, .heart-shape .heart-r{ position:absolute; width:14px; height:14px; background: currentColor; border-radius: 50%; top:0 }
.heart-shape .heart-l{ left:0 }
.heart-shape .heart-r{ right:0 }
.heart-shape .heart-c{ position:absolute; width:18px; height:18px; background: currentColor; left:5px; top:7px; transform: rotate(45deg) }
.favorite-btn.active .heart-shape{ color:#ff346c }
.favorite-btn.active{ color:#ff346c; }
.badge-anchor{ position:relative; width:24px; height:24px; display:flex; align-items:center; justify-content:center }
.favorite-badge{
  position:absolute;
  right:0;
  top:0;
  transform: translate(60%,-40%);
  font-size:12px;
  font-weight:700;
  color:#111111;
  z-index:6;
  background: #fff;
  padding: 2px 6px;
  border-radius: 10px;
  box-shadow: 0 6px 14px rgba(0,0,0,0.06);
}
.favorite-btn.active .favorite-badge{ color:#ff3b6a; background: #fff0f2 }
.share-btn{ background: transparent; border: none; font-size: 20px; padding: 8px; }
.time-display {
  margin-top: 8px;
}
.time-text {
  font-size: 12px;
  color: var(--muted);
  font-family: 'Courier New', monospace;
}
.author{ margin-top:6px; color: var(--text-primary) }
.tags{ display:flex; gap:12px; padding:8px 16px; align-items:center; justify-content:space-evenly }
.tag{ background:var(--card-bg, #ffffff); color: var(--card-fg, #13303f); padding:8px 12px; border-radius:12px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); opacity:1; font-size:14px; min-width:72px; text-align:center; display:inline-flex; align-items:center; justify-content:center; border:1px solid rgba(19,48,63,0.06) }
.controls{ display:flex; align-items:center; justify-content:space-around; padding:18px 36px }
.play-btn{ width:64px; height:64px; border-radius:32px; background:#fff; color: var(--text-primary); display:flex; align-items:center; justify-content:center; font-size:22px; box-shadow: 0 8px 24px rgba(0,0,0,0.10) }
.ctrl{ background:transparent; border:none; color:#fff; font-size:18px }
.settings-btn{ background: var(--input-bg, #f1f8ff); color: var(--card-fg, #13303f); border-radius:8px; padding:8px; }

/* Playlist Modal */
.playlist-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.playlist-content {
  background: #fff;
  border-radius: 16px;
  width: 90vw;
  max-width: 400px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.playlist-header {
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 20px 48px 20px 20px; /* 给右上角关闭按钮留空间 */
  border-bottom: 1px solid #f0f0f0;
}

.playlist-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.playlist-close {
  position: absolute;
  right: 12px;
  top: 12px;
  background: none;
  border: none;
  font-size: 22px;
  color: #999;
  padding: 4px;
  line-height: 1;
}

.playlist-scroll {
  flex: 1;
  max-height: 300px;
}

.playlist-list {
  padding: 0 20px;
}

.playlist-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f8f8f8;
}

.playlist-item.active {
  background: #f0f7ff;
  margin: 0 -20px;
  padding: 12px 20px;
}

.playlist-item:last-child {
  border-bottom: none;
}

.playlist-cover {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 12px;
}

.playlist-info {
  flex: 1;
}

.playlist-name {
  display: block;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.playlist-item.active .playlist-name {
  color: #007aff;
}

.playlist-author {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.playlist-actions {
  margin-left: 8px;
}

.playlist-action-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 18px;
  padding: 4px 8px;
}

.playlist-empty {
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
  color: #999;
  font-size: 14px;
  margin-bottom: 16px;
}

.empty-btn {
  background: #007aff;
  color: var(--text-primary);
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
}

.playlist-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.playlist-count {
  font-size: 14px;
  color: #666;
}

.playlist-clear {
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
}

.playlist-btn {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px;
}

/* Settings Modal Styles - 半屏弹窗 */
/* Volume modal: compact centered card (different from settings half-sheet) */
.volume-modal-overlay{ position:fixed; inset:0; background: rgba(0,0,0,0.6); display:flex; align-items:flex-end; justify-content:center; z-index:1100 }
.volume-modal{ width:100%; max-width:720px; background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,252,255,0.98) 100%); border-top-left-radius:18px; border-top-right-radius:18px; padding:12px 16px 20px 16px; box-shadow: 0 -10px 30px rgba(10,18,26,0.18); z-index:1110; border-top: 1px solid rgba(10,20,30,0.06); margin:0; }
.volume-modal .vm-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:6px }
.volume-modal .vm-title{ font-weight:800; color:#2b3140; font-size:16px }
.volume-modal .vm-reset{ background:transparent; border:none; color:#9aa3b2; font-size:13px }
.volume-modal .vm-list{ margin:6px; max-height:260px; overflow:auto; padding:4px }
.volume-modal .vm-item{ padding:8px; border-radius:12px; margin-bottom:8px; background: #ffffff; box-shadow: 0 6px 18px rgba(17,24,39,0.04); display:block }
.volume-modal .vm-item.compact{ padding:6px 8px }
.volume-modal .vm-row{ display:flex; justify-content:space-between; align-items:center; padding-bottom:0 }
.volume-modal .vm-name{ font-size:14px; color:#2b3140; background:transparent; border:none; padding:4px 8px; border-radius:10px; text-align:left; flex:1 }
.volume-modal .vm-name.disabled{ opacity:0.36; color:#7d8794 }
.volume-modal .vm-right{ min-width:48px; text-align:right }
.volume-modal .vm-value{ font-size:13px; color:#6b7280; font-weight:700; background:#f3f6fb; padding:6px 8px; border-radius:12px }
.volume-modal .vm-slider-row{ margin:4px 0 }
.volume-modal .vm-controls-row{ display:flex; justify-content:flex-end; align-items:center; gap:6px }
.volume-modal .vm-speed{ display:flex; align-items:center; gap:8px }
.volume-modal .speed-label{ font-size:13px; color:#95a0af }
.volume-modal .vm-actions-inline{ display:flex; gap:6px }
.small-btn{ background:transparent; border:1px solid rgba(43,52,64,0.06); padding:6px 6px; border-radius:8px; color:#2b3140; width:36px; height:36px }
.volume-modal .vm-actions{ display:flex; justify-content:center; margin-top:6px }
.volume-modal .vm-close{ background:#fff; border-radius:10px; border:1px solid rgba(43,52,64,0.06); padding:8px 12px; box-shadow: 0 8px 24px rgba(20,30,60,0.06); color:#2b3140 }

/* compact slider row (smaller) */
.volume-modal .slider-row{ display:flex; align-items:center; gap:6px }
.volume-modal .vm-slider{ flex:1; margin-right:6px; height:6px }
.volume-modal slider { height:6px }
.volume-modal .vm-percent{ font-size:12px; color:#6b7280; font-weight:700; background:#f3f6fb; padding:4px 6px; border-radius:10px; display:flex; align-items:center; justify-content:center; min-width:44px }
.volume-modal .vm-actions-inline.mini{ display:flex; gap:4px }
.small-btn{ width:32px; height:32px; padding:4px 6px; border-radius:6px; font-size:14px }

/* reduce item padding/height to fit more */
.volume-modal .vm-item{ padding:6px; margin-bottom:6px }
.volume-modal .vm-item.compact{ padding:6px 6px }
.volume-modal .vm-list .vm-item{ min-height:48px }
.volume-modal .vm-list .speed-block .vm-item{ min-height:44px }

/* slider thumb smaller fallback */
.volume-modal slider::-webkit-slider-thumb { width:10px; height:10px; border-radius:10px }

/* section subtitle */
.volume-modal .vm-subtitle{ font-size:13px; color:#9aa3b2; margin:8px 6px }
.volume-modal .speed-block .vm-row{ padding-bottom:6px }

/* force overrides to ensure styles load in devtools/runtime */
.volume-modal .vm-item{ padding:8px !important; border-radius:12px !important; margin-bottom:6px !important; background:#ffffff !important; box-shadow: 0 6px 18px rgba(17,24,39,0.04) !important }
.volume-modal .vm-name{ text-align:left !important; color:#2b3140 !important; font-size:14px !important }
.volume-modal .vm-percent{ background:#f3f6fb !important; color:#6b7280 !important; padding:6px 8px !important; border-radius:12px !important }
.volume-modal .small-btn{ padding:6px 8px !important; border-radius:8px !important }
.volume-modal .vm-title{ font-weight:800 !important; color:#2b3140 !important }

/* Slider visual tweaks to match sample: thin track, colored progress and small thumb (WXSS compatible) */
.volume-modal slider { height: 6px; border-radius: 6px; background: #eef2fb }
/* WXSS doesn't support ::part; provide vendor-friendly fallbacks for common runtimes */
.volume-modal slider::-webkit-slider-runnable-track { background: #eef2fb }
.volume-modal slider::-webkit-slider-thumb { width:12px; height:12px; border-radius:12px; background: linear-gradient(90deg,#6fbfef,#7ddf9a); border:none }

/* make vm-list inner spacing match screenshot */
.volume-modal .vm-item:last-child{ margin-bottom:0 }

/* compact reset link on right */
.volume-modal .vm-header-right{ display:flex; align-items:center; gap:8px }

/* ensure modal close row spacing */
.volume-modal .vm-actions .vm-close{ min-width:84px }


.settings-overlay{ 
  position:fixed; 
  top:0; 
  left:0; 
  right:0; 
  bottom:0; 
  background:rgba(0,0,0,0.5); 
  display:flex; 
  align-items:flex-end; 
  justify-content:center; 
  z-index:1000 
}
.settings-content{ 
  background: rgba(255,255,255,0.9); 
  backdrop-filter: blur(10px);
  border-top-left-radius: 32rpx; 
  border-top-right-radius: 32rpx; 
  padding:20px; 
  width:100%; 
  max-height:50vh; 
  overflow-y:auto;
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
.settings-header{ 
  position:relative; 
  display:flex; 
  justify-content:flex-start; 
  align-items:center; 
  margin-bottom:20px; 
  padding-right: 40px 
}
.settings-title{ 
  font-size:18px; 
  font-weight:600; 
  color: var(--card-fg, #13303f) 
}
.settings-close{ 
  position:absolute; 
  right:8px; 
  top:6px; 
  background:none; 
  border:none; 
  color: var(--card-fg, #13303f); 
  font-size:22px; 
  width:28px; 
  height:28px; 
  display:flex; 
  align-items:center; 
  justify-content:center; 
  line-height:1 
}
.settings-section {
  margin-bottom: 24px;
}
.volume-slider {
  width: 100%;
  margin: 12px 0;
}
.volume-value {
  display: block;
  text-align: right;
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

/* Modal Styles */
.modal-overlay{ position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000 }
.modal-content{ background: var(--card-bg, #fff); border-radius:16px; padding:20px; width:320px; max-width:90vw; max-height:80vh; overflow-y:auto }
.modal-header{ position:relative; display:flex; justify-content:flex-start; align-items:center; margin-bottom:20px; padding-right: 40px }
.modal-title{ font-size:18px; font-weight:600; color: var(--card-fg, #13303f) }
.modal-close{ position:absolute; right:8px; top:6px; background:none; border:none; color: var(--card-fg, #13303f); font-size:22px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; line-height:1 }

.modal-section{ margin-bottom:24px }
.section-title{ font-size:14px; color:#ccc; margin-bottom:12px; display:block }

.mode-options{ display:flex; flex-direction:column; gap:8px }
.mode-option{ display:flex; align-items:center; padding:12px 16px; background:rgba(255,255,255,0.05); border-radius:8px; border:1px solid rgba(255,255,255,0.1) }
.mode-option.active{ background:rgba(255,255,255,0.15); border-color:rgba(255,255,255,0.3) }
.mode-icon{ font-size:18px; margin-right:12px; width:24px; text-align:center }
.mode-label{ font-size:14px; color:#fff }

.timer-options{ display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px }
.timer-option{ padding:12px 8px; background:rgba(255,255,255,0.05); border-radius:8px; border:1px solid rgba(255,255,255,0.1); text-align:center }
.timer-option.active{ background:rgba(255,255,255,0.15); border-color:rgba(255,255,255,0.3) }
.timer-label{ font-size:14px; color:#fff }

.custom-timer{ margin-top:16px }
.custom-label{ font-size:14px; color:#ccc; margin-bottom:8px; display:block }
.custom-input-group{ display:flex; gap:8px }
.custom-input{ flex:1; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:8px 12px; color:#fff; font-size:14px }
.custom-input::placeholder{ color:#999 }
.custom-confirm{ background:#4a9; border:none; border-radius:8px; padding:8px 16px; color:#fff; font-size:14px }
.clear-contrast-overrides{
  /* helper class placeholder */
}

/* Override: make UI elements high-contrast on light theme */
.meta .fixed-label, .meta .name, .meta .author, .playlist-title, .playlist-name, .playlist-count, .empty-text, .modal-title, .mode-label, .timer-label {
  color: var(--card-fg, #13303f) !important;
}

.tri-center-icon, .icon-left, .icon-right, .ctrl, .playlist-action-btn, .playlist-close, .modal-close, .favorite-btn, .tag {
  color: var(--card-fg, #13303f) !important;
}

.tag{ background: var(--card-bg, #ffffff); color: var(--card-fg, #13303f) !important; box-shadow: 0 6px 20px rgba(0,0,0,0.06); }

.play-btn{ background: var(--card-bg, #ffffff) !important; color: var(--card-fg, #13303f) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }

.ctrl{ color: var(--card-fg, #13303f) !important; opacity: 0.95 }

.triangle-fallback .tri-f-outer{ border-bottom-color: rgba(19,48,63,0.06) }
.triangle-fallback .tri-f-middle{ border-bottom-color: rgba(19,48,63,0.04) }
.triangle-fallback .tri-f-inner{ border-bottom-color: rgba(19,48,63,0.02) }
.tri-center-icon{ background: var(--card-bg, rgba(255,255,255,0.95)); color: var(--card-fg, #13303f) !important }

/* Ensure contrast for modal content */
.modal-content{ background: var(--card-bg, #ffffff) !important; color: var(--card-fg, #13303f) }
.modal-section, .mode-option, .timer-option, .custom-input{ background: rgba(0,0,0,0.03) }

/* make icons in controls clearer */
.actions .icon, .ctrl, .playlist-btn{ background: transparent; color: var(--card-fg, #13303f); box-shadow: none }


/* Vinyl turntable styles */
.vinyl{ position:relative; width:78vw; max-width:380px; height:78vw; max-height:380px; display:flex; align-items:center; justify-content:center }
.vinyl-shadow{ position:absolute; inset:-10px; border-radius:50%; box-shadow:0 30px 60px rgba(0,0,0,0.20), inset 0 8px 22px rgba(255,255,255,0.06) }
.disk{ position:relative; width:86%; height:86%; border-radius:50%; background:#0b0b0b; box-shadow: inset 0 0 0 10px #121212, inset 0 0 0 22px #0e0e0e, inset 0 0 0 36px #101010; display:flex; align-items:center; justify-content:center; animation: spin 12s linear infinite; animation-play-state: paused }
.disk.spinning{ animation-play-state: running }
.grooves{ position:absolute; inset:0; border-radius:50%; background: repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 2px, transparent 4px); opacity:0.15; pointer-events:none }
.label{ width:62%; height:62%; border-radius:50%; box-shadow:0 8px 20px rgba(0,0,0,0.25), inset 0 0 0 6px rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,244,255,0.9)); color:#13303f; text-align:center }
.label text{ font-size: 56px; line-height: 1; font-weight: 800 }

/* Tonearm */
.tonearm{ position:absolute; right:-6%; top:-6%; width:56%; height:56%; pointer-events:none; transform-origin: 12% 12%; transform: rotate(-28deg); transition: transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 300ms ease }
.tonearm.on{ transform: rotate(4deg); filter: drop-shadow(0 6px 12px rgba(0,0,0,0.12)) }
.pivot{ position:absolute; left:10%; top:10%; width:22px; height:22px; border-radius:50%; background:var(--card-bg,#fff); box-shadow:0 6px 14px rgba(0,0,0,0.18) }
.arm{ position:absolute; left:11%; top:11%; width:58%; height:6px; background:var(--card-bg,#fff); border-radius:3px; transform-origin:left center; transform: rotate(24deg); box-shadow:0 2px 6px rgba(0,0,0,0.12) }
.head{ position:absolute; right:12%; bottom:18%; width:34px; height:14px; background:var(--card-bg,#fff); border-radius:4px }

/* Adjust wrapper */
.timer-wrap{ padding-top:22px; min-height:360px }

/* Chat FAB */
.fab-chat{ position:fixed; right:18px; bottom:108px; width:54px; height:54px; border-radius:27px; background: linear-gradient(135deg, #66e6a2, #62c2ff); box-shadow: 0 10px 24px rgba(70,170,220,0.25); display:flex; align-items:center; justify-content:center; font-size:26px; color:#fff; z-index:1200; opacity:0.96 }
.fab-chat:active{ transform: scale(0.98); opacity:0.9 }

.meta-grid{ display:flex; flex-direction:column; gap:12px }
.meta-card{ padding:12px; border-radius:12px; background: var(--input-bg, #f1f8ff); box-shadow: 0 8px 18px rgba(0,0,0,0.06) }
.meta-title-row{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px }
.meta-title{ font-weight:800; color: var(--card-fg, #13303f) }
.meta-duration{ font-size:12px; color:#7d8b99; background:#fff; padding:4px 8px; border-radius:999px }
.meta-chips{ display:flex; gap:8px; flex-wrap:wrap }
.meta-chip{ display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:#fff; color: var(--card-fg, #13303f); box-shadow: 0 6px 14px rgba(0,0,0,0.06) }
.chip-icon{ font-size:14px }
.chip-text{ font-size:13px }

/* Hide top center title and top play/share controls per design request */
.topbar .title, .topbar .center-title { display: none !important }
/* hide the top play/share buttons */
.topbar .share, .topbar .play { display: none !important }
/* Theme polish for volume modal to match project style */
.volume-modal-overlay{ background: linear-gradient(180deg, rgba(6,18,28,0.45), rgba(6,18,28,0.45)); }
.volume-modal{ border-radius:18px; padding:12px 14px; background: linear-gradient(180deg, var(--card-bg, #ffffff), rgba(250,252,255,0.98)); border:1px solid rgba(19,40,60,0.04); box-shadow: 0 22px 48px rgba(10,18,26,0.28) }
.volume-modal .vm-header{ padding-bottom:6px }
.volume-modal .vm-title{ font-size:16px; letter-spacing:0.2px }
.volume-modal .vm-reset{ color:var(--muted,#98a3b0) }

/* Card for each track: softer corners and subtle inner spacing */
.volume-modal .vm-item{ background: linear-gradient(180deg, #ffffff, #fbfdff); border-radius:12px; padding:10px 12px; border:1px solid rgba(19,40,60,0.03); box-shadow: 0 6px 16px rgba(12,22,34,0.04) }
.volume-modal .vm-row{ align-items:center }
.volume-modal .vm-name{ color:var(--card-fg,#163047); font-weight:600; font-size:14px }
.volume-modal .vm-name.disabled{ color:#9aa3b2; opacity:0.6 }

/* Slider visuals: thin track, soft green progress, white thumb with shadow */
.volume-modal slider { height:8px; border-radius:8px }
.volume-modal slider::-webkit-slider-runnable-track { background: linear-gradient(90deg,#e9f7ef,#eef6fb) }
.volume-modal slider::-webkit-slider-thumb { width:14px; height:14px; border-radius:14px; background:#fff; box-shadow:0 6px 12px rgba(20,60,40,0.12); border: 2px solid rgba(124,210,150,0.85) }
.volume-modal .vm-slider{ background:transparent }

/* Percent pill and +/- buttons alignment */
.volume-modal .vm-percent{ min-width:42px; padding:4px 6px; font-size:12px; color:var(--card-fg,#163047); background: linear-gradient(180deg,#eef6fb,#ffffff); border-radius:10px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6) }
.volume-modal .vm-actions-inline.mini{ align-items:center }
.small-btn{ width:34px; height:34px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:8px; background:linear-gradient(180deg,#ffffff,#f7fbff); border:1px solid rgba(19,40,60,0.04); box-shadow:0 6px 12px rgba(10,20,30,0.04) }
.small-btn:active{ transform:translateY(1px) }

/* Make list slightly taller but still scrollable */
.volume-modal .vm-list{ max-height:340px }

/* Close button style */
.volume-modal .vm-close{ min-width:100px; padding:10px 16px; border-radius:14px; font-weight:600 }

/* responsive: reduce padding on very small screens */
@media (max-width:320px){
  .volume-modal{ padding:8px }
  .volume-modal .vm-item{ padding:8px }
  .small-btn{ width:30px; height:30px }
}

</style>