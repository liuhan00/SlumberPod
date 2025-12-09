<template>
  <view class="page">
    <view class="header">
      <text class="title">头像测试页面</text>
    </view>
    
    <view class="content">
      <view class="avatar-section">
        <image class="avatar" :src="avatarUrl" mode="aspectFill" @error="handleAvatarError" />
        <text class="avatar-label">当前头像</text>
      </view>
      
      <button class="btn" @click="uploadAvatar">上传新头像</button>
      <button class="btn" @click="refreshPage">刷新页面</button>
      <button class="btn" @click="showUserInfo">显示用户信息</button>
      
      <view class="info-section" v-if="userInfo">
        <text class="info-text">用户ID: {{ userInfo.userId }}</text>
        <text class="info-text">昵称: {{ userInfo.nickname }}</text>
        <text class="info-text">头像URL: {{ userInfo.avatar }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { getAuthLocal } from '@/store/auth'
import { uploadAvatar } from '@/api/users'
import { getPlaceholder } from '@/utils/image'

const userStore = useUserStore()
const avatarUrl = ref(userStore.avatar || getPlaceholder('avatar'))
const userInfo = ref(null)

// 监听用户存储中的头像变化
userStore.$subscribe((mutation, state) => {
  avatarUrl.value = state.avatar || getPlaceholder('avatar')
})

function handleAvatarError() {
  avatarUrl.value = getPlaceholder('avatar')
}

async function uploadAvatar() {
  uni.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      try {
        const result = await uploadAvatar(tempFilePath)
        const newAvatarUrl = result.data?.avatar_url || result.avatar_url || tempFilePath
        
        // 更新用户存储
        userStore.updateAvatar(newAvatarUrl)
        
        uni.showToast({ title: '头像上传成功', icon: 'success' })
      } catch (err) {
        console.error('上传头像失败:', err)
        uni.showToast({ title: '上传失败: ' + (err.message || '未知错误'), icon: 'none' })
      }
    },
    fail: () => {
      uni.showToast({ title: '取消上传', icon: 'none' })
    }
  })
}

function refreshPage() {
  // 模拟页面刷新，重新从本地存储加载用户信息
  const authInfo = getAuthLocal()
  if (authInfo) {
    userStore.applyAuth(authInfo)
    uni.showToast({ title: '页面已刷新', icon: 'success' })
  } else {
    uni.showToast({ title: '未找到用户信息', icon: 'none' })
  }
}

function showUserInfo() {
  const authInfo = getAuthLocal()
  userInfo.value = {
    userId: userStore.userId,
    nickname: userStore.nickname,
    avatar: userStore.avatar,
    authInfo: authInfo
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-section {
  margin-bottom: 30px;
  text-align: center;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 2px solid #ddd;
  margin-bottom: 10px;
}

.avatar-label {
  font-size: 16px;
  color: #666;
}

.btn {
  width: 80%;
  margin-bottom: 15px;
  padding: 12px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
}

.info-section {
  margin-top: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  width: 80%;
}

.info-text {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}
</style>