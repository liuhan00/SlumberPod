<template>
  <view class="page" :style="bgStyle">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="header-left">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="header-title">创作白噪音</text>
      </view>
      <view class="header-right">
        <view class="save-btn" @click="saveCreation" :class="{ disabled: !isValid }" :disabled="!isValid">
          <text class="save-text">保存</text>
        </view>
      </view>
    </view>

    <!-- 创作内容 -->
    <scroll-view class="creation-content" scroll-y>
      <!-- 创作基本信息 -->
      <view class="creation-form">
        <view class="form-section">
          <text class="section-title">基本信息</text>
          <view class="input-group">
            <text class="input-label">作品名称</text>
            <input 
              v-model="creationData.name" 
              class="input" 
              data-role="title"
              placeholder="请输入作品名称"
              maxlength="20"
            />
            <text class="char-count">{{ creationData.name.length }}/20</text>
          </view>
          
          <view class="input-group">
            <text class="input-label">作品描述</text>
            <textarea 
              v-model="creationData.description" 
              class="textarea" 
              placeholder="描述你的白噪音作品..."
              maxlength="200"
            />
            <text class="char-count">{{ creationData.description.length }}/200</text>
          </view>
          
          <view class="input-group">
            <text class="input-label">作品分类</text>
            <view class="category-tags">
              <view 
                v-for="category in categories" 
                :key="category.id" 
                class="category-tag"
                :class="{ active: creationData.category === category.id }"
                @click="creationData.category = category.id; creationData.categoryName = category.name"
              >
                <text class="category-icon">{{ category.icon }}</text>
                <text class="category-name">{{ category.name }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 音频录制 -->
        <view class="form-section">
          <text class="section-title">音频录制</text>
          <view class="recording-section">
            <view class="recording-controls">
              <view class="record-btn" @click="toggleRecording" :class="{ recording: isRecording }">
                <text class="record-icon">{{ isRecording ? '⏹️' : '🎤' }}</text>
                <text class="record-text">{{ isRecording ? '停止录制' : '开始录制' }}</text>
              </view>
              
              <view class="upload-controls">
                <view class="file-select-btn" @click="selectAudioFile">
                  <text class="file-icon">📁</text>
                  <text class="file-text">{{ selectedFile ? selectedFile.name : '选择音频文件' }}</text>
                </view>
                <view class="upload-btn" @click="uploadSelectedFile" :class="{ disabled: !selectedFile }">
                  <text class="upload-icon">{{ selectedFile ? '📤' : '🚫' }}</text>
                  <text class="upload-text">{{ selectedFile ? '上传音频文件' : '请先选择文件' }}</text>
                </view>
                <text v-if="uploadProgress>0" class="progress-text">上传进度：{{ Math.round(uploadProgress) }}%</text>
              </view>
              
              <view class="audio-preview" v-if="audioUrl">
                <text class="preview-title">录制/上传预览</text>
                <view class="audio-player">
                  <text class="play-btn" @click="togglePlayback">{{ isPlaying ? '⏸️' : '▶' }}</text>
                  <view class="progress-bar">
                    <view class="progress" :style="{ width: progress + '%' }"></view>
                  </view>
                  <text class="duration">{{ formatTime(currentTime) }}/{{ formatTime(duration) }}</text>
                </view>
              </view>
            </view>
            
            <view class="recording-tips">
              <text class="tip-text">💡 录制提示：</text>
              <text class="tip-desc">• 在安静的环境下录制</text>
              <text class="tip-desc">• 保持设备稳定</text>
              <text class="tip-desc">• 录制时长建议30秒-5分钟</text>
            </view>
          </view>
        </view>

        <!-- 音效混合 -->
        <view class="form-section">
          <text class="section-title">音效混合</text>
          <view class="mixer-section">
            <view class="mixer-controls">
              <view class="mixer-item" v-for="(sound, index) in soundLayers" :key="index">
                <view class="sound-info">
                  <text class="sound-name">{{ sound.name }}</text>
                  <text class="sound-volume">{{ sound.volume }}%</text>
                </view>
                <view class="volume-control">
                  <text class="volume-icon" @click="decreaseVolume(index)">🔉</text>
                  <input 
                    type="range" 
                    v-model="sound.volume" 
                    min="0" 
                    max="100" 
                    class="volume-slider"
                  />
                  <text class="volume-icon" @click="increaseVolume(index)">🔊</text>
                </view>
                <view class="sound-actions">
                  <text class="action-btn" @click="removeSound(index)">🗑️</text>
                </view>
              </view>
            </view>
            
            <view class="add-sound-btn" @click="showSoundLibrary">
              <text class="add-icon">➕</text>
              <text class="add-text">添加音效</text>
            </view>
          </view>
        </view>

        <!-- 分享设置 -->
        <view class="form-section">
          <text class="section-title">分享设置</text>
          <view class="share-settings">
            <view class="setting-item">
              <text class="setting-label">分享到社区</text>
              <view class="switch" @click="creationData.shareToCommunity = !creationData.shareToCommunity">
                <view class="switch-track" :class="{ active: creationData.shareToCommunity }">
                  <view class="switch-thumb" :class="{ active: creationData.shareToCommunity }"></view>
                </view>
              </view>
            </view>
            
            <view class="setting-item">
              <text class="setting-label">设为公开</text>
              <view class="switch" @click="creationData.isPublic = !creationData.isPublic">
                <view class="switch-track" :class="{ active: creationData.isPublic }">
                  <view class="switch-thumb" :class="{ active: creationData.isPublic }"></view>
                </view>
              </view>
            </view>
            
            <view class="setting-item">
              <text class="setting-label">允许下载</text>
              <view class="switch" @click="creationData.allowDownload = !creationData.allowDownload">
                <view class="switch-track" :class="{ active: creationData.allowDownload }">
                  <view class="switch-thumb" :class="{ active: creationData.allowDownload }"></view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore(); themeStore.load()
const { bgStyle } = useGlobalTheme()

// 创作数据
const creationData = ref({
  name: '',
  description: '',
  category: '',
  shareToCommunity: true,
  isPublic: true,
  allowDownload: true
})

// 分类选项
const categories = ref([])

// 使用与听白噪音页面一致的分类
import * as apiAudios from '@/api/audios'
import * as apiCommunity from '@/api/community'

async function loadCategories(){
  // 使用听白噪音页面中的分类映射
  const categoryMap = {
    '22222222-2222-2222-2222-222222222222': { id: '22222222-2222-2222-2222-222222222222', name: '雨声', icon: '🌧️' },
    '33333333-3333-3333-3333-333333333333': { id: '33333333-3333-3333-3333-333333333333', name: '自然', icon: '🌿' },
    '44444444-4444-4444-4444-444444444444': { id: '44444444-4444-4444-4444-444444444444', name: '环境', icon: '🏙️' },
    '55555555-5555-5555-5555-555555555555': { id: '55555555-5555-5555-5555-555555555555', name: '免费', icon: '🆓' }
  }
  
  try {
    // 直接从分类 API 获取数据
    const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.150:3003'
    const url = BASE + '/api/categories?limit=1000'
    console.log('[creation] loading categories from', url)
    
    let res
    if (typeof fetch === 'function'){
      const response = await fetch(url)
      res = await response.json()
    } else {
      res = await new Promise((resolve, reject) => {
        uni.request({ 
          url, 
          method: 'GET', 
          success(r){ resolve(r.data) }, 
          fail(err){ reject(err) } 
        })
      })
    }
    
    const items = Array.isArray(res) ? res : (res.data || res.items || [])
    if(items.length > 0){
      categories.value = items.map(c => ({
        id: c.id || c.category_id,
        name: c.name,
        icon: c.icon || categoryMap[c.id]?.icon || '🎧'
      }))
      console.log('[creation] loaded categories from backend:', categories.value)
    } else {
      throw new Error('No categories from backend')
    }
  } catch (e) {
    console.warn('[creation] 尝试从后端加载分类失败，使用预设分类', e)
    categories.value = Object.values(categoryMap)
  }
}

onMounted(()=> loadCategories())

// 音频录制相关
const isRecording = ref(false)
const isPlaying = ref(false)
const audioUrl = ref('')
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
// file upload control
const selectedFile = ref(null)
const uploadProgress = ref(0)

// 音效混合层
const soundLayers = ref([
  { name: '基础音效', volume: 80 }
])

// tags
creationData.value.tags = creationData.value.tags || []
function addTag(t){ if(!t) return; creationData.value.tags.push(t) }
function removeTag(i){ creationData.value.tags.splice(i,1) }

// 验证表单
const isValid = computed(() => {
  return creationData.value.name.trim() && 
         creationData.value.category && 
         (audioUrl.value || creationData.value.file_url || creationData.value.audio_id || creationData.value.audioId)
})

// 返回上一页
function goBack() {
  try {
    uni.navigateBack()
  } catch(e) {
    if(typeof location !== 'undefined') location.hash = '#/pages/home/index'
  }
}

// 保存创作
function saveCreation() {
  if (!isValid.value) return
  
  uni.showLoading({ title: '保存中...' })
  
  // 上传到后端（如果 file_url 或录音存在）
  ;(async ()=>{
    try{
      const authModule = await import('@/store/auth')
      const auth = authModule.getAuthLocal ? authModule.getAuthLocal() : (authModule.default && authModule.default.getAuthLocal ? authModule.default.getAuthLocal() : null)
      const author_id = auth?.user?.id || auth?.id || null
      // 改为使用社区发帖接口，按后端字段发送：title、content、cover image、audio id
      const res = await apiCommunity.createPost({
        title: creationData.value.name || '',
        content: creationData.value.description || '',
        coverImage: creationData.value.cover_url || '',
        audioId: creationData.value.audio_id || creationData.value.audioId || undefined
      })
      uni.hideLoading()
      uni.showToast({ title: '上传成功', icon: 'success' })
      if(creationData.value.shareToCommunity){
        setTimeout(()=> uni.navigateTo({ url:'/pages/creation/share?id=' + (res.data?.id || res.id || Date.now()) }), 800)
      } else {
        setTimeout(()=> goBack(), 800)
      }
    }catch(e){
      console.error('upload failed', e)
      uni.hideLoading()
      uni.showToast({ title: '保存失败：'+(e.message||String(e)), icon:'none' })
    }
  })()
}


// 切换录制状态
function toggleRecording() {
  if (isRecording.value) {
    // 停止录制
    isRecording.value = false
    audioUrl.value = 'https://example.com/audio/' + Date.now() + '.mp3'
    duration.value = 120 // 模拟2分钟音频
  } else {
    // 开始录制
    isRecording.value = true
    uni.showToast({
      title: '开始录制...',
      icon: 'none'
    })
  }
}

// 选择音频文件（兼容小程序/H5）
async function selectAudioFile() {
  try {
    let res = null
    // 微信/小程序环境优先使用 chooseMessageFile
    if (typeof uni.chooseMessageFile === 'function') {
      res = await uni.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['mp3','wav','m4a','aac','ogg','flac']
      })
    } else if (typeof uni.chooseFile === 'function') {
      // H5/APP 环境
      res = await uni.chooseFile({
        count: 1,
        type: 'file',
        extension: ['mp3','wav','m4a','aac','ogg','flac']
      })
    } else {
      // 不支持本地文件选择的平台（如部分小程序），提示使用录制或在H5端上传
      uni.showModal({
        title: '暂不支持本地文件选择',
        content: '当前平台不支持选择本地音频文件，请使用录制功能或在网页端上传。',
        showCancel: false
      })
      return
    }

    if (res && res.tempFiles && res.tempFiles.length > 0) {
      selectedFile.value = res.tempFiles[0]
      uni.showToast({ title: '文件选择成功', icon: 'success', duration: 1500 })
    }
  } catch (error) {
    console.error('选择文件失败:', error)
    uni.showToast({ title: '选择文件失败', icon: 'none', duration: 2000 })
  }
}

async function uploadSelectedFile(){
  if(!selectedFile.value) return uni.showToast({ title:'请选择文件', icon:'none' })
  
  // 检查必填字段
  if(!creationData.value.name.trim()) {
    return uni.showToast({ title:'请先填写作品名称', icon:'none' })
  }
  
  if(!creationData.value.category) {
    return uni.showToast({ title:'请先选择作品分类', icon:'none' })
  }
  
  uni.showLoading({ title: '上传中...', mask: true })
  
  try{
    uploadProgress.value = 10
    
    // 检查文件大小限制（50MB）
    if(selectedFile.value.size > 50 * 1024 * 1024) {
      throw new Error('文件大小不能超过50MB')
    }
    
    // 检查文件类型 - 放宽限制，因为uni.chooseFile返回的文件可能没有type属性
    const fileName = selectedFile.value.name.toLowerCase()
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
    
    if(!hasValidExtension) {
      throw new Error('请上传音频文件（支持MP3、WAV、M4A、AAC、OGG、FLAC格式）')
    }
    
    uploadProgress.value = 30
    
    // 使用新的两步上传流程：先上传到 /api/audio/upload，然后创建记录
    // 将 category_id 转换为 categoryIds 数组格式
    const categoryIds = creationData.value.category ? [creationData.value.category] : []
    
    const uploadPromise = apiAudios.uploadAudioToStorage({ 
      file: selectedFile.value, 
      title: creationData.value.name, 
      description: creationData.value.description || '',
      coverUrl: creationData.value.cover_url || '',
      durationSeconds: duration.value || 0,
      categoryIds: categoryIds,
      isPublic: 1,
      isFree: 0
    })
    
    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if(uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 500)
    
    const resp = await uploadPromise
    clearInterval(progressInterval)
    uploadProgress.value = 100
    
    console.log('上传响应:', resp)
    
    // 优先获取音频ID；兼容不同返回结构
    const audioIdCandidate = resp?.data?.audioId ?? resp?.data?.id ?? resp?.audioId ?? resp?.id
    if (audioIdCandidate != null) {
      creationData.value.audio_id = String(audioIdCandidate)
      uni.hideLoading()
      uni.showToast({ 
        title:'上传成功，已获取音频ID', 
        icon:'success',
        duration: 2000
      })
      // 清空已选文件
      selectedFile.value = null
    } else {
      // 兼容仅返回URL的情况：先保存URL以便回显，但提示缺少音频ID
      let fileUrl = ''
      if(resp.data) {
        fileUrl = resp.data.audio_url || resp.data.file_url || resp.data.url || ''
      } else {
        fileUrl = resp.audio_url || resp.file_url || resp.url || ''
      }
      if(fileUrl) {
        creationData.value.file_url = fileUrl
        uni.hideLoading()
        uni.showToast({ 
          title:'上传成功，但未返回音频ID', 
          icon:'none',
          duration: 2500
        })
        // 清空已选文件
        selectedFile.value = null
      } else {
        throw new Error('上传成功但未获取到音频ID或URL，响应：' + JSON.stringify(resp))
      }
    }
    
    // 自动设置音频时长（如果后端有返回）
    if(!duration.value && (resp.data?.duration || resp.duration)) {
      duration.value = resp.data?.duration || resp.duration
    }
    
  }catch(e){ 
    console.error('上传失败详情:', e)
    uni.hideLoading()
    
    // 更详细的错误信息
    let errorMessage = '上传失败'
    if(e.message && e.message.includes('Network')) {
      errorMessage = '网络连接失败，请检查网络设置'
    } else if(e.message && e.message.includes('Failed to fetch')) {
      errorMessage = '服务器连接失败，请稍后重试'
    } else if(e.message) {
      errorMessage = e.message
    }
    
    uni.showToast({ 
      title: errorMessage, 
      icon:'none',
      duration: 3000
    }) 
  } finally {
    setTimeout(() => { uploadProgress.value = 0 }, 2000)
  }
}


// 切换播放状态
function togglePlayback() {
  if (isPlaying.value) {
    isPlaying.value = false
  } else {
    isPlaying.value = true
    // 模拟播放进度更新
    const interval = setInterval(() => {
      if (currentTime.value < duration.value) {
        currentTime.value += 1
        progress.value = (currentTime.value / duration.value) * 100
      } else {
        isPlaying.value = false
        clearInterval(interval)
      }
    }, 1000)
  }
}

// 格式化时间
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 音量控制
function increaseVolume(index) {
  if (soundLayers.value[index].volume < 100) {
    soundLayers.value[index].volume += 10
  }
}

function decreaseVolume(index) {
  if (soundLayers.value[index].volume > 0) {
    soundLayers.value[index].volume -= 10
  }
}

function removeSound(index) {
  soundLayers.value.splice(index, 1)
}

// 显示音效库
function showSoundLibrary() {
  uni.showActionSheet({
    itemList: ['雨声', '海浪', '风声', '鸟鸣', '键盘声', '城市噪音'],
    success: (res) => {
      const sounds = ['雨声', '海浪', '风声', '鸟鸣', '键盘声', '城市噪音']
      soundLayers.value.push({
        name: sounds[res.tapIndex],
        volume: 50
      })
    }
  })
}

onMounted(() => {
  // 页面加载时的初始化逻辑
})
</script>

<style scoped>
.page { min-height: 100vh; background: var(--bg-color); background-image: var(--bg-gradient); padding-top: constant(safe-area-inset-top); padding-top: env(safe-area-inset-top); box-sizing: border-box; padding-left: 12px; padding-right: 12px; }

/* 顶部导航栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--card-bg, #ffffff);
  border-bottom: 1px solid var(--border, #f0f0f0);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
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

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg, #333);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-btn {
  padding: 8px 16px;
  background: var(--uni-color-primary, #007aff);
  color: white;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn.disabled {
  background: var(--muted, #ccc);
  opacity: 0.6;
  cursor: not-allowed;
}

.save-btn:not(.disabled):active {
  transform: scale(0.95);
}

.save-text {
  font-weight: 500;
}

/* 创作内容 */
.creation-content {
  flex: 1;
  padding: 0; /* 使用 page 的左右内边距 */
}

.creation-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: var(--card-bg, #ffffff);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg, #333);
  margin-bottom: 16px;
  display: block;
}

.input-group {
  margin-bottom: 20px;
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--fg, #333);
  display: block;
  margin-bottom: 8px;
}

.input, .textarea {
  width: 100%;
  box-sizing: border-box;
  background: var(--input-bg, #f8f9fa);
  border: 2px solid var(--border, #f0f0f0);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 16px; /* 增大输入文字 */
  color: var(--fg, #333);
  outline: none;
  transition: all 0.2s;
}

/* 单独调整作品名称输入高度 */
.input[name="name"], .input[data-role="title"] {
  height: 48px;
  line-height: 24px;
}
.input:focus, .textarea:focus {
  border-color: var(--uni-color-primary, #007aff);
}

.textarea {
  min-height: 80px;
  resize: none;
}

.char-count {
  font-size: 12px;
  color: var(--muted, #999);
  text-align: right;
  display: block;
  margin-top: 4px;
}

/* 分类标签 */
.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: var(--input-bg, #f8f9fa);
  border: 2px solid transparent;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-tag.active {
  background: var(--uni-color-primary, #007aff);
  border-color: var(--uni-color-primary, #007aff);
}

.category-tag.active .category-name {
  color: white;
}

.category-tag:active {
  transform: scale(0.95);
}

.category-icon {
  font-size: 14px;
}

.category-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--fg, #333);
}

/* 录制控制 */
.recording-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--input-bg, #f8f9fa);
  border: 2px solid var(--border, #f0f0f0);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.2s;
}

.record-btn.recording {
  background: #ff3b30;
  border-color: #ff3b30;
  color: white;
}

.record-btn:active {
  transform: scale(0.95);
}

.record-icon {
  font-size: 16px;
}

.record-text {
  font-size: 14px;
  font-weight: 500;
}

/* 文件上传控制 */
.file-select-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--input-bg, #f8f9fa);
  border: 2px solid var(--border, #f0f0f0);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.file-select-btn:active {
  transform: scale(0.95);
  border-color: var(--uni-color-primary, #007aff);
}

.file-icon {
  font-size: 16px;
}

.file-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--fg, #333);
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--uni-color-primary, #007aff);
  border: 2px solid var(--uni-color-primary, #007aff);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.upload-btn.disabled {
  background: var(--muted, #ccc);
  border-color: var(--muted, #ccc);
  cursor: not-allowed;
  opacity: 0.6;
}

.upload-btn:not(.disabled):active {
  transform: scale(0.95);
}

.upload-icon {
  font-size: 16px;
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.upload-btn.disabled .upload-text {
  color: var(--fg, #666);
}

.progress-text {
  font-size: 12px;
  color: var(--uni-color-primary, #007aff);
  font-weight: 500;
  text-align: center;
  display: block;
  margin-top: 8px;
}

.audio-preview {
  background: var(--input-bg, #f8f9fa);
  border-radius: 12px;
  padding: 16px;
}

.preview-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--fg, #333);
  display: block;
  margin-bottom: 12px;
}

.audio-player {
  display: flex;
  align-items: center;
  gap: 12px;
}

.play-btn {
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.play-btn:active {
  transform: scale(0.9);
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--border, #f0f0f0);
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: var(--uni-color-primary, #007aff);
  transition: width 0.3s;
}

.duration {
  font-size: 12px;
  color: var(--muted, #999);
  min-width: 80px;
}

.recording-tips {
  background: rgba(0, 122, 255, 0.05);
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
}

.tip-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--uni-color-primary, #007aff);
  display: block;
  margin-bottom: 6px;
}

.tip-desc {
  font-size: 11px;
  color: var(--muted, #666);
  display: block;
  line-height: 1.4;
}

/* 音效混合器 */
.mixer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--input-bg, #f8f9fa);
  border-radius: 12px;
  margin-bottom: 8px;
}

.sound-info {
  flex: 1;
  min-width: 0;
}

.sound-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--fg, #333);
  display: block;
  margin-bottom: 2px;
}

.sound-volume {
  font-size: 12px;
  color: var(--muted, #999);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 2;
}

.volume-icon {
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.volume-icon:active {
  transform: scale(0.9);
}

.volume-slider {
  flex: 1;
  height: 4px;
  background: var(--border, #f0f0f0);
  border-radius: 2px;
  outline: none;
}

.sound-actions {
  margin-left: auto;
}

.action-btn {
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:active {
  transform: scale(0.9);
}

.add-sound-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--input-bg, #f8f9fa);
  border: 2px dashed var(--border, #f0f0f0);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  justify-content: center;
}

.add-sound-btn:active {
  transform: scale(0.95);
  border-color: var(--uni-color-primary, #007aff);
}

.add-icon {
  font-size: 14px;
}

.add-text {
  font-size: 14px;
  color: var(--muted, #666);
}

/* 分享设置 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border, #f0f0f0);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 14px;
  color: var(--fg, #333);
}

.switch {
  cursor: pointer;
}

.switch-track {
  width: 44px;
  height: 24px;
  background: var(--border, #f0f0f0);
  border-radius: 12px;
  position: relative;
  transition: all 0.3s;
}

.switch-track.active {
  background: var(--uni-color-primary, #007aff);
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.switch-thumb.active {
  left: 22px;
}
</style>