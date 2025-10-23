<template>
  <scroll-view class="page" scroll-y :style="bgStyle">
    <SearchBar />
    <BannerCarousel />
    <view class="section">
      <text class="section-title">推荐白噪音</text>
      <view class="grid">
        <NoiseCard v-for="n in noises" :key="n.id" :item="n" />
      </view>
    </view>
    <view class="section">
      <text class="section-title">最近播放</text>
      <view class="grid">
        <NoiseCard v-for="n in recent" :key="n.id" :item="n" />
      </view>
    </view>
  </scroll-view>
</template>
<script setup>
import SearchBar from '@/components/SearchBar.vue'
import BannerCarousel from '@/components/BannerCarousel.vue'
import NoiseCard from '@/components/NoiseCard.vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { useThemeStore } from '@/stores/theme'
const themeStore = useThemeStore(); themeStore.load()
const { bgStyle } = useGlobalTheme()

import { allNoises as noises } from '@/data/noises'
import { useHistoryStore } from '@/stores/history'
import { storeToRefs } from 'pinia'
const historyStore = useHistoryStore()
historyStore.load()
const { items } = storeToRefs(historyStore)
const recent = items
</script>
<style scoped>
.page { min-height:100vh }
.section { padding: 12px 16px }
.section-title { font-size:16px; font-weight:600; margin-bottom:8px }
.grid { display:flex; flex-wrap:wrap; justify-content:space-between }
</style>
