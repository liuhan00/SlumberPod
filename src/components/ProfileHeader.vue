<template>
  <view class="header">
    <image class="avatar" :src="avatarSrc || ''" @error="handleAvatarError" />
    <view class="meta">
      <text class="name">{{ displayName || '睡眠爱好者' }}</text>
      <text class="vip" v-if="isVip">VIP</text>
    </view>
  </view>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { safeImageUrl, getPlaceholder } from '@/utils/image'

const props = defineProps({ 
  avatar: { type: String, default: '' }, 
  nickname: { type: String, default: '' }, 
  vip: { type: Boolean, default: false } 
})
const userStore = useUserStore()

// 确保即使props为undefined也能正确处理
const displayName = computed(() => {
  try {
    if (props && props.nickname) return props.nickname
    if (userStore && userStore.nickname) return userStore.nickname
    return '睡眠爱好者'
  } catch (e) {
    return '睡眠爱好者'
  }
})

const isVip = computed(() => {
  try {
    if (props && props.vip !== undefined) return props.vip
    if (userStore && userStore.vip !== undefined) return userStore.vip
    return false
  } catch (e) {
    return false
  }
})

const avatarSrc = ref(safeImageUrl(((props && props.avatar) || (userStore && userStore.avatar) || ''), 'avatar'))

// 添加监听器，当用户存储中的头像发生变化时更新avatarSrc
watch(() => userStore.avatar, (newAvatar) => {
  try {
    avatarSrc.value = safeImageUrl(newAvatar || '', 'avatar')
  } catch (e) {
    avatarSrc.value = getPlaceholder('avatar')
  }
})

// 添加监听器，当props.avatar发生变化时更新avatarSrc
watch(() => props.avatar, (newAvatar) => {
  try {
    avatarSrc.value = safeImageUrl(newAvatar || (userStore && userStore.avatar) || '', 'avatar')
  } catch (e) {
    avatarSrc.value = getPlaceholder('avatar')
  }
})

function handleAvatarError(e) {
  avatarSrc.value = getPlaceholder('avatar')
}
</script>
<style scoped>
.header{ display:flex; align-items:center; gap:20px; padding:24px }
.avatar{ width:80px; height:80px; border-radius:50% }
.name{ font-size:24px; font-weight:600; color: var(--text-color) }
.vip{ font-size:14px; color:#fff; background:#ff6b6b; padding:4px 8px; border-radius:8px; margin-top:6px }
</style>
