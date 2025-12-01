<template>
  <view class="page" :style="bgStyle">
    <view class="header">
      <text class="title">睡眠故事</text>
      <!-- 分类标签 -->
      <scroll-view class="category-tabs" scroll-x>
        <view 
          v-for="(category, index) in categoryNames" 
          :key="index"
          :class="['category-tab', { active: selectedCategoryIndex === index }]"
          @click="onCategoryClick(index)"
        >
          {{ category }}
        </view>
      </scroll-view>
    </view>

    <scroll-view class="stories-list" scroll-y @scrolltolower="loadMore">
      <view 
        v-for="story in stories" 
        :key="story.id"
        class="story-item"
        @click="viewStory(story)"
      >
        <view class="story-cover" :style="{ backgroundImage: story.cover ? `url(${story.cover})` : 'none' }">
          <text v-if="!story.cover" class="cover-placeholder">📖</text>
        </view>
        <view class="story-info">
          <text class="story-title">{{ story.title }}</text>
          <text class="story-desc">{{ story.description || story.summary }}</text>
          <view class="story-meta">
            <text class="story-duration">{{ formatDuration(story.duration) }}</text>
            <text class="story-views" v-if="story.play_count">{{ story.play_count }}次播放</text>
          </view>
        </view>
      </view>
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-if="stories.length === 0 && !loading" class="empty-state">
        <text class="empty-text">暂无故事</text>
      </view>
      <view v-if="!hasMore && stories.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { getStoryCategories, getStoriesByCategory } from '@/api/stories'

const { bgStyle } = useGlobalTheme()

const stories = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const categories = ref([])
const selectedCategory = ref('')
const selectedCategoryIndex = ref(0)

// 计算属性：分类名称列表
const categoryNames = computed(() => {
  const names = ['全部']
  categories.value.forEach((cat, index) => {
    // 将英文分类名映射为中文显示名称
    const categoryMap = {
      'sleep': '睡眠',
      'meditation': '冥想',
      'fairy_tale': '童话'
    }
    const rawName = cat.displayName || cat.category || cat.name || cat.title || `分类${index + 1}`
    const displayName = categoryMap[rawName] || rawName
    names.push(displayName)
    console.log(`[Stories] 计算分类名称 ${index}:`, displayName, 'from:', cat)
  })
  console.log('[Stories] 最终分类名称列表:', names)
  return names
})

function formatDuration(duration) {
  if (!duration) return '未知时长'
  
  // 如果是数字，转换为分钟
  if (typeof duration === 'number') {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return seconds > 0 ? `${minutes}分${seconds}秒` : `${minutes}分钟`
  }
  
  // 如果已经是字符串格式
  if (typeof duration === 'string') {
    return duration
  }
  
  return '未知时长'
}

function onCategoryClick(index) {
  if (selectedCategoryIndex.value === index) return
  
  selectedCategoryIndex.value = index
  
  if (index === 0) {
    // 全部分类 - 获取所有故事
    selectedCategory.value = 'all'
  } else {
    selectedCategory.value = categories.value[index - 1].category || categories.value[index - 1].name || categories.value[index - 1].title
  }
  
  console.log('[Stories] 点击分类:', index, '选中分类:', selectedCategory.value)
  resetAndLoad()
}



async function resetAndLoad() {
  stories.value = []
  page.value = 1
  hasMore.value = true
  await loadStories()
}

async function loadStories() {
  if (loading.value || !hasMore.value) return
  
  console.log('[Stories] loadStories - 开始加载故事列表', {
    selectedCategory: selectedCategory.value,
    page: page.value
  })
  
  try {
    loading.value = true
    
    let response
    if (selectedCategory.value) {
      // 按分类加载
      console.log('[Stories] 按分类加载故事:', selectedCategory.value)
      response = await getStoriesByCategory(selectedCategory.value, page.value, 20)
    } else {
      // 全部分类 - 可以根据后端支持调用默认接口
      console.log('[Stories] 加载全部故事')
      try {
        // 尝试调用默认接口，如果失败则返回空数组
        response = await getStoriesByCategory('default', page.value, 20)
      } catch (error) {
        console.log('[Stories] 默认接口不可用，显示空列表')
        response = []
      }
    }
    
    console.log('[Stories] 故事数据响应:', response)
    
    // 处理响应数据
    const newStories = Array.isArray(response) ? response : (response.list || response.data || [])
    console.log('[Stories] 处理后的故事数据:', newStories)
    
    if (page.value === 1) {
      stories.value = newStories
    } else {
      stories.value.push(...newStories)
    }
    
    // 判断是否还有更多数据
    hasMore.value = newStories.length >= 20 && (response.hasMore !== false)
    
    console.log('[Stories] 故事加载完成, 数量:', newStories.length, '总共:', stories.value.length)
    
  } catch (error) {
    console.error('[Stories] loadStories error:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
      duration: 2000
    })
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (hasMore.value && !loading.value) {
    page.value += 1
    loadStories()
  }
}

function viewStory(story) {
  console.log('[Stories] viewStory:', story)
  
  // 如果没有真实的 story.id，使用临时测试数据
  const storyId = story.id || '1' // 临时使用固定ID测试
  const storyTitle = story.title || '测试故事'
  
  console.log('[Stories] 跳转到详情页:', { id: storyId, title: storyTitle })
  
  uni.navigateTo({ 
    url: `/pages/sleep/StoryDetail?id=${storyId}&title=${encodeURIComponent(storyTitle)}`
  })
}

async function loadCategories() {
  console.log('[Stories] loadCategories - 开始加载分类')
  try {
    const categoriesData = await getStoryCategories()
    console.log('[Stories] 分类数据响应:', categoriesData)
    console.log('[Stories] 数据类型:', typeof categoriesData)
    console.log('[Stories] 是否为数组:', Array.isArray(categoriesData))
    
    if (Array.isArray(categoriesData)) {
      categories.value = categoriesData.map((cat, index) => {
        console.log(`[Stories] 分类 ${index}:`, cat, 'category:', cat.category, 'name:', cat.name, 'title:', cat.title)
        return {
          ...cat,
          displayName: cat.category || cat.name || cat.title || `分类${index + 1}`
        }
      })
      console.log('[Stories] loaded categories:', categories.value)
    } else if (categoriesData && typeof categoriesData === 'object') {
      // 如果是对象，尝试获取数组属性
      const possibleArrays = ['data', 'list', 'categories', 'result']
      for (const prop of possibleArrays) {
        if (Array.isArray(categoriesData[prop])) {
          console.log(`[Stories] 在属性 ${prop} 中找到数组数据:`, categoriesData[prop])
          categories.value = categoriesData[prop]
          break
        }
      }
    } else {
      console.warn('[Stories] 分类数据不是预期的格式:', categoriesData)
      // 手动添加一个默认分类，避免界面空白
      categories.value = [{ name: '全部', title: '全部' }]
    }
  } catch (error) {
    console.error('[Stories] loadCategories error:', error)
    // 分类加载失败不影响故事列表加载
    categories.value = [{ name: '全部', title: '全部' }]
    uni.showToast({
      title: '分类加载失败',
      icon: 'none',
      duration: 1500
    })
  }
}



onMounted(async () => {
  console.log('[Stories] onMounted - 开始加载数据')
  try {
    // 先加载分类，再加载全部故事列表
    await loadCategories()
    console.log('[Stories] 分类加载完成，开始加载全部故事列表')
    selectedCategory.value = 'all'
    await loadStories()
    console.log('[Stories] 故事列表加载完成')
  } catch (error) {
    console.error('[Stories] onMounted error:', error)
    uni.showToast({
      title: '数据加载失败',
      icon: 'none',
      duration: 2000
    })
  }
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

.category-tabs {
  display: flex;
  white-space: nowrap;
  margin-bottom: 16px;
  padding: 4px 0;
}

.category-tab {
  display: inline-block;
  padding: 8px 16px;
  margin-right: 8px;
  border-radius: 20px;
  background: var(--input-bg);
  color: var(--muted);
  font-size: 14px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.category-tab.active {
  background: #7B61FF;
  color: #fff;
}

.stories-list {
  margin-top: 16px;
  max-height: calc(100vh - 280px);
}

.story-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--card-bg);
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.story-item:active {
  transform: scale(0.98);
  opacity: 0.8;
}

.story-cover {
  width: 160rpx;
  height: 120rpx;
  border-radius: 8px;
  background: var(--input-bg);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder {
  font-size: 32rpx;
  color: var(--muted);
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
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
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
  line-height: 1.4;
}

.story-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.story-duration {
  font-size: 12px;
  color: var(--muted);
}

.story-views {
  font-size: 12px;
  color: var(--muted);
  background: rgba(123, 97, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
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

.no-more {
  text-align: center;
  padding: 20px;
  color: var(--muted);
  font-size: 14px;
}
</style>

















