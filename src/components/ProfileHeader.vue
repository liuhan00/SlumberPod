<template>
  <view class="header">
    <image class="avatar" :src="avatar" />
    <view class="meta">
      <text class="name">{{ nickname }}</text>
      <text class="vip" v-if="vip">VIP</text>
    </view>
  </view>
</template>
<script setup>
const props = defineProps({ avatar:String, nickname:String, vip:Boolean })
</script>
<style scoped>
.header{ display:flex; align-items:center; gap:12px; padding:16px }
.avatar{ width:60px; height:60px; border-radius:50% }
.name{ font-size:18px; font-weight:600; color: var(--fg) }
.vip{ font-size:12px; color:#fff; background:#ff6b6b; padding:2px 6px; border-radius:6px; margin-top:4px }
</style>
