<template>
  <scroll-view class="page" scroll-y>
    <ProfileHeader :avatar="user.avatar" :nickname="user.nickname" :vip="user.vip" />
    <StatsGrid :stats="user.stats" />
    <view class="section">
      <SettingsList :settings="settings" @tap="onSetting" />
    </view>
  </scroll-view>
</template>
<script setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import ProfileHeader from '@/components/ProfileHeader.vue'
import StatsGrid from '@/components/StatsGrid.vue'
import SettingsList from '@/components/SettingsList.vue'

const userStore = useUserStore()
const { avatar, nickname, vip, stats } = storeToRefs(userStore)
const user = { avatar: avatar.value, nickname: nickname.value, vip: vip.value, stats: stats.value }

const settings = [
  { key:'queue', label:'播放队列' },
  { key:'history', label:'播放历史' },
  { key:'vip', label:'切换VIP' },
  { key:'nickname', label:'修改昵称' },
  { key:'about', label:'关于 SlumberPod' },
]
function onSetting(key){
  if(key==='queue') uni.navigateTo({ url:'/pages/queue/index' })
  else if(key==='history') {
    uni.showToast({ title:'正在打开播放历史...', icon:'none' })
    try { uni.navigateTo({ url:'pages/history/index' }) } catch(e) { uni.navigateTo({ url:'/pages/history/index' }) }
  }
  else if(key==='vip') userStore.toggleVip()
  else if(key==='nickname') uni.showToast({ title:'请在后续版本中支持修改昵称', icon:'none' })
  else if(key==='about') uni.showToast({ title:'白噪音与睡眠训练的轻应用', icon:'none' })
}
</script>
<style scoped>
.page{ min-height:100vh }
.section{ padding: 6px 0 }
</style>
