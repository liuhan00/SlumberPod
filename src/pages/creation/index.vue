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
        <view class="save-btn" @click="createNoise" :class="{ disabled: !canCreate }" :disabled="!canCreate">
          <text class="save-text">创作</text>
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
          
          <!-- 上传图标按钮 -->
          <view class="input-group">
            <text class="input-label">作品图标</text>
            <view class="cover-upload-section">
              <view class="cover-preview" v-if="creationData.cover_url">
                <image class="cover-image" :src="creationData.cover_url" mode="aspectFill" />
                <view class="cover-overlay">
                  <text class="cover-change-btn" @click="uploadCoverImage">更换</text>
                </view>
              </view>
              <view class="cover-placeholder" v-else @click="uploadCoverImage">
                <text class="cover-placeholder-icon">📷</text>
                <text class="cover-placeholder-text">上传图标</text>
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
              <text class="tip-text">💡 创作提示：</text>
              <text class="tip-desc">• 上传图标和音频文件后点击顶部"创作"按钮</text>
              <text class="tip-desc">• 在安静的环境下录制音频</text>
              <text class="tip-desc">• 保持设备稳定</text>
              <text class="tip-desc">• 音频时长建议30秒-5分钟</text>
            </view>          </view>
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
import { getAuthLocal } from '@/store/auth'

const themeStore = useThemeStore(); themeStore.load()
const { bgStyle } = useGlobalTheme()

// 创作数据
const creationData = ref({
  name: '',
  description: '',
  category: '',
  shareToCommunity: true,
  isPublic: true,
  allowDownload: true,
  cover_url: '' // 添加封面图片URL字段
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
    const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.135:3003'
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

// 验证表单（更新验证逻辑，移除对音频URL的检查）
const isValid = computed(() => {
  return creationData.value.name.trim() && 
         creationData.value.category
})

// 检查是否可以创作（需要名称、分类、图标和音频文件）
const canCreate = computed(() => {
  return creationData.value.name.trim() && 
         creationData.value.category && 
         creationData.value.cover_url &&
         (selectedFile.value || isRecording.value)
})

// 新的创作函数，同时上传图标和音频文件
async function createNoise() {
  if (!canCreate.value) {
    if (!creationData.value.name.trim()) {
      return uni.showToast({ title: '请输入作品名称', icon: 'none' })
    }
    if (!creationData.value.category) {
      return uni.showToast({ title: '请选择作品分类', icon: 'none' })
    }
    if (!creationData.value.cover_url) {
      return uni.showToast({ title: '请上传作品图标', icon: 'none' })
    }
    if (!selectedFile.value && !isRecording.value) {
      return uni.showToast({ title: '请选择或录制音频文件', icon: 'none' })
    }
    return
  }
  
  uni.showLoading({ title: '创作中...' })
  
  try {
    // 检查必填字段
    if (!creationData.value.name.trim()) {
      throw new Error('请输入作品名称')
    }
    
    if (!creationData.value.category) {
      throw new Error('请选择作品分类')
    }
    
    // 检查文件大小限制（50MB）
    if (selectedFile.value && selectedFile.value.size > 50 * 1024 * 1024) {
      throw new Error('文件大小不能超过50MB')
    }
    
    // 检查文件类型
    if (selectedFile.value) {
      const fileName = selectedFile.value.name.toLowerCase()
      const allowedExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
      
      if (!hasValidExtension) {
        throw new Error('请上传音频文件（支持MP3、WAV、M4A、AAC、OGG、FLAC格式）')
      }
    }
    
    // 使用新的两步上传流程：先上传到 /api/audio/upload，然后创建记录
    // 将 category_id 转换为 categoryIds 数组格式
    const categoryIds = creationData.value.category ? [creationData.value.category] : []
    
    // 准备上传数据
    const uploadData = {
      file: selectedFile.value,
      title: creationData.value.name,
      description: creationData.value.description || '',
      coverUrl: creationData.value.cover_url || '',
      durationSeconds: duration.value || 0,
      categoryIds: categoryIds,
      isPublic: creationData.value.isPublic ? 1 : 0,
      isFree: creationData.value.allowDownload ? 1 : 0
    }
    
    // 如果正在录制，则使用模拟的音频数据
    if (isRecording.value) {
      // 在实际应用中，这里应该是真实的录制文件
      // 为了演示目的，我们使用一个模拟的文件对象
      uploadData.file = {
        name: 'recorded_audio.mp3',
        size: 5000000, // 5MB
        // 在实际应用中，这里应该是真实的文件路径
        tempFilePath: 'recorded_audio_temp_path'
      }
    }
    
    console.log('[creation] 开始上传音频文件和图标')
    const uploadPromise = apiAudios.uploadAudioToStorage(uploadData)
    
    // 显示上传进度
    uploadProgress.value = 10
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 500)
    
    const resp = await uploadPromise
    clearInterval(progressInterval)
    uploadProgress.value = 100
    
    console.log('[creation] 上传响应:', resp)
    
    // 优先获取音频ID；兼容不同返回结构
    const audioIdCandidate = resp?.data?.audioId ?? resp?.data?.id ?? resp?.audioId ?? resp?.id
    if (audioIdCandidate != null) {
      creationData.value.audio_id = String(audioIdCandidate)
      uni.hideLoading()
      uni.showToast({ 
        title: '创作成功', 
        icon: 'success',
        duration: 2000
      })
      
      // 清空已选文件
      selectedFile.value = null
      
      // 如果设置了分享到社区，则跳转到分享页面
      if (creationData.value.shareToCommunity) {
        setTimeout(() => {
          uni.navigateTo({ 
            url: '/pages/creation/share?id=' + (resp.data?.id || resp.id || Date.now()) 
          })
        }, 800)
      } else {
        // 否则返回上一页
        setTimeout(() => goBack(), 800)
      }
    } else {
      throw new Error('上传成功但未获取到音频ID，响应：' + JSON.stringify(resp))
    }
  } catch (e) {
    console.error('[creation] 创作失败详情:', e)
    uni.hideLoading()
    
    // 更详细的错误信息
    let errorMessage = '创作失败'
    if (e.message && e.message.includes('Network')) {
      errorMessage = '网络连接失败，请检查网络设置'
    } else if (e.message && e.message.includes('Failed to fetch')) {
      errorMessage = '服务器连接失败，请稍后重试'
    } else if (e.message && e.message.includes('uploadService.uploadAudioToSupabase is not a function')) {
      errorMessage = '服务器内部错误：上传服务暂时不可用，请联系管理员或稍后重试。'
    } else if (e.message) {
      errorMessage = e.message
    }
    
    uni.showToast({ 
      title: errorMessage, 
      icon: 'none',
      duration: 3000
    })
  } finally {
    setTimeout(() => { uploadProgress.value = 0 }, 2000)
  }
}
// 返回上一页
function goBack() {
  try {
    uni.navigateBack()
  } catch(e) {
    if(typeof location !== 'undefined') location.hash = '#/pages/noise/Free'
  }
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

// 已移除不再使用的 uploadSelectedFile 函数
// 现在使用 createNoise 函数统一处理图标和音频文件的上传
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

// 上传音频图标到指定音频
async function uploadAudioCover(audioId, file) {
  if (!audioId) throw new Error('audioId is required')
  
  const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.135:3003'
  const url = BASE + `/api/audios/${audioId}/cover/upload`
  
  // 获取认证信息
  const auth = getAuthLocal()
  const token = auth?.token || auth?.access_token || null
  
  // 检查是否已登录
  if (!token) {
    throw new Error('未登录，无法上传图标')
  }
  
  // 检测是否为小程序环境
  const isMiniProgram = typeof uni !== 'undefined' && uni.uploadFile
  
  if (isMiniProgram) {
    // 小程序环境使用 uni.uploadFile
    return new Promise((resolve, reject) => {
      try {
        // 获取文件路径
        let filePath = file
        if (typeof file === 'object') {
          filePath = file.tempFilePath || file.path || file.uri || file.url || ''
        }
        
        if (!filePath) {
          return reject(new Error('文件路径为空，请重新选择文件'))
        }
        
        console.log('[creation] uploadAudioCover 上传到 /api/audios/:id/cover/upload')
        console.log('[creation] filePath:', filePath)
        
        // 构建请求头
        const header = {
          Authorization: `Bearer ${token}`
        }
        
        // 尝试使用不同的字段名
        const fieldNames = ['cover', 'file', 'image']
        
        const tryUpload = (fieldName, fieldIndex) => {
          uni.uploadFile({
            url: url,
            filePath: filePath,
            name: fieldName,
            header: header,
            success(uploadRes) {
              console.log(`[creation] uploadAudioCover 使用字段名 '${fieldName}' 响应状态码:`, uploadRes.statusCode)
              console.log(`[creation] uploadAudioCover 使用字段名 '${fieldName}' 响应数据:`, uploadRes.data)
              
              try {
                let uploadData = uploadRes.data
                if (typeof uploadData === 'string') {
                  try {
                    uploadData = JSON.parse(uploadData)
                  } catch (parseErr) {
                    console.warn('[creation] uploadAudioCover 解析响应失败', parseErr, '原始数据:', uploadData)
                    // 如果解析失败但状态码是 2xx，尝试直接使用原始数据
                    if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
                      uploadData = { raw: uploadRes.data }
                    } else {
                      // 尝试提取错误信息
                      let errorMsg = '上传失败'
                      try {
                        const errorObj = JSON.parse(uploadData)
                        errorMsg = errorObj?.message || errorObj?.error || errorMsg
                      } catch (_) {
                        if (uploadData && typeof uploadData === 'string') {
                          errorMsg = uploadData
                        }
                      }
                      // 如果是字段名错误，尝试下一个字段名
                      if (uploadRes.statusCode === 500 && String(errorMsg).includes('Unexpected field')) {
                        if (fieldIndex < fieldNames.length - 1) {
                          console.log(`[creation] 字段名 '${fieldName}' 不正确，尝试下一个字段名`)
                          return tryUpload(fieldNames[fieldIndex + 1], fieldIndex + 1)
                        }
                      }
                      return reject(new Error(`上传失败 (${uploadRes.statusCode}): ${errorMsg}`))
                    }
                  }
                }
                
                if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
                  resolve(uploadData)
                } else {
                  let errorMsg = uploadData?.message || uploadData?.error || `上传失败 (HTTP ${uploadRes.statusCode})`
                  // 特别处理认证失败的情况
                  if (uploadRes.statusCode === 401) {
                    errorMsg = '认证失败，请重新登录'
                  }
                  // 如果是字段名错误，尝试下一个字段名
                  if (uploadRes.statusCode === 500 && String(errorMsg).includes('Unexpected field')) {
                    if (fieldIndex < fieldNames.length - 1) {
                      console.log(`[creation] 字段名 '${fieldName}' 不正确，尝试下一个字段名`)
                      return tryUpload(fieldNames[fieldIndex + 1], fieldIndex + 1)
                    }
                  }
                  reject(new Error(errorMsg))
                }
              } catch (e) {
                console.error('[creation] uploadAudioCover 处理响应失败', e)
                reject(new Error('处理上传响应失败: ' + e.message))
              }
            },
            fail(err) {
              console.error('[creation] uploadAudioCover 上传失败', err)
              let errorMsg = err.errMsg || err.message || '上传失败'
              if (String(errorMsg).includes('timeout') || String(errorMsg).includes('超时')) {
                errorMsg = '上传超时，请检查网络连接或尝试较小的文件'
              } else if (String(errorMsg).includes('fail') && String(errorMsg).includes('500')) {
                errorMsg = '服务器内部错误 (500)，请稍后重试或联系管理员'
              }
              reject(new Error(errorMsg))
            }
          })
        }
        
        // 开始尝试上传，先使用第一个字段名
        tryUpload(fieldNames[0], 0)
      } catch (e) {
        console.error('[creation] uploadAudioCover 异常', e)
        reject(e)
      }
    })
  }
  
  // Web 环境使用 FormData + fetch
  // 尝试不同的字段名
  const fieldNames = ['cover', 'file', 'image']
  
  for (const fieldName of fieldNames) {
    const fd = new FormData()
    fd.append(fieldName, file)
    
    // 构建请求头
    const headers = {
      Authorization: `Bearer ${token}`
    }
    
    try {
      console.log(`[creation] uploadAudioCover 使用字段名 '${fieldName}' 上传到 /api/audios/:id/cover/upload (Web)`)
      const uploadRes = await fetch(url, {
        method: 'POST',
        headers,
        body: fd
      })
      
      let uploadData = null
      try {
        uploadData = await uploadRes.json()
      } catch (parseErr) {
        if (uploadRes.ok) {
          // 2xx 但无法解析 JSON，尝试作为文本处理
          const text = await uploadRes.text()
          uploadData = { raw: text }
        } else {
          // 如果是字段名错误，尝试下一个字段名
          if (uploadRes.status === 500) {
            const text = await uploadRes.text()
            if (text.includes('Unexpected field')) {
              console.log(`[creation] 字段名 '${fieldName}' 不正确，尝试下一个字段名`)
              continue
            }
          }
          throw new Error(`上传失败: HTTP ${uploadRes.status}`)
        }
      }
      
      if (!uploadRes.ok) {
        const errorMsg = uploadData?.message || uploadData?.error || `上传失败: HTTP ${uploadRes.status}`
        // 特别处理认证失败的情况
        if (uploadRes.status === 401) {
          throw new Error('认证失败，请重新登录')
        }
        // 如果是字段名错误，尝试下一个字段名
        if (uploadRes.status === 500 && String(errorMsg).includes('Unexpected field')) {
          console.log(`[creation] 字段名 '${fieldName}' 不正确，尝试下一个字段名`)
          continue
        }
        throw new Error(errorMsg)
      }
      
      console.log('[creation] uploadAudioCover 上传成功 (Web)', uploadData)
      return uploadData
    } catch (err) {
      console.error(`[creation] uploadAudioCover 使用字段名 '${fieldName}' 失败 (Web)`, err)
      // 如果是最后一个字段名，抛出错误
      if (fieldName === fieldNames[fieldNames.length - 1]) {
        throw err
      }
      // 否则继续尝试下一个字段名
    }
  }
  
  // 如果所有字段名都尝试过了都没有成功，抛出错误
  throw new Error('上传失败：所有可能的字段名都尝试过了')
}

// 上传音频图标功能
async function uploadCoverImage() {
  // 检查用户是否登录
  const auth = getAuthLocal()
  const loggedIn = Boolean(
    !auth?.guest &&
    !auth?.user?.guest &&
    (
      auth?.id ||
      auth?.user?.id ||
      auth?.userId ||
      auth?.user?.userId ||
      auth?.token ||
      auth?.access_token
    )
  )
  
  if (!loggedIn) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 2000
    })
    // 跳转到登录页面
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/auth/Login'
      })
    }, 1500)
    return
  }
  
  // 选择图片文件
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      
      uni.showLoading({
        title: '上传中...'
      })
      
      try {
        // 使用新的图标上传接口
        const uploadResult = await apiAudios.uploadIcon(tempFilePath)
        
        // 获取上传后的URL
        const coverUrl = uploadResult?.url || uploadResult?.data?.url || ''
        
        if (!coverUrl) {
          throw new Error('上传成功但未返回图片URL')
        }
        
        uni.hideLoading()
        uni.showToast({
          title: '图标上传成功',
          icon: 'success',
          duration: 2000
        })
        
        // 更新创作数据中的封面URL
        creationData.value.cover_url = coverUrl
        
      } catch (error) {
        uni.hideLoading()
        console.error('上传图标失败:', error)
        uni.showToast({
          title: '上传失败: ' + (error.message || String(error)),
          icon: 'none',
          duration: 3000
        })
      }
    },
    fail: () => {
      // 用户取消选择图片，不显示错误提示
      uni.hideLoading()
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

/* 上传图标区域 */
.cover-upload-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.cover-preview:hover .cover-overlay {
  opacity: 1;
}

.cover-change-btn {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.cover-placeholder {
  width: 120px;
  height: 120px;
  border: 2px dashed var(--border, #f0f0f0);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.cover-placeholder:active {
  border-color: var(--uni-color-primary, #007aff);
  background: var(--input-bg, #f8f9fa);
}

.cover-placeholder-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.cover-placeholder-text {
  font-size: 14px;
  color: var(--muted, #666);
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