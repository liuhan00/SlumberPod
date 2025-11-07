<template>
  <view class="page" style="height:100vh; display:flex; flex-direction:column;">
    <view class="nav" style="height:56px; display:flex; align-items:center; padding:0 12px; background:var(--card-bg); box-shadow:0 1px 0 rgba(0,0,0,0.04)">
      <button @click="goBack" style="border:none; background:transparent; font-size:16px">返回</button>
      <text style="flex:1; text-align:center; font-weight:600">对话</text>
    </view>
    <view style="flex:1;">
      <!-- 小程序使用 web-view，H5 使用 iframe -->
      <web-view v-if="isWeixinMini" :src="url" style="flex:1;" />
      <div v-else style="height:100%;"><iframe :src="url" style="width:100%;height:100%;border:none"></iframe></div>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const url = ref('')
const isWeixinMini = (typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function')
function getQuery(){
  try{
    // uni.getStorage ? but we expect query param u
    const q = (typeof uni!=='undefined' && uni.getLaunchOptionsSync)? (uni.getCurrentPages && uni.getCurrentPages().pop()?.options || {}) : {}
    if(q && q.u) return decodeURIComponent(q.u)
    // fallback to location.search
    if(typeof location !== 'undefined' && location.search) {
      const p = new URLSearchParams(location.search)
      return p.get('u') || ''
    }
  }catch(e){}
  return ''
}

onMounted(()=>{
  const u = getQuery()
  url.value = u || ''
})

function goBack(){ try{ uni.navigateBack() }catch(e){ history.back() } }
</script>

<style scoped>
.page{ background:#fff }
</style>