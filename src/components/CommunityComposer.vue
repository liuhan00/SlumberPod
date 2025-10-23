<template>
  <view class="composer">
    <textarea class="input" v-model="text" placeholder="分享你的睡眠心得或白噪音推荐..." />
    <view class="row">
      <button class="btn" @click="submit" :disabled="!text.trim()">发布</button>
    </view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
const emit = defineEmits(['submit'])
const text = ref('')
function submit(){ emit('submit', text.value); text.value='' }
</script>
<style scoped>
.composer{ background:#fff; border-radius:12px; padding:12px; margin-bottom:12px; box-shadow:0 1px 4px rgba(0,0,0,.06) }
.input{ width:100%; min-height:80px; background:#f7f7f8; border-radius:8px; padding:8px 10px }
.row{ display:flex; justify-content:flex-end; margin-top:8px }
.btn{ padding:6px 10px; border-radius:8px; background:#111; color:#fff }
.btn:disabled{ opacity:.5 }
</style>
