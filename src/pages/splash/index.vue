<template>
  <view class="splash" >
    <view class="center">
      <text class="vertical">给你一个婴儿般好睡眠</text>
    </view>
  </view>
</template>
<script setup>
import { onLoad } from '@dcloudio/uni-app'

// 最小化启动逻辑：直接跳转到首页，确保 Splash 页注册与跳转的稳定性
onLoad(() => {
  uni.switchTab({ url: '/pages/home/index' })
})
</script>
<style scoped>
.splash{ position:fixed; inset:0; display:flex; flex-direction:column; justify-content:center; align-items:center; animation: fadein .6s ease }
.center{ flex:1; display:flex; justify-content:center; align-items:center }
.vertical{ writing-mode:vertical-rl; text-orientation:mixed; letter-spacing:2px; font-size:20px; color:#cfd3dc; opacity:.9 }
.bottom{ padding:24px }
.btn{ padding:8px 16px; border-radius:999px; background:rgba(255,255,255,.15); color:var(--text-color) }

@keyframes fadein{ from{ opacity:0 } to{ opacity:1 } }
</style>
