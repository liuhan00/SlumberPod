<template>
  <view class="list">
    <view class="item" v-for="s in settings" :key="s.key" @click="$emit('tap', s.key)" role="button">
      <text class="label">{{ s.label }}</text>
      <text class="arrow">›</text>
    </view>
  </view>
</template>
<script setup>
const props = defineProps({ settings: { type:Array, required:true } })
</script>
<style scoped>
.list{ padding: 16px }
.item{ display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee }
.label{ color:#111 }
.arrow{ color:#999 }
</style>
