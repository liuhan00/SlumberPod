<template>
  <view class="page" :style="bgStyle" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
    <!-- Top small bar -->
    <view class="topbar">
      <button class="collapse" @click="uni.navigateBack()">˅</button>
      <button class="share">⤴</button>
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
        <view style="display:flex;align-items:center;gap:8px">
          <button class="favorite-btn" @click="toggleFav">
            <text v-if="isFav">❤️</text>
            <text v-else>🤍</text>
          </button>
          <button class="meta-btn" @click="openMetaPopup()">⋯</button>
        </view>
      </view>
      <text class="author text-contrast">{{ displayNames }}</text>
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
    auth?.id ||
    auth?.user?.id ||
    auth?.userId ||
    auth?.user?.userId ||
    auth?.token ||
    auth?.access_token
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
  try {
    await favStore.toggle(track.value)
    uni.showToast({
      title: wasFav ? '已取消收藏' : '收藏成功',
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

// Play mode modal
const showPlayModeModal = ref(false)
const timerMinutes = ref(0)
const customTimerMinutes = ref('')

// meta popup state
const showMeta = ref(false)
const metaData = ref(null)
const metaMulti = ref([])
const metaLoading = ref(false)

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

async function openMetaPopup(id){
  showMeta.value = true; metaLoading.value = true; metaData.value = null; metaMulti.value = []
  const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.43.89:3003'
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
        try{ if(typeof target.src === 'string' && target.src && !/oss\.example\.com/i.test(target.src)){ audioCtx.src = target.src } else { console.warn('skip invalid audio domain', target?.src); uni.showToast({ title:'音频资源不可用', icon:'none' }) } }catch(e){ console.warn('set src failed', e); uni.showToast({ title:'音频地址无效', icon:'none' }) }
        store.durationMs = 180000
      }
    } else if (store.currentTrack) {
      try{ const u = store.currentTrack?.src; if(typeof u === 'string' && u && !/oss\.example\.com/i.test(u)){ audioCtx.src = u } else { console.warn('skip invalid audio domain', u); uni.showToast({ title:'音频资源不可用', icon:'none' }) } }catch(e){ console.warn('set src failed', e) }
    }
  }catch(e){ console.warn('audio init failed', e) }
})

onUnload(()=>{
  try { audioCtx?.stop(); audioCtx?.destroy() } catch(e) {}
})

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
})

function openCozeChat(){
  const url = encodeURIComponent('https://www.coze.cn/store/agent/7568816236197363712?bot_id=true')
  uni.navigateTo({ url: `/pages/chat/Webview?url=${url}` })
}
</script>
<style scoped>
.page{ min-height:100vh; padding-bottom: 24px; position:relative; /* use theme background from bgStyle */ }
.topbar{ display:flex; justify-content:space-between; align-items:center; padding:12px 16px; position:relative }
.collapse, .share{ background:transparent; border:none; color:inherit; font-size:18px }
.collapse{ position:absolute; left:12px; top:12px }
.share{ position:absolute; right:12px; top:12px }

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
.favorite-btn{ background: transparent; border: none; font-size: 24px; padding: 8px; margin-left: 12px; }
.author{ margin-top:6px; color: var(--text-primary) }
.tags{ display:flex; gap:10px; padding:8px 16px }
.tag{ background:var(--card-bg, rgba(255,255,255,0.9)); color: var(--card-fg, #13303f); padding:6px 8px; border-radius:8px; box-shadow: 0 4px 12px var(--shadow, rgba(0,0,0,0.06)); opacity:0.95 }
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
.actions .icon, .ctrl, .playlist-btn{ background: var(--input-bg, #f1f8ff); color: var(--card-fg, #13303f) }


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
</style>
