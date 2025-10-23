<template>
  <view class="page">
    <view class="cover-wrap">
      <image class="cover" :class="{ spinning: store.isPlaying }" :src="track?.cover" mode="aspectFill" />
    </view>
    <view class="meta">
      <text class="name">{{ track?.name || '未选择' }}</text>
      <text class="author">{{ track?.author || '' }}</text>
      <text class="count">{{ (store.currentIndex + 1) }} / {{ store.playlist.length }}</text>
    </view>
    <view class="nav">
      <button class="heart" @click="toggleFav">{{ isFav ? '❤️' : '♡' }}</button>
      <button class="btn" @click="goQueue">查看队列</button>
    </view>
    <PlayerControls
      :playing="store.isPlaying"
      :positionMs="store.positionMs"
      :durationMs="store.durationMs"
      :volume="store.volume"
      :muted="store.isMuted"
      :hasPrev="store.hasPrev"
      :hasNext="store.hasNext"
      :loopMode="store.loopMode"
      @toggle="toggle"
      @seek="seek"
      @prev="prev"
      @next="next"
      @volume="setVolume"
      @muteToggle="muteToggle"
      @toggleLoop="toggleLoop"
    />
  </view>
</template>
<script setup>
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { computed, watch } from 'vue'
import PlayerControls from '@/components/PlayerControls.vue'
import { usePlayerStore } from '@/stores/player'
import { useHistoryStore } from '@/stores/history'
import { useFavoritesStore } from '@/stores/favorites'
import { allNoises } from '@/data/noises'

const store = usePlayerStore()
const historyStore = useHistoryStore()
const favStore = useFavoritesStore(); favStore.load()
historyStore.load()
const track = computed(()=> store.currentTrack)
const isFav = computed(()=> !!track.value && favStore.items.some(x=>x.id===track.value.id))
function toggleFav(){ if(!track.value) return; favStore.toggle(track.value) }
let audioCtx

onLoad((query)=>{
  audioCtx = uni.createInnerAudioContext()
  audioCtx.autoplay = false
  audioCtx.obeyMuteSwitch = false
  audioCtx.src = ''

  audioCtx.onCanplay(()=>{
    if (audioCtx.duration) store.durationMs = audioCtx.duration * 1000
    if (store.isPlaying) audioCtx.play()
  })
  audioCtx.onTimeUpdate(()=>{
    store.positionMs = audioCtx.currentTime * 1000
  })
  audioCtx.onEnded(()=>{
    store.isPlaying = false
  })

  if(query?.id){
    const target = allNoises.find(n=>n.id===query.id)
    if(target){
      store.setPlaylist(allNoises)
      store.play(target)
      historyStore.add(target)
      audioCtx.src = target.src
      store.durationMs = 180000
    }
  } else if (store.currentTrack) {
    audioCtx.src = store.currentTrack.src
  }
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

watch(()=>store.volume, v=>{ if(audioCtx) audioCtx.volume = v })
</script>
<style scoped>
.page{ min-height:100vh; padding-bottom: 24px }
.nav{ display:flex; justify-content:space-between; align-items:center; padding: 0 16px }
.btn{ padding:6px 10px; border-radius:6px; background:#f2f3f5 }
.heart{ padding:6px 10px; border-radius:999px; background: var(--input-bg); color: var(--fg) }
.cover-wrap{ padding:24px 16px; display:flex; justify-content:center }
.cover{ width:220px; height:220px; border-radius:50%; box-shadow: 0 4px 18px rgba(0,0,0,.15); overflow:hidden }
.spinning{ animation: spin 6s linear infinite }
@keyframes spin{ from{ transform: rotate(0deg) } to{ transform: rotate(360deg) } }
.meta{ padding: 0 16px }
.name{ font-size:18px; font-weight:600; color:#111 }
.author{ margin-top:4px; font-size:14px; color:#666 }
.count{ margin-top:4px; font-size:12px; color:#999 }
</style>
