<template>
  <view class="page" :style="bgStyle">
    <!-- 顶部搜索栏 -->
    <view class="search-header">
      <view class="search-bar">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="search-input-wrapper">
          <text class="search-icon">🔍</text>
          <input 
            v-model="searchText" 
            class="search-input" 
            :placeholder="queryParams.type === 'community' ? '搜索社区帖子' : queryParams.type === 'audio' ? '搜索白噪音/专辑/作者' : '搜索白噪音/专辑/作者'"
            @confirm="handleSearch"
            @input="handleInput"
            focus
          />
          <view v-if="searchText" class="clear-btn" @click="clearSearch">
            <text class="clear-icon">×</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索内容区域 -->
    <scroll-view class="search-content" scroll-y @scrolltolower="loadMore" lower-threshold="80">
      <!-- 热门搜索 -->
      <view v-if="!searchText" class="section">
        <text class="section-title">热门搜索</text>
        <view class="hot-tags">
          <view 
            v-for="(tag, index) in hotTags" 
            :key="typeof tag === 'object' ? tag.keyword : index" 
            class="tag"
            @click="searchByHotTag(tag)"
          >
            <text class="tag-text">{{ getHotTagKeyword(tag) }}</text>
            <text v-if="getHotTagCount(tag)" class="tag-count">{{ getHotTagCount(tag) }}</text>
          </view>
        </view>
      </view>

      <!-- 搜索历史 -->
      <view v-if="!searchText && searchHistory.length > 0" class="section">
        <view class="section-header">
          <text class="section-title">搜索历史</text>
          <view class="clear-history" @click="clearHistory">
            <text class="clear-text">清空</text>
          </view>
        </view>
        <view class="history-list">
          <view 
            v-for="(item, index) in searchHistory" 
            :key="typeof item === 'object' ? item.id : index" 
            class="history-item"
            @click="searchByHistoryItem(item)"
          >
            <text class="history-icon">🕒</text>
            <view class="history-content">
              <text class="history-text">{{ getHistoryDisplayInfo(item).keyword }}</text>
              <view class="history-meta">
                <text v-if="getHistoryDisplayInfo(item).targetType" class="history-type">{{ getHistoryDisplayInfo(item).targetType }}</text>
                <text v-if="getHistoryDisplayInfo(item).createdAt" class="history-time">{{ getHistoryDisplayInfo(item).createdAt }}</text>
              </view>
            </view>
            <view class="delete-btn" @click.stop="deleteHistoryItem(item)">
              <text class="delete-icon">×</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 搜索结果 -->
      <view v-if="searchText" class="section">
        <view class="section-header">
          <text class="section-title">搜索结果</text>
          <view v-if="queryParams.type === 'community'" class="back-community" @click="goToCommunity">
            <text class="back-text">返回社区</text>
          </view>
        </view>
        <view class="search-results">
          <view 
            v-for="result in searchResults" 
            :key="result.id"
            class="result-item"
            @click="result.type==='audio' ? playResult(result) : openPost(result)"
          >
            <view class="result-info">
              <text class="result-name">{{ result.name }}</text>
              <text class="result-author">{{ result.author }}</text>
              <view v-if="result.type==='post'" class="post-stats">
                <text class="stat">❤ {{ result.favorite_count }}</text>
                <text class="dot">·</text>
                <text class="stat">💬 {{ result.comment_count }}</text>
              </view>
            </view>
            <text class="play-icon">{{ result.type==='audio' ? '▶' : '↗' }}</text>
          </view>
        </view>
        
        <view v-if="searchResults.length === 0" class="empty-state">
          <text class="empty-icon">🔍</text>
          <text class="empty-text">暂无搜索结果</text>
          <text class="empty-desc">换个关键词试试吧</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { useThemeStore } from '@/stores/theme'
import * as apiSearch from '@/api/search'
import * as apiCommunity from '@/api/community'
import * as apiNoiseSearch from '@/api/noiseSearch'

const themeStore = useThemeStore(); themeStore.load()
const { bgStyle } = useGlobalTheme()

// 获取页面参数
const queryParams = defineProps({
  type: {
    type: String,
    default: 'all' // 'all' | 'community' | 'audio'
  }
})

// 搜索相关数据
const searchText = ref('')
const searchHistory = ref([])
const lastSearchKeyword = ref('')

// 热门搜索标签
const hotTags = ref([])

// 后端搜索结果与分页
const searchResults = ref([])
const page = ref(1)
const limit = ref(20)
const loading = ref(false)
const hasMore = ref(true)
const errorMsg = ref('')

// 页面加载时获取热门搜索和搜索历史
onMounted(async () => {
  try {
    // 根据搜索类型获取热门搜索
    let hotRes = []
    if (queryParams.type === 'audio') {
      // 白噪音热门搜索
      hotRes = await apiNoiseSearch.getHotSearch()
    } else {
      // 社区热门搜索
      hotRes = await apiSearch.getHotSearch()
    }
    hotTags.value = Array.isArray(hotRes) ? hotRes : (hotRes.data || hotRes.items || [])
    
    // 如果没有获取到热门搜索数据，使用默认值
    if (hotTags.value.length === 0) {
      hotTags.value = ['海浪', '雨声', '自然声', '睡眠']
    }
    
    // 根据搜索类型获取搜索历史
    let historyRes = []
    if (queryParams.type === 'audio') {
      // 白噪音搜索历史
      historyRes = await apiNoiseSearch.getSearchHistory()
    } else {
      // 社区搜索历史
      historyRes = await apiSearch.getSearchHistory()
    }
    searchHistory.value = Array.isArray(historyRes) ? historyRes : (historyRes.data || historyRes.items || [])
  } catch (e) {
    console.error('[search] init failed', e)
    // 使用默认值
    hotTags.value = ['海浪', '雨声', '壁炉', '树林', '地铁', '自然声', '居家', '环境', '睡眠', '放松', '专注', '冥想']
    searchHistory.value = ['海浪', '雨声', '自然声', '睡眠']
  }
})

async function doSearch(reset = true){
  const kw = searchText.value.trim()
  if(!kw){
    searchResults.value = []
    hasMore.value = true
    page.value = 1
    return
  }
  if(loading.value) return
  loading.value = true
  errorMsg.value = ''
  try{
    if(reset){ page.value = 1; hasMore.value = true; searchResults.value = [] }
    
    let list = []
    // 根据搜索类型调用不同的API
    if (queryParams.type === 'community') {
      // 社区帖子搜索
      const res = await apiCommunity.searchCommunityPosts({ q: kw, page: page.value, limit: limit.value })
      list = Array.isArray(res) ? res : (res.data || res.items || res.list || [])
    } else if (queryParams.type === 'audio') {
      // 白噪音搜索
      const res = await apiNoiseSearch.searchNoises({ keyword: kw, limit: limit.value, offset: (page.value - 1) * limit.value })
      console.log('[search] audio search response:', res) // 添加日志查看返回数据格式
      
      // 添加错误处理：检查响应状态
      if (res && res.statusCode >= 400) {
        throw new Error(`搜索服务错误: ${res.statusCode} ${res.data?.message || res.data?.error || '未知错误'}`)
      }
      
      list = Array.isArray(res) ? res : (res.data || res.items || res.list || [])
    } else {
      // 全局搜索
      const res = await apiSearch.searchAll({ q: kw, page: page.value, limit: limit.value })
      // 兼容返回格式：{audios|posts|items|data[]} 或 {code, data:{ list|items|rows }} 或纯数组
      const top = (res?.audios ?? res?.posts ?? res?.items ?? res?.data)
      if(Array.isArray(top)){
        list = top
      } else if(Array.isArray(res)){
        list = res
      } else if(top && typeof top === 'object'){
        const inner = top.list ?? top.items ?? top.rows ?? top.data
        if(Array.isArray(inner)) list = inner
      }
    }
    
    // 过滤掉ID无效的帖子
    const filteredList = list.filter(it => {
      // 对于帖子类型，确保有有效的数字ID
      if (it.type === 'post' || (!it.type && (it.post_id || it.id || it._id))) {
        const id = it.post_id || it.id || it._id;
        return id && /^\d+$/.test(String(id));
      }
      // 对于其他类型，直接通过
      return true;
    });
    
    const mapped = filteredList.map(it=>({
      // 支持音频与帖子两类数据
      // 根据搜索类型来判断数据类型，避免混淆
      type: queryParams.type === 'audio' ? 'audio' : 
            (it.type || (it.audio_id || it.duration || it.file_url ? 'audio' : 'post')),
      // 确保ID是有效的数字
      id: (it.post_id && /^\d+$/.test(String(it.post_id))) ? Number(it.post_id) : 
          (it.audio_id && /^\d+$/.test(String(it.audio_id))) ? Number(it.audio_id) : 
          (it.id && /^\d+$/.test(String(it.id))) ? Number(it.id) : 
          (it._id && /^\d+$/.test(String(it._id))) ? Number(it._id) : 
          null,
      name: it.title || it.name || it.content?.slice(0, 28) || '-',
      author: it.author || it.user_name || it.username || (it.author?.name) || '用户',
      cover: it.cover || it.cover_url || it.image || it.thumb || '',
      duration: it.duration || it.duration_seconds || it.durationSeconds || 0,
      favorite_count: it.favorite_count ?? it.like_count ?? it.likes ?? 0,
      comment_count: it.comment_count ?? it.commentCount ?? (Array.isArray(it.comments) ? it.comments.length : 0),
      content: it.content || '',
    })).filter(it => {
      // 在音频搜索模式下，只保留音频类型的数据
      if (queryParams.type === 'audio') {
        return it.type === 'audio';
      }
      // 在社区搜索模式下，过滤掉帖子类型但没有有效ID的项
      return it.type !== 'post' || it.id !== null;
    })
    
    console.log('[search] mapped results:', mapped) // 添加日志查看映射后的数据
    searchResults.value = reset ? mapped : searchResults.value.concat(mapped)
    hasMore.value = mapped.length >= limit.value
    if(hasMore.value){ page.value += 1 }
  }catch(e){ 
    errorMsg.value = String(e?.message || e)
    console.error('[search] error', e)
    
    // 尝试解析详细的错误信息
    let errorMessage = errorMsg.value
    try {
      const errorObj = JSON.parse(errorMsg.value)
      if (errorObj.statusCode) {
        errorMessage = `搜索服务错误 ${errorObj.statusCode}: ${errorObj.message || '未知错误'}`
      }
    } catch (parseError) {
      // 解析失败，使用原始错误信息
    }
    
    // 如果是后端返回的特定错误，给出更友好的提示
    if (errorMessage.includes('帖子ID格式无效')) {
      uni.showToast({ title: '搜索结果中包含格式错误的数据，请稍后重试', icon: 'none' })
    } else if (errorMessage.includes('搜索服务错误')) {
      uni.showToast({ title: '搜索服务暂时不可用，请稍后重试', icon: 'none' })
    } else if (errorMessage.includes('Internal Server Error') || errorMessage.includes('500')) {
      uni.showToast({ title: '服务器开小差了，请稍后重试', icon: 'none' })
    } else {
      uni.showToast({ title: errorMessage, icon: 'none' })
    }
  } finally { 
    loading.value = false 
  }
}

function loadMore(){ if(hasMore.value && !loading.value) doSearch(false) }

// 返回上一页
function goBack() {
  try {
    uni.navigateBack()
  } catch(e) {
    if(typeof location !== 'undefined') location.hash = '#/pages/noise/Free'
  }
}

// 处理搜索
async function handleSearch() {
  const kw = searchText.value.trim()
  if (!kw) return
  // 清除输入防抖定时器，避免重复搜索
  if(inputTimer) {
    clearTimeout(inputTimer)
    inputTimer = null
  }
  await addToHistory(kw)
  doSearch(true)
}

// 处理输入
let inputTimer = null
function handleInput() {
  if(inputTimer) clearTimeout(inputTimer)
  inputTimer = setTimeout(async ()=>{
    const kw = searchText.value.trim()
    if(kw){
      // 检查是否与上一次搜索相同，避免重复请求
      if (lastSearchKeyword.value === kw) return
      lastSearchKeyword.value = kw
      await addToHistory(kw)
      doSearch(true)
    } else {
      searchResults.value = []
      page.value = 1
      hasMore.value = true
      errorMsg.value = ''
    }
  }, 800) // 增加到800ms，减少请求频率
}

// 清空搜索
function clearSearch() {
  searchText.value = ''
  searchResults.value = []
  page.value = 1
  hasMore.value = true
  errorMsg.value = ''
}

// 通过标签搜索
async function searchByTag(tag) {
  searchText.value = tag
  // 更新最后搜索关键词
  lastSearchKeyword.value = tag
  await addToHistory(tag)
  doSearch(true)
}

// 通过热门标签搜索
function searchByHotTag(tag) {
  let query = '';
  if (typeof tag === 'string') {
    query = tag;
  } else if (typeof tag === 'object') {
    query = tag.keyword || tag.query || tag.content || tag.name || '';
  }
  
  if (query) {
    searchText.value = query;
    // 更新最后搜索关键词
    lastSearchKeyword.value = query;
    addToHistory(query);
    doSearch(true);
  }
}

// 获取热门标签的关键词
function getHotTagKeyword(tag) {
  if (typeof tag === 'string') {
    return tag;
  } else if (typeof tag === 'object') {
    return tag.keyword || tag.query || tag.content || tag.name || '';
  }
  return '';
}

// 获取热门标签的搜索次数
function getHotTagCount(tag) {
  if (typeof tag === 'object' && tag.search_count) {
    return tag.search_count;
  }
  return '';
}

// 通过历史记录项搜索
function searchByHistoryItem(item) {
  let query = '';
  if (typeof item === 'string') {
    query = item;
  } else if (typeof item === 'object') {
    query = item.keyword || item.query || item.content || item.name || '';
  }
  
  if (query) {
    searchText.value = query;
    // 更新最后搜索关键词
    lastSearchKeyword.value = query;
    addToHistory(query);
    doSearch(true);
  }
}

// 获取历史记录中的关键词
function getHistoryKeyword(item) {
  if (typeof item === 'string') {
    return item;
  } else if (typeof item === 'object') {
    return item.keyword || item.query || item.content || item.name || '';
  }
  return '';
}

// 获取历史记录中的目标类型
function getHistoryTargetType(item) {
  if (typeof item === 'object' && item.target_type) {
    const typeMap = {
      'post': '帖子',
      'audio': '音频',
      'user': '用户'
    };
    return typeMap[item.target_type] || item.target_type;
  }
  return '';
}

// 获取历史记录的详细信息用于显示
function getHistoryDisplayInfo(item) {
  if (typeof item === 'string') {
    return {
      keyword: item,
      targetType: '',
      createdAt: ''
    };
  } else if (typeof item === 'object') {
    const typeMap = {
      'post': '帖子',
      'audio': '音频',
      'user': '用户'
    };
    
    // 格式化创建时间
    let createdAt = '';
    if (item.created_at || item.createdAt) {
      const dateStr = item.created_at || item.createdAt;
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        createdAt = `${month}-${day} ${hours}:${minutes}`;
      }
    }
    
    return {
      keyword: item.keyword || item.query || item.content || item.name || '',
      targetType: item.target_type ? (typeMap[item.target_type] || item.target_type) : '',
      createdAt: createdAt
    };
  }
  return {
    keyword: '',
    targetType: '',
    createdAt: ''
  };
}

// 添加到搜索历史
async function addToHistory(query) {
  if (!query.trim()) return
  
  try {
    // 根据搜索类型调用不同的API记录搜索行为
    if (queryParams.type === 'audio') {
      // 白噪音搜索记录
      await apiNoiseSearch.recordSearch(query)
    } else if (queryParams.type === 'community') {
      // 社区搜索记录
      await apiSearch.recordSearch(query)
    } else {
      // 默认使用社区搜索记录
      await apiSearch.recordSearch(query)
    }
  } catch (e) {
    console.warn('[search] record search failed', e)
  }
  
  // 更新本地搜索历史
  // 移除重复项
  searchHistory.value = searchHistory.value.filter(item => {
    if (typeof item === 'string') {
      return item !== query;
    } else if (typeof item === 'object') {
      return (item.keyword || item.query || item.content || item.name || '') !== query;
    }
    return true;
  });
  
  // 添加到开头（作为字符串添加，保持简洁）
  searchHistory.value.unshift(query);
  
  // 限制历史记录数量
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10);
  }
}

// 删除单个历史记录
async function deleteHistoryItem(item) {
  try {
    // 如果搜索历史记录是对象且包含ID，则调用API删除
    if (typeof item === 'object' && item.id) {
      // 根据搜索类型调用不同的API删除搜索历史记录
      if (queryParams.type === 'audio') {
        // 白噪音搜索历史删除
        await apiNoiseSearch.deleteSearchHistoryRecord(item.id);
      } else if (queryParams.type === 'community') {
        // 社区搜索历史删除
        await apiSearch.deleteSearchHistoryRecord(item.id);
      } else {
        // 默认使用社区搜索历史删除
        await apiSearch.deleteSearchHistoryRecord(item.id);
      }
    }
    
    // 更新本地搜索历史
    if (typeof item === 'object' && item.id) {
      searchHistory.value = searchHistory.value.filter(history => 
        !(typeof history === 'object' && history.id === item.id)
      );
    } else {
      const query = typeof item === 'string' ? item : (item.keyword || item.query || item.content || item.name || '');
      searchHistory.value = searchHistory.value.filter(history => {
        if (typeof history === 'string') {
          return history !== query;
        } else if (typeof history === 'object') {
          return (history.keyword || history.query || history.content || history.name || '') !== query;
        }
        return true;
      });
    }
  } catch (e) {
    console.error('[search] delete history item failed', e);
    uni.showToast({ title: '删除失败', icon: 'none' });
  }
}

// 清空历史记录
function clearHistory() {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有搜索历史吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 根据搜索类型调用不同的API清空搜索历史
          if (queryParams.type === 'audio') {
            // 白噪音搜索历史清空
            await apiNoiseSearch.clearSearchHistory()
          } else if (queryParams.type === 'community') {
            // 社区搜索历史清空
            await apiSearch.clearSearchHistory()
          } else {
            // 默认使用社区搜索历史清空
            await apiSearch.clearSearchHistory()
          }
          searchHistory.value = []
        } catch (e) {
          console.error('[search] clear history failed', e)
          uni.showToast({ title: '清空失败', icon: 'none' })
        }
      }
    }
  })
}

// 播放搜索结果
function playResult(result) {
  console.log('[search] playResult called with:', result);
  
  // 检查ID是否已在搜索结果映射阶段正确设置
  let id = null;
  if (result.id && /^\d+$/.test(String(result.id))) {
    id = Number(result.id);
  }
  
  console.log('[search] parsed id:', id);
  
  if(id){
    // 跳转到播放器页面并传递音频ID
    console.log('[search] navigating to player with id:', id);
    uni.navigateTo({ url: `/pages/player/index?id=${id}` })
  } else {
    console.log('[search] invalid audio id, showing toast');
    uni.showToast({ title:'音频ID无效', icon:'none' })
  }
}

function openPost(result){
  console.log('[search] openPost called with:', result);
  
  // 确保ID是有效的数字
  let id = null;
  if (result.id && /^\d+$/.test(String(result.id))) {
    id = Number(result.id);
  } else if (result.post_id && /^\d+$/.test(String(result.post_id))) {
    id = Number(result.post_id);
  }
  
  console.log('[search] parsed post id:', id);
  
  if(id){
    uni.navigateTo({ url: `/pages/community/detail?id=${id}` })
  } else {
    // 提供更具体的错误信息
    if (queryParams.type === 'audio') {
      uni.showToast({ title:'搜索结果类型错误，请重新搜索', icon:'none' })
    } else {
      uni.showToast({ title:'帖子ID无效', icon:'none' })
    }
  }
}

function goToCommunity(){
  uni.navigateTo({ url: '/pages/community/index' })
}

</script>

<style scoped>
.page { min-height: 100vh; }

/* 顶部搜索栏 */
.search-header {
  background: var(--card-bg, #ffffff);
  border-bottom: 1px solid var(--border, #f0f0f0);
  position: sticky;
  top: 0;
  z-index: 100;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.back-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--input-bg, #f8f9fa);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.back-icon {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg, #333);
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  background: var(--input-bg, #f8f9fa);
  border-radius: 20px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-icon {
  font-size: 16px;
  color: var(--muted, #999);
}

.search-input {
  flex: 1;
  height: 40px;
  font-size: 16px;
  color: var(--fg, #333);
  background: transparent;
  border: none;
  outline: none;
}

.clear-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--muted, #ccc);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:active {
  transform: scale(0.9);
}

.clear-icon {
  font-size: 16px;
  color: white;
  font-weight: bold;
}

/* 搜索内容区域 */
.search-content {
  flex: 1;
  padding: 16px;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg, #333);
  margin-bottom: 12px;
  display: block;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.clear-history {
  padding: 4px 8px;
  background: var(--input-bg, #f8f9fa);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-history:active {
  transform: scale(0.95);
}

.clear-text {
  font-size: 12px;
  color: var(--muted, #999);
}

.back-community {
  padding: 4px 8px;
  background: var(--input-bg, #f8f9fa);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-community:active {
  transform: scale(0.95);
}

.back-text {
  font-size: 12px;
  color: var(--muted, #999);
}

/* 热门搜索标签 */
.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 8px 16px;
  background: var(--input-bg, #f8f9fa);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tag:active {
  transform: scale(0.95);
  background: var(--uni-color-primary, #007aff);
}

.tag:active .tag-text {
  color: white;
}

.tag-text {
  font-size: 14px;
  color: var(--fg, #333);
}

.tag-count {
  font-size: 12px;
  color: var(--muted, #999);
  background: var(--card-bg, #ffffff);
  padding: 2px 6px;
  border-radius: 10px;
}

/* 搜索历史 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border, #f0f0f0);
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:active {
  background: var(--input-bg, #f8f9fa);
}

.history-icon {
  font-size: 16px;
  margin-right: 12px;
  color: var(--muted, #999);
}

.history-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-text {
  font-size: 14px;
  color: var(--fg, #333);
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-type {
  font-size: 12px;
  color: var(--uni-color-primary, #007aff);
  background: var(--input-bg, #f8f9fa);
  padding: 2px 6px;
  border-radius: 4px;
}

.history-time {
  font-size: 12px;
  color: var(--muted, #999);
}

.delete-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--input-bg, #f8f9fa);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:active {
  transform: scale(0.9);
}

.delete-icon {
  font-size: 16px;
  color: var(--muted, #999);
  font-weight: bold;
}

/* 搜索结果 */
.search-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--card-bg, #ffffff);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 100%; /* 添加最大宽度限制 */
  box-sizing: border-box; /* 确保padding包含在宽度内 */
}

.result-item:active {
  transform: scale(0.98);
  background: var(--input-bg, #f8f9fa);
}

.result-cover {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  margin-right: 12px;
  flex-shrink: 0; /* 防止图片被压缩 */
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0; /* 允许子元素收缩以适应容器 */
}

.result-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg, #333);
  white-space: nowrap; /* 防止换行 */
  overflow: hidden; /* 隐藏溢出内容 */
  text-overflow: ellipsis; /* 显示省略号 */
}

.result-author {
  font-size: 14px;
  color: var(--muted, #666);
  white-space: nowrap; /* 防止换行 */
  overflow: hidden; /* 隐藏溢出内容 */
  text-overflow: ellipsis; /* 显示省略号 */
}

.post-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--muted, #999);
}

.stat {
  font-size: 12px;
  color: var(--muted, #999);
}

.dot {
  font-size: 12px;
  color: var(--muted, #ccc);
}

.play-icon {
  font-size: 16px;
  color: var(--uni-color-primary, #007aff);
  padding: 8px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: var(--muted, #666);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--muted, #999);
}
</style>