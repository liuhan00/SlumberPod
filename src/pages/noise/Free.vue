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

    <view class="tabs-wrap">
      <view class="tabs-scroll" ref="tabsRef">
        <view v-for="c in categories" :key="c.id || c._id || c.uuid" :class="['tab', { active: c.id===activeCat }]" @click="activeCat=c.id">{{ c.name }}</view>
      </view>
      <button class="tabs-arrow" v-if="showArrow" @click="scrollTabsRight">›</button>
    </view>

    <scroll-view class="grid" scroll-y enable-flex>
      <view class="item" v-for="(n, idx) in filteredNoises" :key="`${n?.id||n?._id||n?.uuid||'item'}-${idx}`" @click="playRemote(n)">
        <!-- 卡片：可扩展成带封面 -->
        <text class="name">{{ n.title || n.name || '未命名' }}</text>
      </view>
    </scroll-view>

    <view class="player-bar" v-if="playingList.length">
      <text>正在播放：{{ playingList.length }} 个声音</text>
    </view>

    <!-- 小色子与小框框播放器（底部浮窗） -->
    <view class="mini-player">
      <view class="mini-left">
        <button class="mini-dice" @click="randomizeMini" :disabled="isRandomizing">
          <view v-if="isRandomizing" class="cat-animation">🐱</view>
          <text v-else>🎲</text>
        </button>
      </view>
      <view class="mini-center">
        <view v-for="(n, idx) in randomNoises" :key="idx" class="mini-box">
          <button class="mini-thumb" :class="{ on: isMiniPlayingItem(n) }" @click="toggleMini(n)">
            <text class="icon">♪</text>
            <view v-if="isMiniPlayingItem(n)" class="mini-dot"></view>
          </button>
          <text class="mini-name" :class="{ on: isMiniPlayingItem(n) }" @click="toggleMini(n)">{{ n?.title || n?.name || n?.audioName || '—' }}</text>
        </view>
      </view>
      <view class="mini-right">
        <button class="mini-play" @click="goToPlayer">
          <image :src="anyPlaying ? '/static/arrow_active.png' : '/static/arrow.png'" mode="widthFix" style="width:22px;height:22px" />
        </button>
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

const categories = ref([{ id: 'all', name: '全部' }])
const activeCat = ref('all')

const tabsRef = ref(null)
const showArrow = ref(false)

// load categories from backend
async function fetchCategories(){
  try{
    const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.150:3003'
    // 小程序运行时可能不支持 new URL，因此使用字符串拼接
    // 添加分页参数以获取所有分类
    const url = BASE + '/api/categories?limit=1000'
    console.log('[api/categories] GET', url)
    let j = null
    if (typeof fetch === 'function'){
      const res = await fetch(url)
      try{ j = await res.json() }catch(e){ console.warn('[api/categories] fetch parse json failed', e); j = res }
    } else {
      // fallback to uni.request
      j = await new Promise((resolve, reject)=>{
        try{
          uni.request({ url, method:'GET', success(r){ console.log('[api/categories] uni.request success', r); resolve(r.data) }, fail(err){ console.warn('[api/categories] uni.request fail', err); reject(err) } })
        }catch(e){ reject(e) }
      })
    }
    const items = Array.isArray(j) ? j : (j.data || j.items || [])
    // 获取所有分类（包括子分类），按 sort_order 排序
    const allCategories = items.sort((a,b)=> (b.sort_order||0)-(a.sort_order||0))
    // 显示所有分类（包括子分类），如果只想显示顶级分类，使用下面的代码
    // const top = allCategories.filter(it=>Number(it.parent_id)===0)
    const top = allCategories // 显示所有分类
    // build list: 全部 + 免费(if exists) + top categories
    const out = [{ id:'all', name:'全部' }]
    // add a "免费" tab if any category is marked free in backend — insert at position 1 (after 全部)
    const hasFree = items.some(it=> Number(it.is_free)===1)
    if(hasFree){ if(!out.find(x=>x.id==='free')) out.splice(1,0,{ id:'free', name:'免费' }) } else {
      // fallback: still insert '免费' for testing if not present (remove this if you don't want default)
      if(!out.find(x=>x.id==='free')) out.splice(1,0,{ id:'free', name:'免费' })
    }
    top.forEach(t=> out.push({ id: String(t.category_id || t.id), name: t.name }))
    out.push({ id:'mine', name:'我的创作' })
    categories.value = out
    console.log('[Free] categories tabs built', categories.value)

    // check if overflow
    setTimeout(()=>{
      try{
        const el = tabsRef.value && tabsRef.value.$el ? tabsRef.value.$el : tabsRef.value
        if(el && el.scrollWidth && el.clientWidth && el.scrollWidth > el.clientWidth + 8) showArrow.value = true
      }catch(e){}
    }, 80)

  }catch(e){ console.warn('fetch categories failed', e); categories.value = [{ id:'all', name:'全部' }, { id:'free', name:'免费' }, { id:'mine', name:'我的创作' }, { id:'nature', name:'自然' }, { id:'life', name:'生活' }, { id:'weather', name:'天气' }, { id:'rain', name:'雨声' }, { id:'forest', name:'森林' }, { id:'coffee', name:'咖啡' }, { id:'fireplace', name:'壁炉' }, { id:'thunder', name:'雷雨' }, { id:'stream', name:'溪流' }, { id:'birds', name:'鸟鸣' }] }
}

function scrollTabsRight(){
  try{
    const el = tabsRef.value && tabsRef.value.$el ? tabsRef.value.$el : tabsRef.value
    if(!el) return
    el.scrollBy({ left: el.clientWidth - 40, behavior: 'smooth' })
  }catch(e){
    // fallback: change active to next
    const idx = categories.value.findIndex(c=> c.id===activeCat.value)
    if(idx >= 0 && idx < categories.value.length - 1) activeCat.value = categories.value[idx+1].id
  }
}

onMounted(()=>{ fetchCategories(); randomizeMini(); // 组件加载时立即根据当前分类请求音频，避免用户未切换时不发起请求
  try{ loadAudiosForCategory(activeCat.value) }catch(e){ console.warn('initial loadAudiosForCategory failed', e) }
})
const playing = ref(new Set())

// mini player state
const randomNoises = ref([null,null,null])
const miniPlaying = ref(new Set())
const isRandomizing = ref(false)

const remoteList = ref([])

// debug: log remoteList contents when updated to help diagnose duplicate IDs / count mismatch
watch(remoteList, (val)=>{
  try{
    console.log('[Free] remoteList updated length', Array.isArray(val)?val.length:0)
    console.log('[Free] remoteList ids', Array.isArray(val)? val.map(i=>({id:i?.id, _id:i?._id, uuid:i?.uuid, is_free:i?.is_free})) : val)
  }catch(e){ console.warn('[Free] remoteList watch log failed', e) }
})

// 当 activeCat 变化，remoteList 已由之前的 watch 填充
// 现在我们让页面主体始终基于 remoteList（若为空且是我的创作或本地则回退到本地数据）
const filteredNoises = computed(()=>{
  // 我的创作仍优先使用本地创作
  if(activeCat.value==='我的创作'){
    // 优先使用远端“我的创作”列表，若为空再回退本地存储
    if(Array.isArray(remoteList.value) && remoteList.value.length) return remoteList.value
    const userCreations = uni.getStorageSync('userCreations') || []
    return userCreations.map(c=>({ id:c.id, title:c.name, audio_url:c.audioUrl || '', duration:c.duration || 0 }))
  }
  // 如果 remoteList 有数据，优先使用 remoteList（远端返回的已按 category/is_free 筛选）
  if(Array.isArray(remoteList.value) && remoteList.value.length) return remoteList.value
  // 回退：全部 显示 allNoises 名称
  if(activeCat.value==='全部'){
    return allNoises.map(n=>({ id:n.id, title:n.name, audio_url:n.src || '', duration:n.duration || 0 }))
  }
  // 免费回退：从本地数据筛选 is_free 字段为 1 的项（如果本地数据没有该字段则为空）
  if(activeCat.value==='free' || activeCat.value==='免费'){
    return allNoises.filter(n=> Number(n.is_free)===1 || Number(n.free)===1).map(n=>({ id:n.id, title:n.name, audio_url:n.src||'', duration:n.duration||0 }))
  }
  // 其他分类回退到本地过滤（category 字段可能是 id 或名称）
  return allNoises.filter(n=> String(n.category)===String(activeCat.value) || String(n.category_id)===String(activeCat.value)).map(n=>({ id:n.id, title:n.name, audio_url:n.src||'', duration:n.duration||0 }))
})

// remote loading state
const remoteLoading = ref(false)
const remoteError = ref('')

// helper: load audios for a given category id (or all)
async function loadAudiosForCategory(catId){
  remoteError.value = ''
  if(catId === 'mine' || catId === 'my' || catId === '我的创作') { 
    remoteLoading.value = true
    try{
      // 使用需要 JWT 的后端接口 /api/creations
      const res = await apiAudios.getMyCreations({ limit: 1000, offset: 0 })
      const raw = res && (res.data || res.items) ? (res.data || res.items) : (Array.isArray(res) ? res : [])
      const arr = Array.isArray(raw) ? raw : []
      const seen = new Set(); const deduped = []
      for(const it of arr){ const key = it?.id || it?._id || it?.uuid || null; const uid = key ? String(key) : null; if(uid && seen.has(uid)) continue; if(uid) seen.add(uid); deduped.push(it) }
      remoteList.value = deduped.map(it => ({ id: it.id || it._id || it.uuid || String(Date.now()), backend_id: (it.id ?? it._id ?? it.uuid ?? it.audio_id ?? null), title: it.title || it.name || it.audioName || '', audio_url: it.file_url || it.audio_url || it.audioUrl || it.url || it.src || '', duration: it.duration || it.period || it.length || 0, category_id: it.category_id || it.categoryId || 'my_creations' }))
    }catch(e){ console.warn('load my creations failed', e); remoteList.value = [] }
    finally{ remoteLoading.value = false }
    return 
  }
  remoteLoading.value = true
  console.log('[Free] loadAudiosForCategory start', catId)
  try{
    const isFree = (catId === 'free')
    const isAllLike = (catId === 'all')
    // 后端新约定：category_id='free' 查询免费；数字为分类；不传为全部
    const params = isFree ? { category_id: 'free', limit: 1000 } : (isAllLike ? { limit: 1000 } : { category_id: catId, limit: 1000 })
    console.log('[Free] calling apiAudios.getAudios with', params)
    const res = await apiAudios.getAudios(params)
    console.log('[Free] apiAudios.getAudios response', res)
    const raw = res && (res.data || res.items) ? (res.data || res.items) : (Array.isArray(res) ? res : [])
    const arr = Array.isArray(raw) ? raw : []
    // preserve original for debugging
    const originalArr = arr.map(it=>({...it}))
    console.log('[Free] raw items length', Array.isArray(originalArr)? originalArr.length : 0)
    console.log('[Free] raw items sample ids', originalArr.map(i=>({ id:i?.id, _id:i?._id, uuid:i?.uuid, category_id:i?.category_id })))
    // dedupe by id/_id/uuid - keep first occurrence
    const seen = new Set()
    const deduped = []
    for(const it of arr){
      const key = it?.id || it?._id || it?.uuid || null
      const uid = key ? String(key) : null
      if(uid && seen.has(uid)) continue
      if(uid) seen.add(uid)
      deduped.push(it)
    }
    // map to normalized shape
    remoteList.value = deduped.map(it => ({ id: it.id || it._id || it.uuid || String(Date.now()), backend_id: (it.id ?? it._id ?? it.uuid ?? it.audio_id ?? null), title: it.title || it.name || it.audioName || '', audio_url: it.audio_url || it.audioUrl || it.url || it.src || '', duration: it.duration || it.period || it.length || 0, category_id: it.category_id || it.categoryId || null }))
    console.log('[Free] remoteList length (deduped)', remoteList.value.length)
    console.log('[Free] deduped ids', remoteList.value.map(i=>({id:i.id})))
  }catch(e){ console.warn('load remote audios failed', e); remoteList.value = []; remoteError.value = e?.message || String(e) }
  finally{ remoteLoading.value = false }
}

// 当切换标签时，调用统一的加载函数
watch(activeCat, (v)=>{ loadAudiosForCategory(v) })

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
function getStableId(item){
  if(!item) return ''
  // 优先使用 URL（通常唯一），避免多个条目共用同一 id 造成联动高亮
  const url = item.audio_url || item.audioUrl || item.url || item.src || ''
  if(url) return 'u:' + String(url)
  // 其次使用后端 id/_id/uuid
  const id = item.id || item._id || item.uuid
  if(id) return 'i:' + String(id)
  // 最后使用名称作为兜底（可能不唯一）
  const name = item.title || item.name || item.audioName || ''
  return 'n:' + String(name)
}
function isMiniPlayingItem(item){
  const uid = getStableId(item)
  return miniPlaying.value.has(uid)
}

// mini player actions
function randomizeMini(){
  if (isRandomizing.value) return
  
  isRandomizing.value = true
  // 触发猫猫头动画（0.5秒，循环3次）
  setTimeout(() => {
  // pick 3 random noises from filtered list
  const pool = filteredNoises.value
    if (pool.length === 0) {
      isRandomizing.value = false
      uni.showToast({ title: '暂无音频', icon: 'none' })
      return
    }
  const shuffled = [...pool].sort(()=>0.5 - Math.random())
  randomNoises.value = [shuffled[0]||null, shuffled[1]||null, shuffled[2]||null]
  // reset mini playing state
  miniPlaying.value.clear()
    isRandomizing.value = false
  }, 1500) // 1.5秒后完成（动画循环3次，每次0.5秒）
}

function toggleMini(noise){
  if(!noise) return
  const id = getStableId(noise)
  if(!id) return
  if(miniPlaying.value.has(id)){
    miniPlaying.value.delete(id)
    // stop one source if supported
    player.stopById?.(id)
  } else {
    miniPlaying.value.add(id)
    // add to player playlist if not exists
    const track = { id, metaId: (noise.backend_id ?? noise.id ?? noise._id ?? noise.uuid ?? ''), name: noise.title || noise.name || noise.audioName || '未知', src: noise.audio_url || noise.audioUrl || noise.url || noise.src || '' }
    player.addToQueue?.(track)
    player.play?.(track)
    try{ apiAudios.incrementPlay(track.id).catch?.(e=>console.warn('[Free] incrementPlay failed', e)) }catch(e){}
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
  const track = { id: a.id || a._id || a.uuid || String(Date.now()), metaId: (a.backend_id ?? a.id ?? a._id ?? a.uuid ?? ''), name: a.title || a.name || a.audioName || '', src: a.audio_url || a.audioUrl || a.url || a.src || '' }
  // add to player store and start playing so player page finds currentTrack and src
  try{
    player.addToQueue?.(track)
    player.play?.(track)
    try{ apiAudios.incrementPlay(track.id).catch?.(e=>console.warn('[Free] incrementPlay failed', e)) }catch(e){}
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
  const names = ids.map(uid=>{
    const fromRandom = randomNoises.value.find(n=> n && getStableId(n)===uid)
    if(fromRandom) return fromRandom.title || fromRandom.name || fromRandom.audioName || ''
    const fromRemote = (remoteList.value||[]).find(r=> r && getStableId(r)===uid)
    if(fromRemote) return fromRemote.title || fromRemote.name || ''
    const fromLocal = allNoises.find(l=> l && getStableId(l)===uid)
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
    const names = ids.map(uid=>{
      const fromRandom = randomNoises.value.find(n=> n && getStableId(n)===uid)
      if(fromRandom) return fromRandom.title || fromRandom.name || fromRandom.audioName || ''
      const fromRemote = (remoteList.value||[]).find(r=> r && getStableId(r)===uid)
      if(fromRemote) return fromRemote.title || fromRemote.name || ''
      const fromLocal = allNoises.find(l=> l && getStableId(l)===uid)
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


function openAgent(){
  // 打开 Coze 智能体链接：在浏览器环境直接打开新窗口；在 uni-app 环境使用 uni.navigateTo 到 web-view 页面
  const agentUrl = 'https://www.coze.cn/store/agent/7568816236197363712?bot_id=true'
  try{
    if(typeof uni !== 'undefined' && uni.navigateTo){
      // 尝试打开内置 webview 页面（需在项目中有 pages/webview 页面）
      uni.navigateTo({ url: `/pages/webview/index?src=${encodeURIComponent(agentUrl)}` })
    } else {
      window.open(agentUrl, '_blank')
    }
  }catch(e){
    try{ location.href = agentUrl }catch(err){}
  }
}
</script>

<style scoped>
.page{ padding:12px 16px; min-height:100vh }
.topbar{ display:flex; align-items:center; justify-content:space-between; padding:8px 6px }
.back{ background:transparent; border:none; font-size:22px; position:relative; left:0 }
.title{ font-size:18px; font-weight:700; text-align:center; flex:1 }
.name, .title, .remote-name, .mini-name{ color: var(--text-color) !important }
.actions{ display:flex; gap:8px; min-width:110px; justify-content:flex-end }
.icon{ background:transparent; border:none; font-size:18px }
.topbar button::after{ border:none }

/* reuse home header player styles */
.playing-icon{ width:36px; height:36px; border-radius:6px; overflow:hidden; position:relative }
.playing-icon .cover{ width:100%; height:100% }
.playing-indicator{ position:absolute; right:0; bottom:0; width:10px; height:10px; background:var(--accent,#2EA56B); border-radius:999px; box-shadow:0 0 6px rgba(46,165,107,0.6) }
.player-icon{ width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.06); border-radius:6px }

.tabs-wrap{ display:flex; align-items:center; gap:8px; margin:12px 0; position:relative }
.tabs-scroll{ display:flex; gap:8px; overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:4px }
.tabs-scroll::-webkit-scrollbar{ display:none }
.tab{ display:inline-flex; align-items:center; justify-content:center; white-space:nowrap; padding:6px 10px; background:rgba(0,0,0,0.04); border-radius:14px; min-width:52px; font-size:13px }
.tab.active{ background:var(--accent, #2EA56B); color:#fff; box-shadow:0 6px 14px rgba(46,165,107,0.10) }
.tabs-arrow{ position:absolute; right:6px; top:50%; transform:translateY(-50%); background:rgba(255,255,255,0.95); border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; border:none; box-shadow:0 6px 12px rgba(0,0,0,0.10) }

.grid{ display:flex !important; flex-wrap:wrap; gap:12px 14px; padding:12px 8px }
.grid .item{ box-sizing:border-box; width:50%; padding:10px 14px; border-radius:12px; background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.02)); transition: background 0.18s, transform 0.12s }
@media (min-width:900px){ .grid .item{ width:25% } }

/* removed conflicting grid rules for responsive fixed-column layouts */
.item{ display:flex; align-items:flex-start; padding:10px 14px; border-radius:12px; background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.02)); transition: background 0.18s, transform 0.12s }
.item:hover{ background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.04)); transform: translateY(-6px) }
.name{ font-size:14px; color:var(--text-color); line-height:1.6 }
.play-circle{ display:none }

.player-bar{ position:fixed; bottom:12px; left:16px; right:16px; background:rgba(255,255,255,0.06); padding:10px 12px; border-radius:12px; text-align:center }

/* mini player - floating style */
.mini-player{ position:fixed; left:50%; transform:translateX(-50%); bottom:12px; display:flex; align-items:center; gap:8px; background:rgba(58,61,69,0.65); padding:10px 12px; border-radius:14px; box-shadow:0 10px 16px rgba(8,12,16,0.35); backdrop-filter: blur(12px); border:1px solid rgba(255,255,255,0.08); max-width:520px; width: min(520px, calc(100% - 64px)); z-index:1200 }
.mini-dice{ width:56px; height:56px; display:flex; align-items:center; justify-content:center; border-radius:8px; background: rgba(255,255,255,0.06); border:none; color:#ffffff; box-shadow:none; font-size:32px; line-height:56px }
.mini-dice text, .mini-dice .cat-animation { font-size:32px; line-height:56px }
.mini-dice { opacity: 0.95 }
.mini-dice:hover { opacity: 1 }
.mini-center{ display:flex; gap:10px; flex:1; justify-content:center }
.mini-box{ display:flex; flex-direction:column; align-items:center }
.mini-thumb{ width:46px; height:46px; border-radius:12px; background:rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.85); transition: transform .14s ease, box-shadow .14s ease, background-color .14s ease; }
.mini-thumb.on{ background:var(--accent, #2EA56B); color:#ffffff; box-shadow:0 0 0 2px rgba(46,165,107,0.55) inset, 0 10px 18px rgba(14,58,30,0.45); border-color:transparent }
.mini-name{ font-size:13px; margin-top:6px; color:rgba(255,255,255,0.86); max-width:120px; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; letter-spacing:0.2px }
.mini-name.on{ color:#D8FFE7; font-weight:700 }
.mini-thumb{ position:relative }
.mini-dot{ position:absolute; right:4px; bottom:4px; width:8px; height:8px; border-radius:999px; background:#fff }

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
.mini-dice{ font-size:16px; opacity: 1; transition: opacity 0.2s; }
.mini-dice:disabled{ opacity: 0.5; }
.cat-animation {
  animation: catRotate 0.5s ease-in-out 3;
  display: inline-block;
}
@keyframes catRotate {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(180deg); }
  100% { transform: rotate(360deg); }
}
.mini-name{ font-size:14px; -webkit-font-smoothing:antialiased }
/* override: mini-player names should be light on dark background */
.mini-player .mini-name{ color: rgba(255,255,255,0.86) !important }
.mini-player .mini-name.on{ color: #D8FFE7 !important; font-weight:700 }
</style>
