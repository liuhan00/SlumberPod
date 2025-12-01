<template>
  <view class="page" :style="bgStyle">
    <!-- 顶部导航栏 -->
    <view class="topbar">
      <button class="tb-btn tb-back" @click="goBack">←</button>
      <text class="tb-title">发布帖子</text>
    </view>

    <scroll-view class="content" scroll-y>
      <CommunityComposer @submit="handlePostSubmit" @image-upload="handleImageUpload" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import CommunityComposer from '@/components/CommunityComposer.vue'
import * as apiCommunity from '@/api/community'
import { getAuthLocal } from '@/store/auth'

const { bgStyle } = useGlobalTheme()

// 处理发帖提交
async function handlePostSubmit(data) {
  try {
    // 检查用户是否登录
    const auth = getAuthLocal()
    if (!auth || !auth.token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/auth/Login' })
      }, 1500)
      return
    }

    uni.showLoading({ title: '发布中...' })

    // 调用社区API创建帖子
    const result = await apiCommunity.createPost({ 
      title: data.title || '', 
      content: data.content,
      coverImage: data.image || ''
    })

    uni.hideLoading()
    uni.showToast({ title: '发布成功', icon: 'success' })

    // 发布成功后返回社区页面
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    uni.hideLoading()
    console.error('发布失败:', error)
    uni.showToast({ 
      title: error.message || '发布失败', 
      icon: 'none' 
    })
  }
}

// 处理图片上传（这里可以添加实际的上传逻辑）
function handleImageUpload(tempFilePath) {
  // 实际项目中可以在这里上传图片到服务器
  console.log('图片上传:', tempFilePath)
}

function goBack() {
  uni.navigateBack()
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-color, #f5f5f5);
}

.topbar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.tb-btn {
  background: none;
  border: none;
  font-size: 18px;
  padding: 8px;
  margin-right: 8px;
}

.tb-title {
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.content {
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
}

/* 确保内容不会超出屏幕 */
.content ::v-deep .composer {
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}

.content ::v-deep .input {
  max-width: 100%;
  box-sizing: border-box;
}

.content ::v-deep .title-input {
  max-width: 100%;
  box-sizing: border-box;
}
</style>