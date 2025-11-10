<template>
  <scroll-view class="page" scroll-y :style="pageStyle">
    <!-- 头像背景主题头图 -->
    <view class="hero">
      <image class="hero-bg" :src="user.avatar" mode="aspectFill" />
      <view class="hero-overlay"></view>
      <view class="hero-content">
        <ProfileHeader :avatar="user.avatar" :nickname="user.nickname" />
      </view>
    </view>

    <view class="auth-actions" style="padding:12px 16px;">
      <!-- 登录/注册 按钮已移除。若已登录显示用户信息与退出 -->
      <view v-if="authUser">
        <text>已登录：{{ authUser.name || authUser.id }}</text>
        <button class="btn" @click="logout">登出</button>
      </view>
    </view>

    <StatsGrid :stats="user.stats" />

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
import { ref } from 'vue'
const { bgStyle } = useGlobalTheme()

const userStore = useUserStore()
const { avatar, nickname, stats } = storeToRefs(userStore)
const user = { avatar: avatar.value, nickname: nickname.value, stats: stats.value }

const pageStyle = bgStyle

// auth state
const authUser = ref(getAuthLocal())

// play history state
const showHistory = ref(false)
const list = ref([])
const loading = ref(false)
const error = ref(null)

function formatDate(v){ if(!v) return ''
  try{ const d = new Date(v); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }catch(e){return ''}
}

async function loadHistory(){
  const _fetchFallback = async (u, h) => {
    if (typeof fetch === 'function') { return fetch(u, { headers: h }); }
    // fallback using uni.request
    return new Promise((resolve, reject) => {
      uni.request({ url: u, header: h, success: (res) => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, json: () => res.data }), fail: (err)=> reject(err) });
    });
  }
  loading.value = true
  try{
    const auth = getAuthLocal()
    const base = import.meta.env.VITE_API_BASE || 'http://192.168.236.92:3003'
    const userId = '11111111-1111-1111-1111-111111111111'
    const url = `${base}/api/users/${userId}/play-history`
    const headers = {}
    if(auth?.token) headers.Authorization = `Bearer ${auth.token}`
    const resp = await fetch(url, { headers })
    if(!resp.ok) throw new Error(`请求失败: ${resp.status}`)
    const j = await resp.json()
    const data = Array.isArray(j) ? j : (j.items || j.data || j)
    list.value = Array.isArray(data) ? data : []
  }catch(e){ error.value = e.message || String(e); console.error(e) }
  finally{ loading.value = false }
}

function openLogin(){ try{ uni.navigateTo({ url:'/pages/auth/Login' }) }catch(e){ location.hash='#/pages/auth/Login' } }
function openRegister(){ try{ uni.navigateTo({ url:'/pages/auth/Register' }) }catch(e){ location.hash='#/pages/auth/Register' } }
async function logout(){ try{ const api = await import('@/api/auth'); api.logout(); authUser.value = null; const { useUserStore } = await import('@/stores/user'); useUserStore().applyAuth(null); uni.showToast({ title:'已登出' }) }catch(e){ uni.showToast({ title:'登出失败', icon:'none' }) } }


const settings = [
  { key:'favorites', label:'我喜欢的' },
  { key:'history', label:'播放历史' },
  { key:'comments', label:'我的评论' },
  { key:'creations', label:'我的创作' },
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
  if(key==='favorites') go('pages/favorites/index')
  else if(key==='history') { showHistory.value = true; loadHistory() }
  else if(key==='comments') go('pages/comments/index')
  else if(key==='creations') go('pages/creations/index')
  else if(key==='account') go('pages/account/index')
  else if(key==='help') go('pages/help/index')
  else if(key==='about') go('pages/about/index')
  else if(key==='queue') go('pages/queue/index')
  else if(key==='nickname') uni.showToast({ title:'请在后续版本中支持修改昵称', icon:'none' })
}
function closeHistory(){ showHistory.value = false; list.value = [] }
</script>

<style scoped>
.page{ min-height:100vh }
.section{ padding: 12px 16px }
.hero{ position:relative; height:160px; overflow:hidden; border-bottom-left-radius:24px; border-bottom-right-radius:24px }
.hero-bg{ position:absolute; inset:0; width:100%; height:100%; filter: blur(16px) brightness(0.9); transform: scale(1.1) }
.hero-overlay{ position:absolute; inset:0; background: linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.35)) }
.hero-content{ position:relative }

.header{ padding:8px 0 }
.title{ font-size:18px; font-weight:700; color:var(--text-primary) }
.loading{ color:var(--muted) }
.empty{ color:var(--muted); padding:18px 0 }
.history-item{ padding:12px 0; border-bottom:1px solid var(--border) }
.name{ font-size:16px; color:var(--text-primary); font-weight:600 }
.meta{ font-size:12px; color:var(--text-secondary); margin-top:6px }
</style>
