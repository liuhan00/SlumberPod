<template>
  <view>
    <!-- 悬浮球 -->
    <view
      class="floating"
      :style="floatingStyle"
      @touchstart.stop.prevent="onTouchStart"
      @touchmove.stop.prevent="onTouchMove"
      @touchend.stop.prevent="onTouchEnd"
      @mousedown.stop.prevent="onMouseDown"
      @mousemove.stop.prevent="onMouseMove"
      @mouseup.stop.prevent="onMouseUp"
      @click.stop="onClick"
      ref="floatEl"
    >
      <view class="ball" :class="{ pressed: pressed }">
        <!-- 星月图标（星眠坞主题） -->
        <svg width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.5l2.6 5.3 5.8.8-4.2 3.9 1 5.7L12 16.8 6.8 18.2l1-5.7L3.6 8.6l5.8-.8L12 2.5z" fill="rgba(255,255,255,0.95)"/>
          <path d="M19 5.5a4.5 4.5 0 1 0 0 9 6 6 0 0 1 0-9z" fill="rgba(255,255,255,0.18)"/>
        </svg>
      </view>
    </view>

    <!-- 弹窗：内嵌智能体 -->
    <modal v-if="showAgent" @close="showAgent=false">
      <view class="agent-container">
        <web-view v-if="isMiniProgram" :src="agentUrl" class="agent-webview" @error="onWebviewError" />
        <div v-else class="iframe-wrap"><iframe :src="agentUrl" class="agent-iframe"></iframe></div>
        <view class="agent-footer"><button class="open-btn" @click="openExternal">在浏览器中打开</button><button @click="showAgent=false">关闭</button></view>
      </view>
    </modal>

    <view v-if="showDomainWarning" class="domain-warning">星眠助理无法内嵌，请在浏览器中打开以获得完整体验。<button class="open-inline" @click="openExternal">在浏览器中打开</button></view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

const agentUrl = 'https://www.coze.cn/store/agent/7568816236197363712?bot_id=true'
const showAgent = ref(false)
const showAgentPrompt = ref(false)
const showDomainWarning = ref(false)
const isMiniProgram = (typeof uni !== 'undefined' && typeof uni.getSystemInfoSync === 'function') || (typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function')

// 抽象位置状态（支持记忆）
const pos = reactive({ x: null, y: null })
const dragging = ref(false)
const dragStart = reactive({ x:0, y:0, elX:0, elY:0, moved:false })
const floatEl = ref(null)
const pressed = ref(false)
let longPressTimer = null

// 屏幕尺寸（用于吸附计算）
let screenW = 375, screenH = 812
onMounted(()=>{
  try{
    const info = (typeof uni !== 'undefined' && uni.getSystemInfoSync) ? uni.getSystemInfoSync() : (typeof window !== 'undefined' && window.innerWidth ? { windowWidth: window.innerWidth, windowHeight: window.innerHeight } : null)
    if(info){ screenW = info.windowWidth || screenW; screenH = info.windowHeight || screenH }
  }catch(e){}
  // 读取记忆位置
  try{ const raw = uni?.getStorageSync?.('ai_helper_pos') || (typeof localStorage !== 'undefined' && localStorage.getItem('ai_helper_pos'))
    if(raw){ const p = JSON.parse(raw); if(p && typeof p.x==='number' && typeof p.y==='number'){ pos.x = p.x; pos.y = p.y } }
  }catch(e){}
})

const floatingStyle = computed(()=>{
  if(pos.x === null || pos.y === null){ return { right: '12px', bottom: '120px', transition: 'none' } }
  return { left: pos.x + 'px', top: pos.y + 'px', transition: 'left 180ms cubic-bezier(.2,.9,.2,1), top 180ms cubic-bezier(.2,.9,.2,1)' }
})

function persistPos(){ try{ const p = { x: pos.x, y: pos.y }; if(typeof uni !== 'undefined' && uni.setStorageSync) uni.setStorageSync('ai_helper_pos', JSON.stringify(p)); else if(typeof localStorage !== 'undefined') localStorage.setItem('ai_helper_pos', JSON.stringify(p)) }catch(e){} }

function startLongPress(){ clearTimeout(longPressTimer); longPressTimer = setTimeout(()=>{ // 长按触发演示模式（本地 mock）
  showAgent.value = true; showDomainWarning.value = false }, 600) }
function cancelLongPress(){ clearTimeout(longPressTimer) }

function onTouchStart(e){ const t = e.touches && e.touches[0]; if(!t) return; pressed.value=true; startLongPress(); dragging.value = true; dragStart.x = t.clientX; dragStart.y = t.clientY; dragStart.elX = (pos.x === null) ? (screenW - 64 - 12) : pos.x; dragStart.elY = (pos.y === null) ? (screenH - 64 - 120) : pos.y; dragStart.moved = false }
function onTouchMove(e){ cancelLongPress(); if(!dragging.value) return; const t = e.touches && e.touches[0]; if(!t) return; const dx = t.clientX - dragStart.x; const dy = t.clientY - dragStart.y; if(Math.abs(dx) > 4 || Math.abs(dy) > 4) dragStart.moved = true; pos.x = Math.max(8, Math.min(dragStart.elX + dx, screenW - 56 - 8)); pos.y = Math.max(8, Math.min(dragStart.elY + dy, screenH - 56 - 8)) }
function onTouchEnd(e){ cancelLongPress(); pressed.value=false; if(!dragging.value) return; dragging.value=false; snapToEdge(); persistPos(); if(!dragStart.moved) { showAgentPrompt.value = true } }

function onMouseDown(e){ if(e.button !== undefined && e.button !== 0) return; pressed.value=true; startLongPress(); dragging.value = true; dragStart.x = e.clientX; dragStart.y = e.clientY; dragStart.elX = (pos.x===null)?(screenW-64-12):pos.x; dragStart.elY = (pos.y===null)?(screenH-64-120):pos.y; dragStart.moved=false }
function onMouseMove(e){ cancelLongPress(); if(!dragging.value) return; const dx = (e.clientX||0)-dragStart.x; const dy = (e.clientY||0)-dragStart.y; if(Math.abs(dx)>4||Math.abs(dy)>4) dragStart.moved=true; pos.x = Math.max(8, Math.min(dragStart.elX+dx, screenW-56-8)); pos.y = Math.max(8, Math.min(dragStart.elY+dy, screenH-56-8)) }
function onMouseUp(e){ cancelLongPress(); pressed.value=false; if(!dragging.value) return; dragging.value=false; snapToEdge(); persistPos(); if(!dragStart.moved) { showAgentPrompt.value = true } }

function snapToEdge(){ try{ const centerX = (pos.x || (screenW-56-12)) + 28; const leftDist = centerX; const rightDist = screenW - centerX; if(Math.min(leftDist, rightDist) <= Math.min((pos.y||0), (screenH - (pos.y||0)))){ if(leftDist <= rightDist) pos.x = 12; else pos.x = screenW - 56 - 12 } else { if((pos.y||0) <= (screenH - (pos.y||0))) pos.y = 12; else pos.y = screenH - 56 - 12 } }catch(e){} }

function onClick(){ cancelLongPress(); if(!dragStart.moved){ // click animation brief
  pressed.value = true; setTimeout(()=> pressed.value=false, 180); showAgent.value = true } }

function onWebviewError(e){ console.warn('webview error', e); showDomainWarning.value = true }
function openExternal(){ try{ if(typeof uni !== 'undefined' && uni.navigateTo){ uni.navigateTo({ url: `/pages/webview/open?u=${encodeURIComponent(agentUrl)}` }) } else if(typeof window !== 'undefined'){ window.open(agentUrl, '_blank') } }catch(e){ console.warn(e) } }

</script>

<style scoped>
.floating{ position: fixed; width:64px; height:64px; z-index:2600; display:flex; align-items:center; justify-content:center; }
.ball{ width:56px; height:56px; border-radius:28px; background: linear-gradient(180deg,#e7f6ff 0%, #cfeeff 55%, #9ed0ff 100%); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; box-shadow: 0 12px 28px rgba(36,66,102,0.18); transition: transform 160ms cubic-bezier(.2,.9,.2,1), box-shadow 160ms }
.ball:active{ transform: scale(0.96) }
.ball.pressed{ transform: scale(0.94); box-shadow:0 8px 22px rgba(36,66,102,0.12) }
.ball svg{ filter: drop-shadow(0 6px 12px rgba(0,0,0,0.12)) }

.agent-container{ width:100%; height:100%; display:flex; flex-direction:column }
.agent-webview{ flex:1; min-height:420px }
.iframe-wrap{ flex:1 }
.agent-iframe{ width:100%; height:420px; border-radius:8px }
.agent-footer{ display:flex; gap:8px; justify-content:flex-end; padding:8px }
.open-btn{ background: linear-gradient(90deg,#6aaef8,#4b8fe6); color:#fff; padding:8px 12px; border-radius:8px; border:none }
.domain-warning{ padding:12px; background: linear-gradient(180deg, rgba(158,208,255,0.12), rgba(223,243,255,0.08)); color:#0f223c; border-radius:10px; margin-top:8px; display:flex; gap:8px; align-items:center }
.domain-warning .open-inline{ background:#2f86ff; color:#fff; border:none; padding:6px 10px; border-radius:8px }
</style>