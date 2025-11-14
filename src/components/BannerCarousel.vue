<template>
  <swiper class="banner" circular autoplay interval="4000">
    <swiper-item v-for="b in banners" :key="b.id">
      <image class="img" :src="b.image" mode="aspectFill" @error="handleImageError(b)" />
    </swiper-item>
  </swiper>
</template>
<script setup>
import { ref } from 'vue'
import { getPlaceholder } from '@/utils/image'

const banners = ref([
  { id: 'b1', image: getPlaceholder('banner') },
  { id: 'b2', image: getPlaceholder('banner') },
  { id: 'b3', image: getPlaceholder('banner') },
])

function handleImageError(banner) {
  banner.image = getPlaceholder('banner')
}
</script>
<style scoped>
.banner { height: 160px; }
.img { width:100%; height:100%; border-radius: 12px; }
</style>
