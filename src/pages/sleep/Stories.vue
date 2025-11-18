<template>
  <view class="page" :style="bgStyle">
    <view class="header">
      <text class="title">睡眠故事</text>
      <view class="filter-tabs">
        <view 
          :class="['filter-tab', { active: filterType === 'latest' }]"
          @click="filterType = 'latest'"
        >
          最新
        </view>
        <view 
          :class="['filter-tab', { active: filterType === 'hot' }]"
          @click="filterType = 'hot'"
        >
          最热
        </view>
      </view>
    </view>

    <scroll-view class="stories-list" scroll-y @scrolltolower="loadMore">
      <view 
        v-for="story in stories" 
        :key="story.id"
        class="story-item"
        @click="viewStory(story)"
      >
        <image class="story-cover" :src="story.cover" mode="aspectFill" />
        <view class="story-info">
          <text class="story-title">{{ story.title }}</text>
          <text class="story-desc">{{ story.description }}</text>
          <view class="story-meta">
            <text class="story-duration">{{ story.duration }}</text>
          </view>
        </view>
      </view>
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-if="stories.length === 0 && !loading" class="empty-state">
        <text class="empty-text">暂无故事</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'

const { bgStyle } = useGlobalTheme()

const filterType = ref('latest')
const stories = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

// 示例数据，实际应从后端获取
const mockStories = [
  {
    id: 1,
    title: '小王子',
    description: '一个关于爱与责任的温暖故事',
    cover: '',
    duration: '15分钟',
    content: '故事内容...',
    audioUrl: ''
  },
  {
    id: 2,
    title: '森林里的秘密',
    description: '探索神秘森林的奇妙之旅',
    cover: '',
    duration: '20分钟',
    content: '故事内容...',
    audioUrl: ''
  }
]

function loadStories() {
  if (loading.value || !hasMore.value) return
  
  loading.value = true
  // TODO: 调用云函数 getStories
  setTimeout(() => {
    if (filterType.value === 'latest') {
      stories.value = [...mockStories]
    } else {
      stories.value = [...mockStories].reverse()
    }
    loading.value = false
    hasMore.value = false
  }, 500)
}

function loadMore() {
  if (hasMore.value) {
    page.value += 1
    loadStories()
  }
}

function viewStory(story) {
  uni.navigateTo({ 
    url: `/pages/sleep/StoryDetail?id=${story.id}&title=${encodeURIComponent(story.title)}`
  })
}

onMounted(() => {
  loadStories()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 12px 16px;
}

.header {
  padding: 12px 0;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: var(--fg);
  margin-bottom: 16px;
  display: block;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 6px 16px;
  border-radius: 16px;
  background: var(--input-bg);
  color: var(--muted);
  font-size: 14px;
}

.filter-tab.active {
  background: #7B61FF;
  color: #fff;
}

.stories-list {
  margin-top: 16px;
  max-height: calc(100vh - 200px);
}

.story-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--card-bg);
  margin-bottom: 12px;
}

.story-cover {
  width: 160rpx;
  height: 120rpx;
  border-radius: 8px;
  background: var(--input-bg);
}

.story-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.story-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg);
  margin-bottom: 6px;
}

.story-desc {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.story-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.story-duration {
  font-size: 12px;
  color: var(--muted);
}

.loading {
  text-align: center;
  padding: 20px;
  color: var(--muted);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-text {
  font-size: 14px;
  color: var(--muted);
}
</style>

















