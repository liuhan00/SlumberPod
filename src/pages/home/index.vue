<template>
  <!-- Home 已移除，自动重定向到 听白噪音 页面 -->
  <view class="redirect-page" :style="bgStyle">
    <text>正在前往 听白噪音...</text>
  </view>
</template>

<script setup>
import { onMounted } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
const { bgStyle } = useGlobalTheme()

onMounted(()=>{
  // 延迟执行，避免在 onMounted 中立即调用 reLaunch 导致超时
  setTimeout(() => {
    try{ 
      // 检查当前页面，避免重复跳转
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      if (currentPage && currentPage.route !== 'pages/noise/Free') {
        uni.reLaunch({ url: '/pages/noise/Free' })
      }
    }catch(e){ 
      try{ 
        uni.navigateTo({ url: '/pages/noise/Free' })
      }catch(err){ 
        if(typeof location!=='undefined') location.hash='#/pages/noise/Free' 
      } 
    }
  }, 100)
})
</script>

<style scoped>
.redirect-page{ min-height:100vh; display:flex; align-items:center; justify-content:center }
</style>