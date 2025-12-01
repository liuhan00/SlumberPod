<template>
  <view class="splash" >
    <view class="center">
      <text class="vertical">给你一个婴儿般好睡眠</text>
    </view>
  </view>
</template>
<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { getAuthStatus } from '@/store/auth'

// 启动逻辑：先检查登录状态，再决定跳转到哪个页面
onLoad(() => {
  const { isAuthenticated } = getAuthStatus()
  if (!isAuthenticated) {
    uni.reLaunch({ url: '/pages/auth/Login' })
    return
  }
  uni.switchTab({ url: '/pages/noise/Free' })
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
