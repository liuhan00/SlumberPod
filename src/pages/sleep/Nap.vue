<template>
  <view class="page" :style="bgStyle">
    <view class="overlay" />
    <view class="top-chips">
      <view class="chip" :class="{ active: isCustom }" @click="setPreset(0)">自定义</view>
      <view class="chip" :class="{ active: minutes===10 && !isCustom }" @click="setPreset(10)">科学小眠 10'</view>
      <view class="chip" :class="{ active: minutes===24 && !isCustom }" @click="setPreset(24)">高效午休 24'</view>
    </view>

    <view class="center-area">
      <view class="dial-wrap"
            @touchstart.stop.prevent="onTouchStart"
            @touchmove.stop.prevent="onTouchMove"
            @touchend.stop.prevent="onTouchEnd">
        <svg class="dial-svg" viewBox="0 0 200 200">
          <circle class="ring-bg" cx="100" cy="100" r="80" />
          <circle class="ring-progress" :style="{ stroke: palette.start }" cx="100" cy="100" r="80"
                  :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset" />
          <g class="ticks-group" stroke="rgba(15,34,60,0.18)" stroke-width="1">
            <line v-for="t in ticks" :key="'tick-'+t"
                  :x1="100 + 80 * Math.cos((t*6) * Math.PI / 180)"
                  :y1="100 + 80 * Math.sin((t*6) * Math.PI / 180)"
                  :x2="100 + 86 * Math.cos((t*6) * Math.PI / 180)"
                  :y2="100 + 86 * Math.sin((t*6) * Math.PI / 180)" />
          </g>
        </svg>

        <view class="picker">
          <text class="prev">{{ Math.max(1, minutes-1) }}</text>
          <text class="minutes" :style="{ transform: `translateY(${dragVisualOffset}px)` }">{{ minutes }}</text>
          <text class="next">{{ Math.min(180, minutes+1) }}</text>
          <text class="unit-zh">分钟</text>
        </view>
        <view class="wake-line">将在 {{ wakeText }} 唤醒</view>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="left-icon">≡</view>
      <button class="start-btn" @click="toggleStart">
        <view :class="['start-icon', { running }]">{{ running ? '■' : icon }}</view>
      </button>
      <view class="right-icon">◎</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'
import { useSleepStore } from '@/stores/sleep'
import { useGlobalTheme } from '@/composables/useGlobalTheme'

const sleep = useSleepStore()
const { bgStyle } = useGlobalTheme()

const minutes = ref(24)
const isCustom = ref(false)
const running = ref(false)
const remain = ref(minutes.value * 60) // seconds
let tickTimer = null
let rafId = null
let touchStartY = 0
let touchDelta = 0
let baseMinutesStart = 0
const STEP_PX = 36 // 每步（1分钟）对应的像素位移，用于可视化滚动
const dragVisualOffset = computed(()=>{
  // 将拖动位移映射到 [-STEP_PX, 0) 的余数，驱动滚动视觉
  if(!touchDelta) return 0
  let r = (-touchDelta) % STEP_PX
  if(r>0) r = r - STEP_PX // 让中心向上为负偏移，避免正数跳变
  return r
})

const paletteMap = {
  green: { start: '#6CC07B', end: '#2EA56B' },
  pink: { start: '#FF8AB8', end: '#FF5E9E' },
  blue: { start: '#7FB3FF', end: '#4B8BFF' }
}

const paletteKey = ref('green')
const palette = computed(() => paletteMap[paletteKey.value])
const ticks = Array.from({length:60}, (_,i)=>i)
const circumference = 2 * Math.PI * 80
const dashOffset = ref(circumference)
const targetDash = ref(circumference)
const displayMinutes = computed(()=> Math.ceil(remain.value/60))

const wakeText = computed(()=>{
  const t = new Date(Date.now() + remain.value*1000)
  return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`
})

const icon = computed(()=> paletteKey.value==='green'?'⚡':(paletteKey.value==='pink'?'☕':'⏳'))

const prevMinute = computed(()=> Math.max(1, minutes.value - 1))
const nextMinute = computed(()=> Math.min(180, minutes.value + 1))

function setPreset(m){
  isCustom.value = m === 0
  minutes.value = m || (isCustom.value ? 30 : minutes.value)
  paletteKey.value = m===10? 'pink' : m===24? 'green' : m===90? 'blue' : 'green'
  remain.value = minutes.value * 60
  updateDashInstant()
}

function updateDashInstant(){
  const total = minutes.value*60 || 1
  const progress = (total - remain.value) / total
  targetDash.value = circumference * (1 - progress)
  dashOffset.value = targetDash.value
}

function animateDash(){
  const ease = 0.12
  const raf = (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame : (cb=> setTimeout(cb, 16))
  const caf = (typeof cancelAnimationFrame !== 'undefined') ? cancelAnimationFrame : (id=> clearTimeout(id))
  function step(){
    dashOffset.value += (targetDash.value - dashOffset.value) * ease
    rafId = raf(step)
  }
  if(rafId) caf(rafId)
  rafId = raf(step)
}

function startTimer(){
  if(tickTimer) clearInterval(tickTimer)
  tickTimer = setInterval(()=>{
    if(remain.value>0){
      remain.value -= 1
      const total = minutes.value*60 || 1
      const progress = (total - remain.value) / total
      targetDash.value = circumference * (1 - progress)
    } else {
      stopTimer()
      uni.showToast({ title: '小憩结束', icon: 'none' })
    }
  }, 1000)
  animateDash()
}

function stopTimer(){
  if(tickTimer) clearInterval(tickTimer); tickTimer = null; running.value=false
  if(rafId) cancelAnimationFrame(rafId); rafId = null
}

function toggleStart(){
  if(running.value){ stopTimer(); }
  else { running.value=true; startTimer(); sleep.startNap(minutes.value) }
}

function onTouchStart(e){
  const y0 = e.touches ? e.touches[0].clientY : e.clientY
  touchStartY = y0
  touchDelta = 0
  baseMinutesStart = minutes.value
}
function onTouchMove(e){
  const y = e.touches ? e.touches[0].clientY : e.clientY
  touchDelta = y - touchStartY
  // 每 STEP_PX 改变 1 分钟，向上滑减小 delta -> 增加分钟
  const deltaMinutes = Math.round((-touchDelta) / STEP_PX)
  const next = Math.max(1, Math.min(180, baseMinutesStart + deltaMinutes))
  if(next !== minutes.value){
    minutes.value = next
    isCustom.value = true
    remain.value = minutes.value * 60
    updateDashInstant()
  }
}
function onTouchEnd(){
  // 松手后吸附到整数步（minutes 已是整数），重置视觉偏移
  animateDash()
  touchDelta = 0
}

onUnmounted(()=>{ if(tickTimer) clearInterval(tickTimer); if(rafId) cancelAnimationFrame(rafId) })

watch(minutes,(v)=>{ remain.value = v*60; updateDashInstant(); animateDash(); })

// 初始化为高效午休 24'
setPreset(24)
</script>

<style scoped>
.page{ position:relative; min-height:100vh; overflow:hidden }
.overlay{ position:absolute; inset:0; background: rgba(255,255,255,0.06); backdrop-filter: blur(6px); z-index:1; pointer-events:none }
.top-chips{ position:relative; z-index:5; display:flex; gap:12px; padding:18px 16px 0 }
.chip{ padding:8px 14px; border-radius:18px; background: rgba(15,34,60,0.06); color: rgba(15,34,60,0.86); font-weight:600 }
.chip.active{ background: #eaf3ff; color: #0f223c }

.center-area{ position:relative; z-index:5; display:flex; flex-direction:column; align-items:center; margin-top:18px }
.dial-wrap{ position:relative; width:320px; height:360px; display:flex; align-items:center; justify-content:center; z-index:6 }
.dial-svg{ width:100%; height:100%; transform:rotate(-90deg) }
.ring-bg{ fill:none; stroke: rgba(15,34,60,0.08); stroke-width:12 }
.ring-progress{ fill:none; stroke-width:12; stroke-linecap:round; transition: stroke-dashoffset 0.6s linear }
.ticks-group line{ opacity:0.9 }


.picker{ position:absolute; top:50%; left:50%; transform:translate(-50%, -56%); display:flex; flex-direction:column; align-items:center; gap:6px; height:180px; justify-content:center; user-select:none; -webkit-user-select:none; pointer-events:none }
.prev{ font-size:28px; color:rgba(15,34,60,0.26) }
.minutes{ font-size:80px; font-weight:800; color:#0f223c; text-shadow:0 6px 16px rgba(0,0,0,0.10); line-height:1; transition: transform 0.08s linear }
.next{ font-size:28px; color:rgba(15,34,60,0.26) }
.unit-zh{ margin-top:6px; color:#3a516e; font-size:16px }
.wake-line{ margin-top:12px; text-align:center; color:#3a516e; font-size:14px }

.bottom-bar{ position:absolute; z-index:5; left:0; right:0; bottom:48px; display:flex; justify-content:space-around; align-items:center; padding:0 32px }
.start-btn{ width:72px; height:72px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 30px rgba(0,0,0,0.25); transition: transform 0.15s ease }
.start-btn:active{ transform: scale(0.96) }
.start-icon{ font-size:28px }
.start-icon.running{ color:#ff4d4f }
.left-icon, .right-icon{ color:#0f223c; font-size:20px }
</style>