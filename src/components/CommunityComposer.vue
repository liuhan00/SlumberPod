<template>
  <view class="composer">
    <!-- 用户信息 -->
    <view class="user-info">
      <image class="avatar" :src="avatarSrc" @error="handleAvatarError" />
      <text class="username">{{ userName }}</text>
    </view>
    
    <!-- 标题输入 -->
    <view class="title-row">
      <text class="required-star" :class="{ hidden: title.trim() }">*</text>
      <input class="title-input" v-model="title" placeholder="标题" />
    </view>
    <!-- 文本输入 -->
    <textarea 
      class="input" 
      v-model="text" 
      placeholder="分享你的睡眠心得或白噪音推荐..." 
      maxlength="500"
    />
    
    <!-- 字数统计 -->
    <view class="char-count">
      <text :class="['count', text.length > 450 ? 'warning' : '']">
        {{ text.length }}/500
      </text>
    </view>
    
    <!-- 图片预览 -->
    <view v-if="imageUrl" class="image-preview">
      <image class="preview-image" :src="imageUrl" mode="aspectFill" @error="handleImageError" />
      <view class="remove-image" @click="removeImage">×</view>
    </view>
    
    <!-- 工具栏 -->
    <view class="toolbar">
      <view class="tools">
        <button class="tool-btn" @click="chooseImage">
          <text class="tool-icon">📷</text>
          <text class="tool-text">图片</text>
        </button>
        <button class="tool-btn" @click="chooseEmoji">
          <text class="tool-icon">😊</text>
          <text class="tool-text">表情</text>
        </button>
        <button class="tool-btn" @click="addTopic">
          <text class="tool-icon">#</text>
          <text class="tool-text">话题</text>
        </button>
      </view>
      
      <button 
        class="publish-btn" 
        @click="submit" 
        :disabled="!title.trim() || !text.trim()"
        :class="{ disabled: !title.trim() || !text.trim() }"
      >
        发布
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { safeImageUrl, getPlaceholder } from '@/utils/image'

const userStore = useUserStore()
const emit = defineEmits(['submit', 'image-upload'])

const title = ref('')
const text = ref('')
const imageUrl = ref('')

// 用户信息
const userName = computed(() => userStore.user?.nickname || '用户')
const avatarSrc = ref(safeImageUrl(userStore.user?.avatar, 'avatar'))

function handleAvatarError(e) {
  avatarSrc.value = getPlaceholder('avatar')
}

function submit() { 
  emit('submit', { 
    title: title.value,
    content: text.value, 
    image: imageUrl.value 
  })
  title.value = ''
  text.value = ''
  imageUrl.value = ''
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      // 模拟上传
      imageUrl.value = tempFilePath
      emit('image-upload', tempFilePath)
    }
  })
}

function removeImage() {
  imageUrl.value = ''
}

function chooseEmoji() {
  // 简单的表情选择
  const emojis = ['😊', '😴', '💤', '🌙', '⭐', '🌊', '🔥', '🌲', '☔']
  uni.showActionSheet({
    itemList: emojis,
    success: (res) => {
      text.value += emojis[res.tapIndex]
    }
  })
}

function addTopic() {
  const topics = ['#助眠技巧#', '#白噪音推荐#', '#睡眠日记#', '#失眠互助#']
  uni.showActionSheet({
    itemList: topics,
    success: (res) => {
      text.value += topics[res.tapIndex] + ' '
    }
  })
}

function handleImageError(e) {
  // 图片加载失败时，可以选择移除图片或显示占位图
  // 这里选择移除图片
  imageUrl.value = ''
  uni.showToast({ title: '图片加载失败', icon: 'none' })
}
</script>

<style scoped>
.composer { 
  background: #fff; 
  border-radius: 12px; 
  padding: 16px; 
  margin: 0 auto 16px; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
.title-input{ 
  width: 100%; 
  box-sizing: border-box; 
  height: 44px; 
  padding: 8px 12px; 
  border-radius: 8px; 
  border: 1px solid #e9ecef; 
  margin-bottom: 12px; 
  font-size: 15px; 
  color: rgba(0,0,0,0.9);
  max-width: 100%;
}

.title-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.required-star {
  color: red;
  font-weight: bold;
  margin-right: 4px;
}

.required-star.hidden {
  display: none;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 10px;
}

.username {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.input { 
  width: 100%; 
  box-sizing: border-box;
  min-height: 100px; 
  background: #f8f9fa; 
  color: rgba(0,0,0,0.85); /* 提高对比度，深色文字 */
  border-radius: 8px; 
  padding: 12px; 
  font-size: 14px;
  border: 1px solid #e9ecef;
  resize: none;
  max-width: 100%;
}
.input::placeholder { color: rgba(0,0,0,0.45); }

.char-count {
  text-align: right;
  margin-top: 4px;
}

.count {
  font-size: 12px;
  color: #999;
}

.count.warning {
  color: #ff6b35;
}

.image-preview {
  position: relative;
  margin-top: 12px;
  max-width: 100%;
}

.preview-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  max-width: 100%;
  box-sizing: border-box;
}

.remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: transparent;
  color: var(--text-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border: none;
  outline: none;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  flex-wrap: wrap;
}

.tools {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: transparent;
  border-radius: 6px;
  border: none;
  outline: none;
}

.tool-icon {
  font-size: 16px;
}

.tool-text {
  font-size: 12px;
  color: #666;
}

/* 微信小程序去按钮默认边框 */
.tool-btn::after {
  border: none;
}

.publish-btn {
  padding: 8px 20px;
  background: #007aff;
  color: var(--text-color);
  border-radius: 20px;
  border: none;
  outline: none;
  font-weight: 600;
  white-space: nowrap;
}

.publish-btn.disabled {
  background: #ccc;
  opacity: 0.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .composer {
    padding: 12px;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .tools {
    justify-content: center;
  }
  
  .publish-btn {
    align-self: center;
    width: 100%;
    max-width: 200px;
  }
}
</style>