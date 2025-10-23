<template>
  <view class="page">
    <view class="card">
      <text class="title">小憩计时器</text>
      <view class="row">
        <input class="num" type="number" v-model.number="minutes" min="5" max="60" />
        <text>分钟</text>
      </view>
      <view class="row">
        <button class="btn primary" @click="start">开始小憩</button>
        <button class="btn" @click="stop" :disabled="!sleep.napStartTs">结束</button>
      </view>
      <view class="count" v-if="sleep.napStartTs">剩余：{{ remainText }}</view>
    </view>
  </view>
</template>
<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useSleepStore } from '@/stores/sleep'
const sleep = useSleepStore()
const minutes = ref(sleep.napTimerMin)
let timer

const remainMs = computed(()=>{
  if(!sleep.napStartTs) return 0
  const end = sleep.napStartTs + minutes.value*60*1000
  return Math.max(0, end - Date.now())
})
const remainText = computed(()=>{
  const ms = remainMs.value; const m = Math.floor(ms/60000); const s = Math.floor((ms%60000)/1000)
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
})
function start(){ sleep.startNap(minutes.value); uni.showToast({ title:'开始小憩', icon:'none' }); tick() }
function stop(){ sleep.stopNap(); uni.showToast({ title:'已结束', icon:'none' }) }
function tick(){ clearInterval(timer); timer=setInterval(()=>{},1000) }
onUnmounted(()=> clearInterval(timer))
</script>
<style scoped>
.page{ min-height:100vh; padding:12px 16px }
.card{ background:#fff; border-radius:12px; padding:12px; box-shadow:0 1px 4px rgba(0,0,0,.06) }
.title{ font-size:16px; font-weight:600 }
.row{ display:flex; align-items:center; gap:8px; margin-top:8px }
.num{ width:80px; background:#f2f3f5; border-radius:8px; padding:6px 8px }
.count{ margin-top:8px; color:#111; font-size:18px }
.btn{ padding:6px 10px; border-radius:8px; background:#f2f3f5 }
.primary{ background:#111; color:#fff }
</style>
