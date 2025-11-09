<template>
  <view class="page">
    <web-view :src="cozeUrl" style="width:100%;height:100vh" />
  </view>
</template>
<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'

const cozeUrl = ref('')
onLoad((q)=>{
  // 允许通过 query 注入 url，否则用默认智能体地址
  const fallback = 'https://www.coze.cn/store/agent/7568816236197363712?bot_id=true'
  cozeUrl.value = decodeURIComponent(q?.url || fallback)
})
</script>
<style scoped>
.page{ min-height:100vh }
</style>
