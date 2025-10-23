<template>
  <scroll-view class="page" scroll-y :style="bgStyle">
    <!-- 顶部导航栏 -->
    <view class="header">
      <SearchBar />
      <view class="header-right">
        <view v-if="currentTrack" class="playing-icon" @click="goToPlayer">
          <image class="cover" :src="currentTrack.cover" mode="aspectFill" />
          <view v-if="isPlaying" class="playing-indicator"></view>
        </view>
        <view v-else class="player-icon" @click="goToPlayer">
          <text class="icon">▶</text>
        </view>
      </view>
    </view>
    
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
import { usePlayerStore } from '@/stores/player'
import { storeToRefs } from 'pinia'

const themeStore = useThemeStore(); themeStore.load()
const { bgStyle } = useGlobalTheme()

import { allNoises as noises } from '@/data/noises'
import { useHistoryStore } from '@/stores/history'
const historyStore = useHistoryStore()
historyStore.load()
const { items } = storeToRefs(historyStore)
const recent = items

// 播放器状态
const playerStore = usePlayerStore()
const { currentTrack, isPlaying } = storeToRefs(playerStore)

// 跳转到播放页面
function goToPlayer() {
  try {
    uni.navigateTo({ url: '/pages/player/index' })
  } catch(e) {
    if(typeof location !== 'undefined') location.hash = '#/pages/player/index'
  }
}
</script>
<style scoped>
.page { min-height:100vh }

/* 顶部导航栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  position: relative;
}

.header-right {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

/* 默认播放图标 */
.player-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--uni-color-primary, #007aff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.player-icon .icon {
  color: white;
  font-size: 14px;
  font-weight: bold;
}

/* 正在播放图标 */
.playing-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.playing-icon .cover {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.playing-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff3b30;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.section { padding: 12px 16px }
.section-title { font-size:16px; font-weight:600; margin-bottom:8px }
.grid { display:flex; flex-wrap:wrap; justify-content:space-between }
</style>
