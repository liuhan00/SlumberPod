<template>
  <view class="page" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
    <!-- Top small bar -->
    <view class="topbar">
      <button class="collapse" @click="uni.navigateBack()">˅</button>
      <button class="share">⤴</button>
    </view>

    <!-- Circular timer UI -->
    <view class="timer-wrap">
      <svg viewBox="0 0 300 300" class="timer-svg" ref="svgRef">
        <!-- outer ring -->
        <circle cx="150" cy="150" r="110" class="ring-bg" />
        <circle cx="150" cy="150" r="110" class="ring-progress" :stroke-dasharray="circumference" :stroke-dashoffset="circumference - (circumference * timerPercent)" />
        <!-- tick marks & numbers -->
        <g class="ticks">
          <circle cx="150" cy="40" r="3" class="tick" />
          <text x="150" y="30" class="tick-label">120</text>
          <circle cx="238" cy="150" r="3" class="tick" />
          <text x="250" y="154" class="tick-label">30</text>
          <circle cx="150" cy="260" r="3" class="tick" />
          <text x="150" y="275" class="tick-label">60</text>
          <circle cx="62" cy="150" r="3" class="tick" />
          <text x="38" y="154" class="tick-label">90</text>
          <!-- infinity at top center -->
          <text x="150" y="18" class="tick-label">∞</text>
        </g>

        <!-- three layered triangles -->
                <g class="triangles" transform="translate(150,150)">
          <!-- enlarged triangles -->
          <polygon points="0,-70 60,35 -60,35" class="tri tri1" />
          <polygon points="0,-110 95,60 -95,60" class="tri tri2" />
          <polygon points="0,-150 130,85 -130,85" class="tri tri3" />
        </g>

        <!-- outer ring with tick marks -->
        <g class="ring-group" transform="translate(150,150)">
          <circle cx="0" cy="0" r="120" class="outer-ring-bg" />
          <circle cx="0" cy="0" r="120" class="outer-ring-progress" :stroke-dasharray="ringCircumference" :stroke-dashoffset="ringCircumference - (ringCircumference * (knobAngle.value/360))" />
          <!-- ticks -->
          <g v-for="(label, idx) in ringLabels" :key="idx" :transform="`rotate(${label.angle}) translate(0 -120)`">
            <circle cx="0" cy="0" r="2" class="tick" />
            <text x="0" y="-12" class="tick-label">{{ label.text }}</text>
          </g>
        </g>

        <!-- knob on outer ring -->
        <circle :cx="ringKnobX" :cy="ringKnobY" r="10" class="knob" @touchstart.stop.prevent="startDrag" @touchmove.stop.prevent="onDrag" @touchend.stop.prevent="endDrag" @mousedown.stop.prevent="startDragMouse" @mousemove.stop.prevent="onDragMouse" @mouseup.stop.prevent="endDragMouse" />
      </svg>
      <text class="timer-center" v-if="true">{{ formattedRemaining }}</text>

    </view>

    <!-- meta area -->
    <view class="meta">
      <view class="title-row">
        <text class="fixed-label">白噪音</text>
        <button class="favorite-btn" @click="toggleFav">
          <text v-if="isFav">❤️</text>
          <text v-else>🤍</text>
        </button>
      </view>
      <text class="author">{{ displayNames }}</text>
    </view>

    <!-- small tags -->
    <view class="tags">
      <text class="tag">音量</text>
      <text class="tag">标注</text>
      <text class="tag">音效</text>
    </view>

    <!-- controls -->
    <view class="controls">
      <button class="ctrl" @click="showPlayModeModal = true">{{ getLoopIcon() }}</button>
      <button class="ctrl" @click="prev">◀◀</button>
      <button class="play-btn" @click="toggle">{{ store.isPlaying ? '⏸' : '▶' }}</button>
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

    <!-- Play Mode Modal -->
    <view class="modal-overlay" v-if="showPlayModeModal" @click="showPlayModeModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">播放设置</text>
          <button class="modal-close" @click="showPlayModeModal = false">×</button>
        </view>
        
        <!-- Play Mode Options -->
        <view class="modal-section">
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
        <view class="modal-section">
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

const store = usePlayerStore()
const historyStore = useHistoryStore()
const favStore = useFavoritesStore(); favStore.load()
historyStore.load()
const track = computed(()=> store.currentTrack)
const isFav = computed(()=> !!track.value && favStore.items.some(x=>x.id===track.value.id))

async function toggleFav(){ 
  if(!track.value) return; 
  
  // 检查用户是否登录
  const auth = getAuthLocal()
  if(!auth?.id && !auth?.user?.id) {
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
  
  try {
    await favStore.toggle(track.value)
    uni.showToast({
      title: isFav.value ? '已取消收藏' : '收藏成功',
      icon: 'success',
      duration: 1000
    })
  } catch (error) {
    console.error('收藏操作失败:', error)
    uni.showToast({
      title: '操作失败，请重试',
      icon: 'none',
      duration: 2000
    })
  }
}

// three selected noises (for triangle corners)
const threeTracks = ref([null,null,null])
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

n  // compute center and scale based on SVG (300x300 viewBox)
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



// timer UI state
const svgRef = ref(null)
const radius = 120
const circumference = 2 * Math.PI * radius
const ringCircumference = circumference
const knobAngle = ref(0)
const durationMinutes = ref(30)
const remainingSeconds = ref(durationMinutes.value*60)
const timerPercent = computed(()=> (knobAngle.value % 360) / 360)
const formattedRemaining = computed(()=>{
  const mm = String(Math.floor(remainingSeconds.value/60)).padStart(2,'0')
  const ss = String(remainingSeconds.value%60).padStart(2,'0')
  return `${mm}:${ss}`
})
const knobPos = computed(()=>{
  const ang = (knobAngle.value - 90) * (Math.PI/180)
  const x = 150 + radius * Math.cos(ang)
  const y = 150 + radius * Math.sin(ang)
  return { x, y }
})
const knobX = computed(()=> knobPos.value.x)
const knobY = computed(()=> knobPos.value.y)

// ring knob coordinates for outer ring (use radius)
const ringKnobPos = computed(()=>{
  const ang = (knobAngle.value - 90) * (Math.PI/180)
  const x = 150 + radius * Math.cos(ang)
  const y = 150 + radius * Math.sin(ang)
  return { x, y }
})
const ringKnobX = computed(()=> ringKnobPos.value.x)
const ringKnobY = computed(()=> ringKnobPos.value.y)

const ringLabels = [ { angle:0, text:'∞' }, { angle:60, text:'120' }, { angle:120, text:'90' }, { angle:180, text:'60' }, { angle:240, text:'30' }, { angle:300, text:'0' } ]


let timerId = null
let dragging = false
const showTime = ref(false)
let hideTimeout = null
let startPoint = null

// Play mode modal
const showPlayModeModal = ref(false)
const timerMinutes = ref(0)
const customTimerMinutes = ref('')

// 下滑返回相关
const touchStartY = ref(0)
const touchMoveY = ref(0)
const isDragging = ref(false)

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
function getLoopIcon() {
  switch(store.loopMode) {
    case 'one': return '①'
    case 'all': return '🔁'
    case 'off': return '→'
    default: return '①'
  }
}

// Set loop mode
function setLoopMode(mode) {
  store.setLoopMode(mode)
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
  showPlayModeModal.value = false
}

// Set custom timer
function setCustomTimer() {
  const minutes = parseInt(customTimerMinutes.value)
  if (minutes && minutes >= 1 && minutes <= 120) {
    setTimer(minutes)
    customTimerMinutes.value = ''
  }
}

function startDrag(e){ 
  e.preventDefault?.();
  dragging = true; 
  if(hideTimeout) clearTimeout(hideTimeout); 
  startPoint = e && e.touches && e.touches[0] ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; 
}
function startDragMouse(e){ 
  e.preventDefault?.();
  dragging = true; 
  if(hideTimeout) clearTimeout(hideTimeout); 
  startPoint = { x: e.clientX, y: e.clientY } 
}

function toggleCorner(idx){ const n = threeTracks.value[idx]; if(!n) return; // toggle individual play
  const exists = store.playlist.some(t=>t.id===n.id)
  if(!exists) store.addToQueue(n)
  // play single track
  store.play(n)
}
function onDrag(e){ 
  if(!dragging) return; 
  try{ e.preventDefault?.(); }catch(_e){}
  showTime.value = true; 
  const touch = e.touches && e.touches[0]; 
  if(!touch) return; 
  const rect = svgRef.value?.getBoundingClientRect?.() || { left:0, top:0, width:300, height:300 }; 
  const cx = rect.left + (rect.width/2); 
  const cy = rect.top + (rect.height/2); 
  const dx = touch.clientX - cx; 
  const dy = touch.clientY - cy; 
  let ang = Math.atan2(dy, dx) * 180 / Math.PI + 90; 
  if(ang < 0) ang += 360; 
  knobAngle.value = ang; 
  durationMinutes.value = Math.round((ang / 360) * 120); 
  remainingSeconds.value = durationMinutes.value * 60 
}
function onDragMouse(e){ 
  if(!dragging) return; 
  e.preventDefault?.();
  showTime.value = true; 
  const rect = svgRef.value?.getBoundingClientRect?.() || { left:0, top:0, width:300, height:300 }; 
  const cx = rect.left + (rect.width/2); 
  const cy = rect.top + (rect.height/2); 
  const dx = e.clientX - cx; 
  const dy = e.clientY - cy; 
  let ang = Math.atan2(dy, dx) * 180 / Math.PI + 90; 
  if(ang < 0) ang += 360; 
  knobAngle.value = ang; 
  durationMinutes.value = Math.round((ang / 360) * 120); 
  remainingSeconds.value = durationMinutes.value * 60 
}
function endDrag(e){ 
  try{ e.preventDefault?.(); }catch(_e){}
  dragging=false; 
  // if already playing, start the countdown based on selected duration
  try{ if(store.isPlaying){ durationMinutes.value = Math.max(0, Math.min(120, durationMinutes.value)); remainingSeconds.value = durationMinutes.value * 60; startTimer(); } }catch(_e){}
  if(hideTimeout) clearTimeout(hideTimeout); 
  hideTimeout = setTimeout(()=>{ showTime.value = false; hideTimeout = null }, 800)
}
function endDragMouse(e){ 
  try{ e.preventDefault?.(); }catch(_e){}
  dragging=false; 
  try{ if(store.isPlaying){ durationMinutes.value = Math.max(0, Math.min(120, durationMinutes.value)); remainingSeconds.value = durationMinutes.value * 60; startTimer(); } }catch(_e){}
  if(hideTimeout) clearTimeout(hideTimeout); 
  hideTimeout = setTimeout(()=>{ showTime.value = false; hideTimeout = null }, 800)
}

function startTimer(){ if(timerId) clearInterval(timerId); remainingSeconds.value = durationMinutes.value*60; timerId = setInterval(()=>{ remainingSeconds.value -=1; if(remainingSeconds.value <=0){ clearInterval(timerId); timerId=null; // stop playback and close page
      store.pause(); try{ uni.navigateBack() }catch(e){ /* no-op */ }
    } }, 1000) }
function cancelTimer(){ if(timerId){ clearInterval(timerId); timerId=null } }

let audioCtx

onLoad((query)=>{
  // read optional title override from query
  if(query?.title){
    try{ playlistTitleOverride.value = decodeURIComponent(query.title) }catch(e){ playlistTitleOverride.value = query.title }
  }

  audioCtx = uni.createInnerAudioContext()
  audioCtx.autoplay = false
  audioCtx.obeyMuteSwitch = false
  audioCtx.src = ''

  audioCtx.onCanplay(()=>{
    try{ if (audioCtx.duration) store.durationMs = audioCtx.duration * 1000 }catch(e){}
    try{ if (store.isPlaying) audioCtx.play() }catch(e){}
  })
  audioCtx.onTimeUpdate(()=>{
    try{ store.positionMs = audioCtx.currentTime * 1000 }catch(e){}
  })
  audioCtx.onEnded(()=>{
    try{ store.isPlaying = false }catch(e){}
  })
  audioCtx.onError((err)=>{
    try{
      console.warn('audioCtx error', err)
      uni.showToast({ title:'音频加载失败，请检查网络或更换音源', icon:'none' })
      store.isPlaying = false
    }catch(e){}
  })

  try{
    if(query?.id){
      const target = allNoises.find(n=>n.id===query.id)
      if(target){
        store.setPlaylist(allNoises)
        store.play(target)
        historyStore.add(target)
        try{ audioCtx.src = target.src }catch(e){ console.warn('set src failed', e); uni.showToast({ title:'音频地址无效', icon:'none' }) }
        store.durationMs = 180000
      }
    } else if (store.currentTrack) {
      try{ audioCtx.src = store.currentTrack.src }catch(e){ console.warn('set src failed', e) }
    }
  }catch(e){ console.warn('audio init failed', e) }
})

onUnload(()=>{
  try { audioCtx?.stop(); audioCtx?.destroy() } catch(e) {}
})
function toggle(){
  if (!store.currentTrack) return
  if (store.isPlaying) { fadePause() }
  else { fadePlay() }
}
async function fadePlay(){
  store.play()
  audioCtx.volume = 0
  audioCtx.play()
  await rampVolume(store.volume, 400)
}
async function fadePause(){
  await rampVolume(0, 400)
  audioCtx.pause()
  store.pause()
}
function rampVolume(target, ms){
  return new Promise(resolve=>{
    const steps = 10
    const start = audioCtx.volume
    const delta = (target-start)/steps
    let i=0
    const id = setInterval(()=>{
      i++
      audioCtx.volume = Math.max(0, Math.min(1, start + delta*i))
      if(i>=steps){ clearInterval(id); resolve() }
    }, ms/steps)
  })
}

function seek(ms){
  store.seek(ms)
  audioCtx.seek(ms/1000)
}
function setVolume(v){
  store.setVolume(v)
  audioCtx.volume = store.volume
}
function muteToggle(){
  store.toggleMute()
  audioCtx.volume = store.volume
}
function toggleLoop(){
  const nextMode = store.loopMode==='all' ? 'one' : store.loopMode==='one' ? 'off' : 'all'
  store.setLoopMode(nextMode)
}
function prev(){
  store.prev()
  if (store.currentTrack) { historyStore.add(store.currentTrack); audioCtx.src = store.currentTrack.src; fadePlay() }
}
function next(){
  store.next()
  if (store.currentTrack) { historyStore.add(store.currentTrack); audioCtx.src = store.currentTrack.src; fadePlay() }
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
  uni.switchTab({ url: '/pages/home/index' })
}

watch(()=>store.volume, v=>{ if(audioCtx) audioCtx.volume = v })

onMounted(()=>{
  // initialize knob position from durationMinutes and pick three random noises from playlist
  knobAngle.value = (durationMinutes.value/120) * 360
  const pool = store.playlist.length ? store.playlist : allNoises
  const shuffled = [...pool].sort(()=>0.5 - Math.random())
  threeTracks.value = [shuffled[0]||null, shuffled[1]||null, shuffled[2]||null]
  // compute triangle icon positions after render
  setTimeout(updateTriPositions, 120)
  try{ if(typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('resize', updateTriPositions) }catch(e){}
})
</script>
<style scoped>
.page{ min-height:100vh; padding-bottom: 24px; background: var(--bg-color); background-image: var(--bg-gradient); background-repeat: no-repeat; background-size: 100% 100%; color: var(--text-color); }
.topbar{ display:flex; justify-content:space-between; align-items:center; padding:10px 12px; position:relative }
.collapse, .share{ background:transparent; border:none; color:var(--text-color); font-size:18px }
.collapse{ position:absolute; left:12px; top:10px }
.share{ position:absolute; right:12px; top:10px }

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
.timer-wrap{ padding:28px 0; display:flex; flex-direction:column; align-items:center }
.timer-svg{ width:300px; height:300px }
.ring-bg{ fill:none; stroke:rgba(255,255,255,0.08); stroke-width:6 }
.ring-progress{ fill:none; stroke:#fff; stroke-width:6; transform:rotate(-90deg); transform-origin:center; transition: stroke-dashoffset 300ms linear }
.knob{ fill:#fff; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.35)) }
.timer-center{ position:absolute; left:0; right:0; top:50%; transform:translateY(-50%); font-size:28px; color:#fff; text-align:center; font-weight:700 }
.timer-wrap{ height:420px; position:relative; display:flex; align-items:center; justify-content:center }
.triangle-icons{ position:absolute; left:0; top:0; right:0; bottom:0; pointer-events:none }
.tri-icon{ position:absolute; display:flex; flex-direction:column; align-items:center; pointer-events:auto }
.tri-btn{ width:44px; height:44px; border-radius:22px; background:#fff; display:flex; align-items:center; justify-content:center; border:none }
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
.triangles .tri{ fill:rgba(255,255,255,0.04) }
.triangles .tri2{ fill:rgba(255,255,255,0.06) }
.triangles .tri3{ fill:rgba(255,255,255,0.08) }
.icons-row{ display:flex; justify-content:space-between; padding:12px 36px }
.icon-left, .icon-right{ color:#fff; opacity:0.8 }
.meta{ padding: 18px 16px }
.title-row{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.fixed-label{ font-size:24px; font-weight:800; color: var(--text-primary); }
.name{ font-size:20px; color:#fff; font-weight:700 }
.favorite-btn{ background: transparent; border: none; font-size: 24px; padding: 8px; margin-left: 12px; }
.author{ margin-top:6px; color: var(--text-primary) }
.tags{ display:flex; gap:10px; padding:8px 16px }
.tag{ background:rgba(255,255,255,0.06); color:#fff; padding:6px 8px; border-radius:8px }
.controls{ display:flex; align-items:center; justify-content:space-around; padding:18px 36px }
.play-btn{ width:72px; height:72px; border-radius:36px; background:#fff; color: var(--text-primary); display:flex; align-items:center; justify-content:center; font-size:26px }
.ctrl{ background:transparent; border:none; color:#fff }

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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.playlist-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.playlist-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  padding: 4px;
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

/* Modal Styles */
.modal-overlay{ position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000 }
.modal-content{ background:#2a3a3a; border-radius:16px; padding:20px; width:320px; max-width:90vw; max-height:80vh; overflow-y:auto }
.modal-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:20px }
.modal-title{ font-size:18px; font-weight:600; color:#fff }
.modal-close{ background:none; border:none; color:#fff; font-size:24px; width:30px; height:30px; display:flex; align-items:center; justify-content:center }

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
</style>
