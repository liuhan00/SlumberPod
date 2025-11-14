<template>
  <view class="header">
    <image class="avatar" :src="avatarSrc" @error="handleAvatarError" />
    <view class="meta">
      <text class="name">{{ displayName }}</text>
      <text class="vip" v-if="isVip">VIP</text>
    </view>
  </view>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { safeImageUrl, getPlaceholder } from '@/utils/image'

const props = defineProps({ avatar:String, nickname:String, vip:Boolean })
const userStore = useUserStore()

const displayName = computed(() => props.nickname || userStore.nickname || '睡眠爱好者')
const isVip = computed(() => props.vip ?? userStore.vip)
const avatarSrc = ref(safeImageUrl(props.avatar || userStore.avatar, 'avatar'))

function handleAvatarError(e) {
  avatarSrc.value = getPlaceholder('avatar')
}
</script>
<style scoped>
.header{ display:flex; align-items:center; gap:12px; padding:16px }
.avatar{ width:60px; height:60px; border-radius:50% }
.name{ font-size:18px; font-weight:600; color: var(--text-color) }
.vip{ font-size:12px; color:#fff; background:#ff6b6b; padding:2px 6px; border-radius:6px; margin-top:4px }
</style>
