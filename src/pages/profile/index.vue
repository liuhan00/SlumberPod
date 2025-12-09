<template>
  <scroll-view class="page" scroll-y :style="pageStyle">
    <!-- 头像背景主题头图 -->
    <view class="hero">
      <view class="hero-bg"></view>
      <view class="hero-content">
        <ProfileHeader :avatar="user.avatar || ''" :nickname="user.nickname || ''" />
      </view>
    </view>

    <view class="auth-actions" style="padding:12px 16px;">
      <!-- 登录/注册 按钮已移除。若已登录显示用户信息与退出 -->
      <view v-if="authUser && (authUser.name || authUser.id)">
        <text>已登录：{{ authUser.name || authUser.id }}</text>
      </view>
    </view>

    <StatsGrid :stats="user.stats || { totalSleepHours: 0, totalSessions: 0, favoriteCategory: '' }" />

    <view class="section">
      <SettingsList v-if="!showHistory" :settings="settings" @select="onSetting" />

      <view v-else>
        <view class="header">
          <text class="title">播放历史</text>
        </view>
        <view v-if="loading" class="loading">加载中...</view>
        <view v-else>
          <view v-if="list.length === 0" class="empty">暂无播放记录</view>
          <view v-for="item in list" :key="item.id || item.trackId || item.uuid" class="history-item">
            <text class="name">{{ item.trackName || item.title || item.name }}</text>
            <text class="meta">{{ formatDate(item.playedAt || item.createdAt || item.time) }}</text>
          </view>
        </view>
        <button class="btn" @click="closeHistory">返回</button>
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import ProfileHeader from '@/components/ProfileHeader.vue'
import StatsGrid from '@/components/StatsGrid.vue'
import SettingsList from '@/components/SettingsList.vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { getAuthLocal } from '@/store/auth'
import { ref, computed, onMounted } from 'vue'
import { getWhiteNoiseHistory } from '@/api/whiteNoise'
import { getProfile } from '@/api/users'
const { bgStyle } = useGlobalTheme()

const userStore = useUserStore()
const { avatar, nickname, stats } = storeToRefs(userStore)

// 在页面加载时获取最新的用户资料
onMounted(async () => {
  try {
    // 调用后端接口获取最新的用户资料
    const profileData = await getProfile()
    console.log('[Profile Page] 获取到的用户资料:', profileData)
    
    // 更新用户store中的数据
    if (profileData && typeof profileData === 'object') {
      userStore.applyAuth(profileData)
    }
  } catch (error) {
    console.error('[Profile Page] 加载用户资料失败:', error)
  }
})

const user = computed(() => {
  try {
    return { 
      avatar: (avatar.value !== undefined) ? avatar.value : '', 
      nickname: (nickname.value !== undefined) ? nickname.value : '', 
      stats: (stats.value !== undefined) ? stats.value : { totalSleepHours: 0, totalSessions: 0, favoriteCategory: '' }
    }
  } catch (e) {
    return { 
      avatar: '', 
      nickname: '', 
      stats: { totalSleepHours: 0, totalSessions: 0, favoriteCategory: '' }
    }
  }
})

const pageStyle = bgStyle

// auth state
const authUser = ref(getAuthLocal())

// play history state
const showHistory = ref(false)
const list = ref([])
const loading = ref(false)
const error = ref(null)

async function loadHistory(){
  loading.value = true
  error.value = null
  try{
    // 调用白噪音组合播放历史接口
    console.log('[Profile] 加载白噪音组合播放历史')
    const data = await getWhiteNoiseHistory({ offset: 0, limit: 100 })
    console.log('[Profile] 播放历史数据:', data)
    
    // 确保返回的是数组
    list.value = Array.isArray(data) ? data : []
    
    if(list.value.length === 0){
      console.log('[Profile] 播放历史为空')
    }
  }catch(e){ 
    error.value = e.message || String(e)
    console.error('[Profile] 获取播放历史失败:', e)
    
    // 显示友好的错误提示
    uni.showToast({ 
      title: error.value || '获取播放历史失败', 
      icon: 'none', 
      duration: 2000 
    })
  }
  finally{ loading.value = false }
}

function openLogin(){ try{ uni.navigateTo({ url:'/pages/auth/Login' }) }catch(e){ location.hash='#/pages/auth/Login' } }
function openRegister(){ try{ uni.navigateTo({ url:'/pages/auth/Register' }) }catch(e){ location.hash='#/pages/auth/Register' } }

const settings = [
  { key:'favorites', label:'我喜欢的' },
  { key:'history', label:'播放历史' },
  { key:'study', label:'我的学习' },
  { key:'community', label:'社区动态' },
  { key:'account', label:'账号资料' },
  { key:'help', label:'帮助与客服' },
  { key:'about', label:'关于 星眠坞' },
]

function go(url){
  if(typeof location !== 'undefined') location.hash = `#/${url}`
  try { uni.navigateTo({ url }) }
  catch(e){ try { uni.navigateTo({ url: url.startsWith('/')? url.replace('/','') : `/${url}` }) } catch(err){} }
}

function onSetting(key){
  console.log('[profile] onSetting:', key)
  if(key==='favorites') go('/pages/favorites/index')
  else if(key==='history') { showHistory.value = true; loadHistory() }
  else if(key==='study') go('/pages/profile/pages/study/index')
  else if(key==='community') go('/pages/profile/pages/creations/index') // 导航到社区动态页面
  else if(key==='account') go('/pages/profile/pages/account/index')
  else if(key==='help') go('/pages/help/index')
  else if(key==='about') go('/pages/about/index')
  else if(key==='queue') go('/pages/queue/index')
  else if(key==='nickname') uni.showToast({ title:'请在后续版本中支持修改昵称', icon:'none' })
}

function closeHistory(){ showHistory.value = false; list.value = [] }

function formatDate(dateString) {
  if (!dateString) return '未知时间'
  // 简单的时间格式化函数
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
</script>

<style scoped>
.page{ min-height:100vh }
.section{ padding: 12px 16px }
.hero{ position:relative; height:200px; overflow:hidden; border-bottom-left-radius:24px; border-bottom-right-radius:24px }
.hero-bg{ position:absolute; inset:0; width:100%; height:100%; background: linear-gradient(135deg, #add8e6, #87ceeb); }
.hero-content{ position:relative }
.header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:16px }
.title{ font-size:20px; font-weight:700; color: var(--fg) }
.loading, .empty{ text-align:center; padding:40px 20px; color:var(--muted) }
.history-item{ display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border) }
.name{ font-size:16px; color: var(--fg); flex:1 }
.meta{ font-size:14px; color:var(--muted) }
.btn{ width:100%; padding:12px; background:var(--input-bg); color:var(--fg); border:none; border-radius:8px; margin-top:16px }
.footer{ text-align:center; padding:20px 0; color:var(--muted) }
.copyright, .version{ display:block; font-size:12px; margin:4px 0 }
</style>
