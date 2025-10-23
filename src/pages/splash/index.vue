<template>
  <view class="splash" :class="theme">
    <view class="center">
      <text class="vertical">给你一个婴儿般好睡眠</text>
    </view>
    <view class="bottom">
      <button class="btn" @click="enter">进入</button>
    </view>
  </view>
</template>
<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'

const theme = ref('night')
function computeTheme(h){
  if (h>=5 && h<10) return 'dawn'
  if (h>=10 && h<17) return 'day'
  if (h>=17 && h<20) return 'dusk'
  return 'night'
}

onLoad((query)=>{
  const now = new Date()
  const mockHour = query?.hour ? Number(query.hour) : now.getHours()
  theme.value = computeTheme(mockHour)
  setTimeout(()=> enter(), 1500)
})

function enter(){
  // 进入首页 tab
  try { uni.switchTab({ url:'/pages/home/index' }) } catch(e) { uni.navigateTo({ url:'/pages/home/index' }) }
}
</script>
<style scoped>
.splash{ position:fixed; inset:0; display:flex; flex-direction:column; justify-content:center; align-items:center; animation: fadein .6s ease }
.center{ flex:1; display:flex; justify-content:center; align-items:center }
.vertical{ writing-mode:vertical-rl; text-orientation:mixed; letter-spacing:2px; font-size:20px; color:#cfd3dc; opacity:.9 }
.bottom{ padding:24px }
.btn{ padding:8px 16px; border-radius:999px; background:rgba(255,255,255,.15); color:#fff }

/* 主题背景 */
.night{ background: radial-gradient(120% 80% at 50% 20%, #151824 0%, #0c0f16 60%, #0a0c12 100%) }
.dusk{ background: radial-gradient(120% 80% at 50% 20%, #1f2430 0%, #161a24 60%, #12141c 100%) }
.day{ background: radial-gradient(120% 80% at 50% 20%, #eef1f6 0%, #dfe6f2 60%, #d7e0ee 100%); color:#222 }
.dawn{ background: radial-gradient(120% 80% at 50% 20%, #273043 0%, #1f2737 60%, #1a2130 100%) }

@keyframes fadein{ from{ opacity:0 } to{ opacity:1 } }
</style>
