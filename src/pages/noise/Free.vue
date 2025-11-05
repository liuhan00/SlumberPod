<template>
  <view class="page" :style="bgStyle">
    <view v-if="!hideTopbar" class="topbar">
      <button class="back" @click="goCreation">🎨</button>
      <text class="title" :style="{ color: textColor }">首页</text>
      <view class="actions">
        <button class="icon" @click="openSearch">🔍</button>
        <view v-if="player.currentTrack" class="playing-icon" @click="openPlayerQuick">
          <image class="cover" :src="player.currentTrack.cover" mode="aspectFill" />
          <view v-if="player.isPlaying" class="playing-indicator"></view>
        </view>
        <view v-else class="player-icon" @click="openPlayerQuick">
          <text class="icon">▶</text>
        </view>
      </view>
    </view>

    <AIHelper />

    <view class="tabs">
      <view v-for="c in categories" :key="c" :class="['tab', { active: c===activeCat }]" @click="activeCat=c">{{ c }}</view>
    </view>

    <scroll-view class="grid" scroll-y>
      <view class="item" v-for="n in filteredNoises" :key="n.id" @click="playRemote(n)">
        <!-- 取消图标，直接显示名称 -->
        <text class="name">{{ n.title || n.name || '未命名' }}</text>
      </view>
    </scroll-view>

    <view class="player-bar" v-if="playingList.length">
      <text>正在播放：{{ playingList.length }} 个声音</text>
    </view>

    <!-- 小色子与小框框播放器（底部浮窗） -->
    <view class="mini-player">
      <view class="mini-left">
        <button class="mini-dice" @click="randomizeMini">
          <text>🎲</text>
        </button>
      </view>
      <view class="mini-center">
        <view v-for="(n, idx) in randomNoises" :key="n?.id || idx" class="mini-box">
          <button class="mini-thumb" :class="{ on: isMiniPlaying(n?.id) }" @click="toggleMini(n)">
            <text class="icon">♪</text>
          </button>
          <text class="mini-name">{{ n?.title || n?.name || n?.audioName || '—' }}</text>
        </view>
      </view>
      <view class="mini-right">
        <button class="mini-play" @click="goToPlayer">
          <text v-if="anyPlaying">⮝</text>
          <text v-else>▶</text>
        </button>
      </view>
    </view>

    <!-- 播放详情浮窗（定时圆环） -->
    <view v-if="showDetail" class="detail-overlay" @click.self="closeDetail">
      <view class="detail-card">
        <view class="timer-circle" ref="circleRef">
          <svg viewBox="0 0 200 200" class="svg-wrap">
            <circle cx="100" cy="100" r="80" class="bg-ring" />
            <circle cx="100" cy="100" r="80" class="progress-ring" :stroke-dasharray="circumference" :stroke-dashoffset="circumference - (circumference * timerPercent)" />
            <!-- knob -->
            <circle :cx="knobX" :cy="knobY" r="8" class="knob" @touchstart.stop.prevent="startDrag" @touchmove.stop.prevent="onDrag" @touchend.stop.prevent="endDrag" />
          </svg>
          <text class="timer-text">{{ formattedRemaining }}</text>
        </view>
        <view class="detail-actions">
          <button class="btn" @click="startTimer">开始定时</button>
          <button class="btn" @click="cancelTimer">取消</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({ hideTopbar: { type: Boolean, default: false } })
import { ref, computed, onMounted, watch } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { useColorMode } from '@/composables/useColorMode'
import { allNoises } from '@/data/noises'
import { usePlayerStore } from '@/stores/player'
import * as apiAudios from '@/api/audios'
import AIHelper from '@/components/AIHelper.vue'

const { bgStyle } = useGlobalTheme()
const { colorMode } = useColorMode()
const player = usePlayerStore()
const textColor = computed(()=> colorMode.value === 'dark' ? '#ffffff' : '#222222')

const categories = ['全部','免费','雨声','自然','环境','我的创作']
const activeCat = ref('全部')
const playing = ref(new Set())

// mini player state
const randomNoises = ref([null,null,null])
const miniPlaying = ref(new Set())

const remoteList = ref([])

// 当 activeCat 变化，remoteList 已由之前的 watch 填充
// 现在我们让页面主体始终基于 remoteList（若为空且是我的创作或本地则回退到本地数据）
const filteredNoises = computed(()=>{
  // 我的创作仍优先使用本地创作
  if(activeCat.value==='我的创作'){
    const userCreations = uni.getStorageSync('userCreations') || []
    return userCreations.map(c=>({ id:c.id, title:c.name, audio_url:c.audioUrl || '', duration:c.duration || 0 }))
  }
  // 如果 remoteList 有数据，使用 remoteList（全部/免费/其他分类）
  if(Array.isArray(remoteList.value) && remoteList.value.length) return remoteList.value
  // 回退：全部 显示 allNoises 名称
  if(activeCat.value==='全部'){
    return allNoises.map(n=>({ id:n.id, title:n.name, audio_url:n.src || '', duration:n.duration || 0 }))
  }
  // 其他分类回退到本地过滤
  return allNoises.filter(n=> n.category===activeCat.value).map(n=>({ id:n.id, title:n.name, audio_url:n.src||'', duration:n.duration||0 }))
})

// remote loading state
const remoteLoading = ref(false)
const remoteError = ref('')

// 当切换标签时，从后端加载对应分类或全部音频名称（不显示封面，仅名称）
watch(activeCat, async (v)=>{
  remoteError.value = ''
  // my creations handled locally
  if(v === '我的创作') { remoteList.value = []; return }

  // map certain categories to backend category_id if needed
  const map = { '雨声': '22222222-2222-2222-2222-222222222222', '自然': '33333333-3333-3333-3333-333333333333', '环境':'44444444-4444-4444-4444-444444444444', '免费':'55555555-5555-5555-5555-555555555555' }
  const catId = map[v] || null

  remoteLoading.value = true
  try{
    // if catId is null and user selected 全部, call backend without category_id to get all
    const res = await apiAudios.getAudios(catId ? { category_id: catId, limit: 100 } : { limit: 200 })
    const raw = res && (res.data || res.items) ? (res.data || res.items) : (Array.isArray(res) ? res : [])
    const arr = Array.isArray(raw) ? raw : []
    // normalize to { id, title, audio_url, duration, category_id }
    remoteList.value = arr.map(it => ({ id: it.id || it._id || it.uuid || String(Date.now()), title: it.title || it.name || it.audioName || '', audio_url: it.audio_url || it.audioUrl || it.url || it.src || '', duration: it.duration || it.period || it.length || 0, category_id: it.category_id || it.categoryId || null }))
  }catch(e){ console.warn('load remote audios failed', e); remoteList.value = []; remoteError.value = e?.message || String(e) }
  finally{ remoteLoading.value = false }
})

function getNoiseIcon(name){
  const map = { '海浪':'🌊','雨声':'🌧️','壁炉':'🔥','树林':'🌲','地铁':'🚇' }
  return map[name] || '🎵'
}

function toggle(noise){
  // legacy list play toggles (not used by mini player)
  if(!noise) return
  if(playing.value.has(noise.id)){
    playing.value.delete(noise.id)
    player.stopById?.(noise.id)
  } else {
    playing.value.add(noise.id)
    player.play?.(noise)
  }
}

function isPlaying(id){ return playing.value.has(id) }
function isMiniPlaying(id){ return miniPlaying.value.has(id) }

// mini player actions
function randomizeMini(){
  // pick 3 random noises from filtered list
  const pool = filteredNoises.value
  const shuffled = [...pool].sort(()=>0.5 - Math.random())
  randomNoises.value = [shuffled[0]||null, shuffled[1]||null, shuffled[2]||null]
  // reset mini playing state
  miniPlaying.value.clear()
}

function toggleMini(noise){
  if(!noise) return
  const id = noise.id || noise._id || noise.uuid
  if(!id) return
  if(miniPlaying.value.has(id)){
    miniPlaying.value.delete(id)
    // stop one source if supported
    player.stopById?.(id)
  } else {
    miniPlaying.value.add(id)
    // add to player playlist if not exists
    const track = { id, name: noise.title || noise.name || noise.audioName || '未知', src: noise.audio_url || noise.audioUrl || noise.url || noise.src || '' }
    player.addToQueue?.(track)
    player.play?.(track)
  }
  // update player.title display (joined by |)
  updatePlayerTitleFromMini()
}

function openPlayerWithTracks(tracks){
  // tracks: array of { id, title/name, src }
  if(!Array.isArray(tracks) || tracks.length===0) return
  const normalized = tracks.map(t=>({ id: t.id, name: t.title || t.name || t.audioName || '未知', src: t.audio_url || t.src || t.url || '' }))
  // set playlist and play first
  player.setPlaylist?.(normalized)
  player.play?.(normalized[0])
  // set override title in player page via history state
  try{
    const titles = normalized.map(t=> t.name).filter(Boolean).join(' | ')
    // pass via query param or history state
    try{ uni.navigateTo({ url: `/pages/player/index?title=${encodeURIComponent(titles)}` }) }catch(e){ location.hash = `#/pages/player/index?title=${encodeURIComponent(titles)}` }
  }catch(e){}
}

function playRemote(a){
  const track = { id: a.id || a._id || a.uuid || String(Date.now()), name: a.title || a.name || a.audioName || '', src: a.audio_url || a.audioUrl || a.url || a.src || '' }
  // add to player store and start playing so player page finds currentTrack and src
  try{
    player.addToQueue?.(track)
    player.play?.(track)
  }catch(e){ console.warn('player play failed', e) }
  // navigate to player detail and let player page attach to currentTrack
  try{ uni.navigateTo({ url: `/pages/player/index?title=${encodeURIComponent(track.name)}` }) }catch(e){ location.hash = `#/pages/player/index?title=${encodeURIComponent(track.name)}` }
}

const anyPlaying = computed(()=> miniPlaying.value.size > 0)

// player title to show in player detail (joined names)
const playerTitle = ref('')

function updatePlayerTitleFromMini(){
  const ids = Array.from(miniPlaying.value)
  if(ids.length===0){ playerTitle.value = '' ; return }
  // find names from randomNoises or remoteList or allNoises
  const names = ids.map(id=>{
    const fromRandom = randomNoises.value.find(n=> n?.id===id)
    if(fromRandom) return fromRandom.title || fromRandom.name || fromRandom.audioName || ''
    const fromRemote = (remoteList.value||[]).find(r=> r.id===id)
    if(fromRemote) return fromRemote.title || fromRemote.name || ''
    const fromLocal = allNoises.find(l=> l.id===id)
    if(fromLocal) return fromLocal.name || ''
    return ''
  }).filter(Boolean)
  playerTitle.value = names.join(' | ')
}

// defensive: ensure remoteList is always array
if(!Array.isArray(remoteList.value)) remoteList.value = []

function togglePlayAll(){
  if(anyPlaying.value){
    // stop all
    for(const id of Array.from(miniPlaying.value)){
      player.stopById?.(id)
    }
    miniPlaying.value.clear()
  } else {
    // play all three
    for(const n of randomNoises.value){
      if(n && !miniPlaying.value.has(n.id)){
        miniPlaying.value.add(n.id)
        player.play?.(n)
      }
    }
  }
}

// expose detail control
function openDetail(){ showDetail.value = true }
function setDurationMinutes(m){ durationMinutes.value = m; remainingSeconds.value = m*60 }


function openSearch(){
  try{ uni.navigateTo({ url: '/pages/search/index' }) }catch(e){ location.hash='#/pages/search/index' }
}

// renamed to avoid conflict: openPlayerDetail
function openPlayerDetail(noise){
  try{ uni.navigateTo({ url: `/pages/player/index?id=${noise.id}` }) }catch(e){ location.hash = `#/pages/player/index?id=${noise.id}` }
}

function openPlayerQuick(){
  // go to player main page
  try{ uni.navigateTo({ url: '/pages/player/index' }) }catch(e){ location.hash = '#/pages/player/index' }
}

function goToPlayer(){
  // If miniPlaying has selections, build title from selected names; otherwise pass the three random names
  const ids = Array.from(miniPlaying.value)
  let title = ''
  if(ids.length){
    const names = ids.map(id=>{
      const fromRandom = randomNoises.value.find(n=> n && n.id===id)
      if(fromRandom) return fromRandom.title || fromRandom.name || fromRandom.audioName || ''
      const fromRemote = (remoteList.value||[]).find(r=> r.id===id)
      if(fromRemote) return fromRemote.title || fromRemote.name || ''
      const fromLocal = allNoises.find(l=> l.id===id)
      if(fromLocal) return fromLocal.name || ''
      return ''
    }).filter(Boolean)
    title = names.join(' | ')
  } else {
    // show the three currently displayed random noises
    const names = randomNoises.value.map(n=> n ? (n.title || n.name || n.audioName || '') : '').filter(Boolean)
    title = names.join(' | ')
  }

  const q = title ? `?title=${encodeURIComponent(title)}` : ''
  try{ uni.navigateTo({ url: `/pages/player/index${q}` }) }catch(e){ location.hash = `#/pages/player/index${q}` }
}

function goBack(){ try{ uni.navigateBack() }catch(e){ history.back() } }

function goCreation(){ try{ uni.navigateTo({ url: '/pages/creation/index' }) }catch(e){ location.hash = '#/pages/creation/index' } }

const playingList = computed(()=> Array.from(playing.value))

onMounted(()=>{ randomizeMini() })

// detail overlay state
const showDetail = ref(false)
const circleRef = ref(null)
const knobAngle = ref(0) // degrees
const durationMinutes = ref(30)
let timerId = null

const radius = 80
const circumference = 2 * Math.PI * radius
const timerPercent = computed(()=> (durationMinutes.value % 120) / 120)

const knobPos = computed(()=>{
  const angle = (knobAngle.value - 90) * (Math.PI/180)
  const x = 100 + radius * Math.cos(angle)
  const y = 100 + radius * Math.sin(angle)
  return { x, y }
})

const knobX = computed(()=> knobPos.value.x)
const knobY = computed(()=> knobPos.value.y)

const remainingSeconds = ref(durationMinutes.value * 60)
const formattedRemaining = computed(()=>{
  const mm = String(Math.floor(remainingSeconds.value/60)).padStart(2,'0')
  const ss = String(remainingSeconds.value%60).padStart(2,'0')
  return `${mm}:${ss}`
})

function onMiniPlayClick(){
  if(anyPlaying.value){
    // open detail overlay
    showDetail.value = true
  } else {
    togglePlayAll()
  }
}

function closeDetail(){ showDetail.value = false }

function startTimer(){
  // start countdown and stop playback when reaches 0
  remainingSeconds.value = durationMinutes.value * 60
  if(timerId) clearInterval(timerId)
  timerId = setInterval(()=>{
    remainingSeconds.value -= 1
    if(remainingSeconds.value <= 0){
      clearInterval(timerId); timerId = null
      // stop all mini playing
      for(const id of Array.from(miniPlaying.value)) player.stopById?.(id)
      miniPlaying.value.clear()
      showDetail.value = false
    }
  }, 1000)
}

function cancelTimer(){ if(timerId){ clearInterval(timerId); timerId=null } showDetail.value = false }

// drag handling
let dragging = false
function startDrag(e){ dragging = true }
function onDrag(e){ if(!dragging) return
  const touch = e.touches && e.touches[0]
  if(!touch) return
  const rect = (circleRef.value && (circleRef.value.getBoundingClientRect ? circleRef.value.getBoundingClientRect() : null)) || { left:0, top:0 }
  const cx = rect.left + 100; const cy = rect.top + 100
  const dx = touch.clientX - cx; const dy = touch.clientY - cy
  let ang = Math.atan2(dy, dx) * 180 / Math.PI + 90
  if(ang < 0) ang += 360
  knobAngle.value = ang
  durationMinutes.value = Math.round((ang / 360) * 120)
  remainingSeconds.value = durationMinutes.value * 60
}
function endDrag(e){ dragging=false }

</script>

<style scoped>
.page{ padding:12px 16px; min-height:100vh }
.topbar{ display:flex; align-items:center; justify-content:space-between; padding:8px 6px }
.back{ background:transparent; border:none; font-size:22px; position:relative; left:0 }
.title{ font-size:18px; font-weight:700; text-align:center; flex:1 }
.name, .title, .remote-name, .mini-name{ color: var(--text-color) !important }
.actions{ display:flex; gap:8px; min-width:110px; justify-content:flex-end }
.icon{ background:transparent; border:none; font-size:18px }

/* reuse home header player styles */
.playing-icon{ width:36px; height:36px; border-radius:6px; overflow:hidden; position:relative }
.playing-icon .cover{ width:100%; height:100% }
.playing-indicator{ position:absolute; right:0; bottom:0; width:10px; height:10px; background:var(--accent,#2EA56B); border-radius:999px; box-shadow:0 0 6px rgba(46,165,107,0.6) }
.player-icon{ width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.06); border-radius:6px }

.tabs{ display:flex; gap:8px; margin:12px 0 }
.tab{ padding:8px 12px; background:rgba(0,0,0,0.05); border-radius:18px }
.tab.active{ background:var(--accent, #2EA56B); color:#fff }

.grid{ display:grid !important; grid-template-columns: repeat(4, 1fr) !important; gap:14px 24px; grid-auto-flow: row; padding:12px 8px }
.grid .item{ display:block !important; width:100% }
@media (max-width:1200px){ .grid{ grid-template-columns: repeat(4, 1fr) !important; } }
@media (max-width:800px){ .grid{ grid-template-columns: repeat(3, 1fr) !important; } }
@media (max-width:480px){ .grid{ grid-template-columns: repeat(2, 1fr) !important; } }
.item{ display:flex; align-items:flex-start; padding:10px 14px; border-radius:12px; background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.02)); transition: background 0.18s, transform 0.12s }
.item:hover{ background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.04)); transform: translateY(-6px) }
.name{ font-size:14px; color:var(--text-color); line-height:1.6 }
.play-circle{ display:none }

.player-bar{ position:fixed; bottom:12px; left:16px; right:16px; background:rgba(255,255,255,0.06); padding:10px 12px; border-radius:12px; text-align:center }

/* mini player - floating style */
.mini-player{ position:fixed; left:50%; transform:translateX(-50%); bottom:12px; display:flex; align-items:center; gap:8px; background:rgba(20,24,28,0.7); padding:6px 8px; border-radius:12px; box-shadow:0 6px 14px rgba(0,0,0,0.45); backdrop-filter: blur(6px); max-width:520px; width: min(520px, calc(100% - 96px)); z-index:1200 }
.mini-dice{ width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:8px; background:rgba(255,255,255,0.06); border:none; color:var(--text-contrast) }
.mini-center{ display:flex; gap:8px; flex:1; justify-content:center }
.mini-box{ display:flex; flex-direction:column; align-items:center }
.mini-thumb{ width:44px; height:44px; border-radius:10px; background:transparent; display:flex; align-items:center; justify-content:center; border:none; color:var(--text-contrast); transition: transform .12s ease, box-shadow .12s ease, background-color .12s ease; }
.mini-thumb.on{ background:transparent; color:var(--text-contrast); box-shadow:none }
.mini-name{ font-size:12px; margin-top:6px; color:var(--text-contrast); max-width:120px; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }

/* remote list styles */
.remote-list{ display:flex; flex-direction:column; gap:8px; padding:8px }
.remote-item{ padding:8px 12px; border-radius:8px; background:transparent }
.remote-name{ color:var(--text-color) }
.remote-loading, .remote-error, .remote-empty{ padding:12px; color:var(--muted) }.mini-play{ width:44px; height:44px; border-radius:22px; background:rgba(255,255,255,0.06); border:none; display:flex; align-items:center; justify-content:center; color:#fff }

.detail-overlay{ position:fixed; left:0; top:0; right:0; bottom:0; display:flex; align-items:flex-end; justify-content:center; z-index:1300 }
.detail-card{ width:100%; max-width:720px; background:linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.7)); padding:36px; border-top-left-radius:18px; border-top-right-radius:18px; box-shadow:0 -10px 30px rgba(0,0,0,0.5) }
.timer-circle{ width:200px; height:200px; margin:0 auto; position:relative }
.svg-wrap{ width:100%; height:100% }
.bg-ring{ fill:none; stroke:rgba(255,255,255,0.06); stroke-width:6 }
.progress-ring{ fill:none; stroke:#fff; stroke-width:6; transform:rotate(-90deg); transform-origin:center }
.knob{ fill:#fff }
.timer-text{ position:absolute; left:0; right:0; top:86px; text-align:center; color:#fff; font-size:20px }
.detail-actions{ display:flex; gap:12px; justify-content:center; margin-top:18px }
.btn{ background:rgba(255,255,255,0.06); color:#fff; padding:10px 16px; border-radius:10px; border:none }
/* 字体与对比度优化 */
.mini-dice{ font-size:16px; }
.mini-name{ font-size:14px; color:#eef3ff; }
/* default variable fallback removed - using inline styles for compatibility */
.mini-name{ color:var(--text-color); font-weight:500; font-size:14px; -webkit-font-smoothing:antialiased }
</style>
