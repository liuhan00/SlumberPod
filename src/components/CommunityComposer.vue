<template>
  <view class="composer">
    <!-- 用户信息 -->
    <view class="user-info">
      <image class="avatar" :src="userAvatar" />
      <text class="username">{{ userName }}</text>
    </view>
    
    <!-- 标题输入 -->
    <input class="title-input" v-model="title" placeholder="标题（必填）" />
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
      <image class="preview-image" :src="imageUrl" mode="aspectFill" />
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

const userStore = useUserStore()
const emit = defineEmits(['submit', 'image-upload'])

const title = ref('')
const text = ref('')
const imageUrl = ref('')

// 用户信息
const userName = computed(() => userStore.user?.nickname || '用户')
const userAvatar = computed(() => userStore.user?.avatar || 'https://picsum.photos/seed/avatar/100')

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
</script>

<style scoped>
.composer { 
  background: #fff; 
  border-radius: 12px; 
  padding: 16px; 
  margin-bottom: 16px; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.title-input{ width:100%; height:44px; padding:8px 12px; border-radius:8px; border:1px solid #e9ecef; margin-bottom:12px; font-size:15px; color: rgba(0,0,0,0.9) }

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
  min-height: 100px; 
  background: #f8f9fa; 
  color: rgba(0,0,0,0.85); /* 提高对比度，深色文字 */
  border-radius: 8px; 
  padding: 12px; 
  font-size: 14px;
  border: 1px solid #e9ecef;
  resize: none;
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
}

.preview-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
}

.remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: rgba(0,0,0,0.7);
  color: var(--text-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.tools {
  display: flex;
  gap: 8px;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: none;
}

.tool-icon {
  font-size: 16px;
}

.tool-text {
  font-size: 12px;
  color: #666;
}

.publish-btn {
  padding: 8px 20px;
  background: #007aff;
  color: var(--text-color);
  border-radius: 20px;
  border: none;
  font-weight: 600;
}

.publish-btn.disabled {
  background: #ccc;
  opacity: 0.6;
}
</style>
