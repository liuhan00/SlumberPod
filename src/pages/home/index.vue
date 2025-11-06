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
  try{ uni.reLaunch({ url: '/pages/noise/Free' }) }catch(e){ try{ uni.navigateTo({ url: '/pages/noise/Free' }) }catch(err){ if(typeof location!=='undefined') location.hash='#/pages/noise/Free' } }
})
</script>

<style scoped>
.redirect-page{ min-height:100vh; display:flex; align-items:center; justify-content:center }
</style>