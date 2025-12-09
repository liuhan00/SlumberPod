<template>
  <view class="page">
    <!-- 学习场景背景 -->
    <view class="scene-bg">
      <image class="scene-bg-img" :src="learnPng" mode="aspectFill" />
      <view class="scene-content">
        <!-- 可以在这里添加学习场景的装饰元素 -->
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view class="content-wrapper">
      <!-- 顶部状态栏（可选，显示时间等） -->
      <view class="top-status">
        <button class="back-btn" @click="handleBackClick">←</button>
        <text class="status-time">{{ currentTime }}</text>
      </view>

      <!-- 左下角计时器 -->
      <view class="timer-display">
        <text class="timer-text">{{ formattedTime }}</text>
      </view>

      <!-- 音乐选择区域（右上角或中间） -->
      <view class="music-selector" v-if="showMusicSelector">
        <scroll-view class="music-list" scroll-y>
          <view v-if="loadingAudios">加载中...</view>
          <view v-else-if="loadAudiosError">获取音频失败：{{ loadAudiosError }}</view>
          <view 
            v-else
            v-for="audio in focusAudios" 
            :key="audio.id"
            :class="['music-item', { active: currentAudio?.id === audio.id }]"
            @click="selectAudio(audio)"
          >
            <text class="music-name">{{ audio.name }}</text>
            <text v-if="currentAudio?.id === audio.id" class="playing-icon">▶</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 底部控制栏（固定底部，顺序：音乐 按钮 | 计时器 | 播放/暂停） -->
    <view class="bottom-controls">
      <button class="control-btn" @click="toggleMusic" aria-label="音乐">
        <view class="icon-svg">
          <image src="/static/icons/music.svg" mode="aspectFit" />
        </view>
      </button>
      <button class="control-btn" @click="toggleTimer">
        <view class="icon-svg">
          <image src="/static/icons/timer.svg" mode="aspectFit" />
        </view>
      </button>
      <button class="control-btn" @click="togglePause">
        <view class="icon-svg">
          <image src="/src/static/icons/pause.svg" v-if="isTimerRunning" mode="aspectFit" />
          <image src="/src/static/icons/play.svg" v-else mode="aspectFit" />
        </view>
      </button>
    </view>

    <!-- 计时器设置弹窗：选择退出后是否继续计时 -->
    <view v-if="showTimerSettings" class="timer-settings-overlay" @click="closeTimerSettings">
      <view class="timer-settings" @click.stop>
        <text class="ts-title">退出学习</text>
        <text class="ts-subtitle">请选择退出方式</text>
        <view class="ts-option" @click="handleContinueAndReturn">
          <view class="ts-option-content">
            <text class="ts-label">继续计时</text>
            <text class="ts-desc">暂停当前计时，下次进入接着计时</text>
          </view>
          <text class="ts-icon">→</text>
        </view>
        <view class="ts-option" @click="handleResetAndReturn">
          <view class="ts-option-content">
            <text class="ts-label">重新计时</text>
            <text class="ts-desc">结束本次学习，下次从 00:00 开始</text>
          </view>
          <text class="ts-icon">→</text>
        </view>
        <view class="ts-actions">
          <button class="ts-cancel" @click="closeTimerSettings">取消</button>
        </view>
      </view>
    </view>
    
    <!-- 退出确认弹窗 -->
    <view v-if="showExitConfirm" class="exit-confirm-overlay" @click="closeExitConfirm">
      <view class="exit-confirm" @click.stop>
        <text class="ec-title">学习计时</text>
        <text class="ec-message">请选择退出后的操作：</text>
        <view class="ec-options">
          <button class="ec-option-btn" @click="handleExitWithPause">暂停计时（下次继续）</button>
          <button class="ec-option-btn" @click="handleExitWithEnd">结束计时（本次学习结束）</button>
        </view>
        <view class="ec-actions">
          <button class="ec-cancel" @click="closeExitConfirm">取消</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import learnPng from '@/static/learn.png'
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { usePlayerStore } from '@/stores/player'
import * as apiAudios from '@/api/audios'
import * as studyApi from '@/api/study'

const { bgStyle } = useGlobalTheme()
const player = usePlayerStore()

// 正向计时器（从00:00开始）
const elapsedSeconds = ref(0)
const isTimerRunning = ref(false)
const currentAudio = ref(null)
const showMusicSelector = ref(false)
const showExitConfirm = ref(false)
const sessionId = ref(null)
const timerRefs = ref({ timerInterval: null, timeInterval: null })
const showTimerSettings = ref(false)
const resumePolicy = ref(true) // true: resume next time; false: reset next time

// 当前时间显示
const currentTime = ref('')

// 专注类白噪音列表（示例数据，实际应从后端获取）
// 全部可选音频（示例），包含 category 字段以便筛选
const allAudios = [
  { id: 1, name: '雨声轻柔', src: '', category: '雨声' },
  { id: 2, name: '雨声深沉', src: '', category: '雨声' },
  { id: 3, name: '咖啡厅雨声', src: '', category: '咖啡' },
  { id: 4, name: '咖啡轻响', src: '', category: '咖啡' },
  { id: 5, name: '图书馆低语', src: '', category: '图书馆' },
  { id: 6, name: '森林鸟鸣', src: '', category: '森林' }
]

const focusAudios = ref(allAudios.slice(0,4)) // 初始显示部分列表
const loadingAudios = ref(false)
const loadAudiosError = ref('')

// 格式化计时器时间（正向计时）
const formattedTime = computed(() => {
  const mm = String(Math.floor(elapsedSeconds.value / 60)).padStart(2, '0')
  const ss = String(elapsedSeconds.value % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

// 更新当前时间
function updateCurrentTime() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  currentTime.value = `${hh}:${mm}`
}

// 切换暂停/开始状态
async function togglePause() {
  console.log('[Study] 切换暂停/开始状态，当前状态:', isTimerRunning.value)
  if (isTimerRunning.value) {
    await pauseTimer()
  } else {
    await startTimer()
  }
}

// 开始/恢复计时
async function startTimer() {
  try {
    console.log('[Study] 开始计时')
    // 如果还没有会话ID，则开始新会话
    if (!sessionId.value) {
      console.log('[Study] 调用 startStudySession API')
      const response = await studyApi.startStudySession()
      console.log('[Study] startStudySession 响应:', response)
      
      // 更健壮地处理响应数据，尝试从不同字段获取 sessionId
      sessionId.value = response.sessionId || response.id || response._id || response.session_id || null
      if (!sessionId.value) {
        console.warn('[Study] 无法从响应中获取 sessionId:', response)
        throw new Error('服务器响应中缺少会话ID')
      }
      
      // 同样更健壮地处理持续时间
      elapsedSeconds.value = response.duration || response.seconds || response.time || 0
    }
    
    isTimerRunning.value = true
    
    // 每秒更新本地显示的时间（实际计时由后端处理）
    timerRefs.value.timerInterval = setInterval(() => {
      elapsedSeconds.value += 1
    }, 1000)
    console.log('[Study] 计时器已启动')
  } catch (error) {
    console.error('[Study] 开始计时失败:', error)
    uni.showToast({ title: '开始计时失败: ' + (error.message || '未知错误'), icon: 'none' })
  }
}

// 暂停计时
async function pauseTimer() {
  if (!sessionId.value) {
    console.log('[Study] 没有会话ID，无法暂停')
    uni.showToast({ title: '没有有效的学习会话，无法暂停', icon: 'none' })
    return
  }
  
  try {
    console.log('[Study] 暂停计时，会话ID:', sessionId.value)
    isTimerRunning.value = false
    
    // 清除本地定时器
    if (timerRefs.value.timerInterval) {
      clearInterval(timerRefs.value.timerInterval)
      timerRefs.value.timerInterval = null
    }
    
    // 调用后端暂停接口
    const response = await studyApi.pauseStudySession(sessionId.value)
    console.log('[Study] pauseStudySession 响应:', response)
    
    // 更健壮地处理持续时间
    elapsedSeconds.value = response.duration || response.seconds || response.time || elapsedSeconds.value
    console.log('[Study] 计时器已暂停')
  } catch (error) {
    console.error('[Study] 暂停计时失败:', error)
    uni.showToast({ title: '暂停计时失败: ' + (error.message || '未知错误'), icon: 'none' })
  }
}

function resetTimer() {
  pauseTimer()
  elapsedSeconds.value = 0
}

async function loadCoffeeRainAudios(){
  console.log('[Study] loadCoffeeRainAudios start')
  // 先尝试从后端查分类拿到对应的 category_id，再分别请求两类音频
  try{
    const BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.162:3003'
    const url = BASE + '/api/categories?limit=1000'
    console.log('[Study] fetch categories url', url)
    let resp
    if(typeof fetch === 'function'){
      const r = await fetch(url)
      resp = await r.json()
      console.log('[Study] fetch categories response', resp)
    } else {
      resp = await new Promise((resolve,reject)=>{
        uni.request({ url, method:'GET', success(res){ console.log('[Study] uni.request categories success', res); resolve(res.data) }, fail(err){ console.warn('[Study] uni.request categories fail', err); reject(err) } })
      })
    }
    const items = Array.isArray(resp) ? resp : (resp.data || resp.items || [])
    // find ids for names '咖啡' 和 '雨声'（后端可能使用不同命名，尝试多种匹配）
    const findIdByName = name => {
      const lower = String(name).toLowerCase()
      const found = items.find(it => String(it.name || '').toLowerCase() === lower || String(it.slug || '').toLowerCase() === lower)
      if(found) return found.id || found.category_id || found._id || found.uuid
      // try includes
      const includes = items.find(it => String(it.name || '').toLowerCase().includes(lower))
      return includes ? (includes.id || includes.category_id || includes._id || includes.uuid) : null
    }
    const rainId = findIdByName('雨声')
    const coffeeId = findIdByName('咖啡')
    console.log('[Study] found category ids', { rainId, coffeeId })

    const results = []
    // 确保 apiAudios 可用（某些构建/运行环境下 import 可能失败）
    let api = typeof apiAudios !== 'undefined' ? apiAudios : null
    if(!api){
      try{ api = (await import('@/api/audios')) }
      catch(e){ console.warn('[Study] dynamic import @/api/audios failed', e) }
    }

    loadingAudios.value = true
    try{
      if(rainId && api && api.getAudios) {
        console.log('[Study] fetching rain audios with id', rainId)
        const r = await api.getAudios({ category_id: rainId, limit: 50 })
        console.log('[Study] rain audios response', r)
        const arr = Array.isArray(r) ? r : (r.data || r.items || [])
        results.push(...arr.map(it=>({ name: it.title || it.name || it.audioName || '', category: '雨声' })))
      }
      if(coffeeId && api && api.getAudios) {
        console.log('[Study] fetching coffee audios with id', coffeeId)
        const r2 = await api.getAudios({ category_id: coffeeId, limit: 50 })
        console.log('[Study] coffee audios response', r2)
        const arr2 = Array.isArray(r2) ? r2 : (r2.data || r2.items || [])
        results.push(...arr2.map(it=>({ name: it.title || it.name || it.audioName || '', category: '咖啡' })))
      }
    }catch(e){
      console.warn('[Study] fetch audios failed', e)
      loadAudiosError.value = String(e.message || e)
    }finally{
      loadingAudios.value = false
    }

    // 如果都没有结果，回退到本地示例数据
    if(results.length === 0) {
      console.log('[Study] no remote results, fallback to local')
      focusAudios.value = allAudios.filter(a => a.category === '咖啡' || a.category === '雨声')
    } else {
      // normalize to shape used by UI
      focusAudios.value = results.map((it, idx) => ({ id: 'r:'+idx, name: it.name, src: '', category: it.category }))
      console.log('[Study] focusAudios set from remote', focusAudios.value)
    }
  }catch(e){
    console.warn('[Study] loadCoffeeRainAudios failed, fallback to local', e)
    focusAudios.value = allAudios.filter(a => a.category === '咖啡' || a.category === '雨声')
  }
}

function toggleMusic() {
  console.log('[Study] 切换音乐选择器，当前状态:', showMusicSelector.value)
  showMusicSelector.value = !showMusicSelector.value
  if (showMusicSelector.value) {
    // 打开时请求后端音频分类（优先获取真实数据）
    loadCoffeeRainAudios()
  }
}

function toggleTimer() {
  console.log('[Study] 切换计时器设置，当前状态:', showTimerSettings.value)
  showTimerSettings.value = true
}

function closeTimerSettings(){ 
  console.log('[Study] 关闭计时器设置')
  showTimerSettings.value = false 
}

function toggleScreen() {
  // 屏幕设置已删除，功能不再需要
}

function selectAudio(audio) {
  console.log('[Study] 选择音频:', audio)
  currentAudio.value = audio
  showMusicSelector.value = false
  // 这里应该调用播放器播放音频
  // player.play(audio)
}

// 在<script setup>中，我们需要将函数声明改为函数表达式的形式以确保正确的提升
// 处理退出并暂停计时
const handleExitWithPause = async function() {
  console.log('[Study] 处理退出并暂停计时')
  if (sessionId.value) {
    try {
      console.log('[Study] 调用 pauseStudySession API，会话ID:', sessionId.value)
      const response = await studyApi.pauseStudySession(sessionId.value)
      console.log('[Study] pauseStudySession 响应:', response)
      uni.showToast({ title: '已暂停计时', icon: 'success' })
      console.log('[Study] 计时已暂停')
    } catch (error) {
      console.error('[Study] 暂停计时失败:', error)
      uni.showToast({ title: '暂停计时失败: ' + (error.message || '未知错误'), icon: 'none' })
    }
  } else {
    console.log('[Study] 没有会话ID，跳过暂停API调用')
    uni.showToast({ title: '没有有效的学习会话', icon: 'none' })
  }
  closeExitConfirm()
  // 返回到小屋页面
  uni.navigateBack()
}

// 处理退出并结束计时
const handleExitWithEnd = async function() {
  console.log('[Study] 处理退出并结束计时')
  if (sessionId.value) {
    try {
      console.log('[Study] 调用 endStudySession API，会话ID:', sessionId.value)
      const response = await studyApi.endStudySession(sessionId.value)
      console.log('[Study] endStudySession 响应:', response)
      // 显示学习统计信息
      const duration = response.duration || response.seconds || response.time || elapsedSeconds.value
      const minutes = Math.floor(duration / 60)
      
      // 获取学习统计数据
      let statsMessage = `${minutes} 分钟`
      try {
        console.log('[Study] 调用 getStudyStats API')
        const stats = await studyApi.getStudyStats()
        console.log('[Study] getStudyStats 响应:', stats)
        // 假设返回的数据结构包含 totalMinutes 字段
        if (stats && typeof stats === 'object' && 'totalMinutes' in stats) {
          const totalHours = Math.floor(stats.totalMinutes / 60)
          const remainingMinutes = stats.totalMinutes % 60
          statsMessage = `${minutes} 分钟，累计学习 ${totalHours} 小时 ${remainingMinutes} 分钟`
        } else if (stats && typeof stats === 'object' && 'totalHours' in stats) {
          // 备用字段名
          statsMessage = `${minutes} 分钟，累计学习 ${stats.totalHours} 小时`
        }
      } catch (statsError) {
        console.warn('[Study] 获取学习统计失败:', statsError)
      }
      
      uni.showModal({
        title: '学习完成',
        content: `本次学习了 ${statsMessage}，继续保持！`,
        showCancel: false,
        success: () => {
          // 返回到小屋页面
          uni.navigateBack()
        }
      })
    } catch (error) {
      console.error('[Study] 结束计时失败:', error)
      uni.showToast({ title: '结束计时失败: ' + (error.message || '未知错误'), icon: 'none' })
      // 即使失败也返回到小屋页面
      uni.navigateBack()
    }
  } else {
    // 没有会话ID，直接返回
    console.log('[Study] 没有会话ID，直接返回')
    uni.showToast({ title: '没有有效的学习会话', icon: 'none' })
    uni.navigateBack()
  }
  closeExitConfirm()
}

// 显示退出确认弹窗（用于其他场景）
const showExitConfirmation = function() {
  console.log('[Study] 显示退出确认弹窗')
  showExitConfirm.value = true
}

// 关闭退出确认弹窗
const closeExitConfirm = function() {
  console.log('[Study] 关闭退出确认弹窗')
  showExitConfirm.value = false
}

// 处理返回按钮点击
function handleBackClick() {
  console.log('[Study] 用户点击返回按钮')
  // 如果计时器正在运行或存在会话ID,显示计时器设置弹窗
  if (isTimerRunning.value || sessionId.value) {
    showTimerSettings.value = true
    console.log('[Study] 显示计时器设置弹窗')
  } else {
    // 直接返回
    uni.navigateBack()
  }
}

// 继续计时并返回
async function handleContinueAndReturn() {
  console.log('[Study] 用户选择继续计时')
  // 保存设置：下次继续计时
  uni.setStorageSync('studyTimerResumePolicy', { resume: true })
  resumePolicy.value = true
  
  // 调用暂停接口
  if (sessionId.value) {
    try {
      console.log('[Study] 调用 pauseStudySession API')
      const response = await studyApi.pauseStudySession(sessionId.value)
      console.log('[Study] pauseStudySession 响应:', response)
      uni.showToast({ title: '已暂停计时', icon: 'success', duration: 1000 })
    } catch (error) {
      console.error('[Study] 暂停计时失败:', error)
      uni.showToast({ title: '暂停失败', icon: 'none', duration: 1500 })
    }
  }
  
  // 关闭弹窗并返回
  closeTimerSettings()
  setTimeout(() => {
    uni.navigateBack()
  }, 300)
}

// 重新计时并返回
async function handleResetAndReturn() {
  console.log('[Study] 用户选择重新计时')
  // 保存设置：下次重新计时
  uni.setStorageSync('studyTimerResumePolicy', { resume: false })
  resumePolicy.value = false
  
  // 调用结束接口
  if (sessionId.value) {
    try {
      console.log('[Study] 调用 endStudySession API')
      const response = await studyApi.endStudySession(sessionId.value)
      console.log('[Study] endStudySession 响应:', response)
      
      // 获取学习时长
      const duration = response.duration || response.seconds || response.time || elapsedSeconds.value
      const minutes = Math.floor(duration / 60)
      const seconds = duration % 60
      
      // 获取累计学习统计
      let statsMessage = `本次学习 ${minutes} 分钟 ${seconds} 秒`
      try {
        const stats = await studyApi.getStudyStats()
        if (stats && typeof stats === 'object' && 'totalMinutes' in stats) {
          const totalHours = Math.floor(stats.totalMinutes / 60)
          const remainingMinutes = stats.totalMinutes % 60
          statsMessage += `\n累计学习 ${totalHours} 小时 ${remainingMinutes} 分钟`
        }
      } catch (statsError) {
        console.warn('[Study] 获取学习统计失败:', statsError)
      }
      
      // 显示鼓励弹窗
      uni.showModal({
        title: '学习完成 🎉',
        content: `${statsMessage}\n\n继续保持，你很棒！`,
        showCancel: false,
        confirmText: '好的',
        success: () => {
          closeTimerSettings()
          setTimeout(() => {
            uni.navigateBack()
          }, 200)
        }
      })
    } catch (error) {
      console.error('[Study] 结束计时失败:', error)
      uni.showToast({ title: '结束失败', icon: 'none', duration: 1500 })
      // 即使失败也允许返回
      closeTimerSettings()
      setTimeout(() => {
        uni.navigateBack()
      }, 300)
    }
  } else {
    // 没有会话ID，直接返回
    closeTimerSettings()
    uni.navigateBack()
  }
}



// uni-app 特有的页面返回处理函数
// 必须在所有其他代码之前定义,以便正确注册
function onBackPress() {
  console.log('[Study] 页面返回事件触发')
  // 如果计时器正在运行或存在会话ID，显示计时器设置弹窗
  if (isTimerRunning.value || sessionId.value) {
    // 显示计时器设置弹窗，让用户选择继续计时还是重新计时
    showTimerSettings.value = true
    console.log('[Study] 显示计时器设置弹窗')
    // 阻止默认的返回行为
    return true
  }
  // 允许默认的返回行为
  console.log('[Study] 允许默认返回行为')
  return false
}

// 在onMounted中注册onBackPress事件处理器
onMounted(() => {
  console.log('[Study] 页面挂载')
  updateCurrentTime()
  // 每秒更新一次当前时间
  timerRefs.value.timeInterval = setInterval(updateCurrentTime, 1000)
  
  // 恢复上次状态
  const savedState = uni.getStorageSync('studyTimerState')
  const cfg = uni.getStorageSync('studyTimerResumePolicy')
  if(typeof cfg === 'object' && cfg !== null){ resumePolicy.value = !!cfg.resume }
  if (savedState) {
    // 根据用户选择的策略决定是否恢复计时
    if(resumePolicy.value){
      elapsedSeconds.value = savedState.elapsedSeconds || 0
      isTimerRunning.value = savedState.isTimerRunning || false
      sessionId.value = savedState.sessionId || null
      if (isTimerRunning.value && sessionId.value) {
        startTimer()
      }
    } else {
      // 不恢复计时，只恢复状态为未运行
      elapsedSeconds.value = 0
      isTimerRunning.value = false
      sessionId.value = null
    }
  }
  console.log('[Study] 初始化完成，状态:', { elapsedSeconds: elapsedSeconds.value, isTimerRunning: isTimerRunning.value, sessionId: sessionId.value })
  
  // 注册返回按键事件处理器
  // 在uni-app中，我们可以通过getCurrentPages获取当前页面并设置onBackPress
  try {
    const pages = getCurrentPages()
    if (pages && pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      // 确保currentPage存在且可以设置属性
      if (currentPage && typeof currentPage === 'object') {
        currentPage.onBackPress = onBackPress
        console.log('[Study] onBackPress 已注册到当前页面')
      }
    }
  } catch (e) {
    console.warn('[Study] 注册onBackPress失败:', e)
  }
})

// 页面返回事件处理（uni-app推荐方式）
onBeforeUnmount(() => {
  console.log('[Study] 页面即将卸载')
})

// 在某些平台上，我们需要显式地将onBackPress函数暴露给页面实例
defineExpose({
  onBackPress
})

onUnmounted(() => {
  console.log('[Study] 页面卸载，清理定时器')
  // 清除所有定时器
  if (timerRefs.value.timerInterval) {
    clearInterval(timerRefs.value.timerInterval)
  }
  if (timerRefs.value.timeInterval) {
    clearInterval(timerRefs.value.timeInterval)
  }
  
  // 保存状态
  uni.setStorageSync('studyTimerState', {
    elapsedSeconds: elapsedSeconds.value,
    isTimerRunning: isTimerRunning.value,
    sessionId: sessionId.value
  })
  console.log('[Study] 状态已保存')
})

</script>

<style scoped>
.page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 学习场景背景 */
.scene-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  overflow: hidden;
}
.scene-bg-img{
  position:absolute;
  left:0; top:0; right:0; bottom:0;
  width:100%; height:100%;
  z-index: 0;
}

.scene-content {
  width: 100%;
  height: 100%;
  /* 可以添加背景图片或更多装饰元素 */
}

/* 主要内容区域 */
.content-wrapper {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 56px 12px 0 12px; /* 顶部留出导航/状态高度，左右内边距避免内容贴边 */
  display: flex;
  flex-direction: column;
}

/* 顶部状态栏 */
.top-status {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 20px;
  color: var(--fg);
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

.status-time {
  font-size: 14px;
  color: var(--fg);
  font-weight: 500;
}

/* 左下角计时器 */
.timer-display {
  position: absolute;
  bottom: 80px;
  left: 16px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 12px;
}

.timer-text {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}

/* 音乐选择器 */
.music-selector {
  position: absolute;
  top: 60px;
  right: 16px;
  width: 200px;
  max-height: 400px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.music-list {
  max-height: 350px;
}

.music-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 4px;
  cursor: pointer;
}

.music-item.active {
  background: rgba(123, 97, 255, 0.1);
}

.music-name {
  font-size: 14px;
  color: var(--fg);
}

.playing-icon {
  font-size: 12px;
  color: #7B61FF;
}

/* 底部控制栏 */
.bottom-controls {
  position: fixed;
  bottom: 0; /* 固定在最底端 */
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 1200; /* 提升 z-index 确保在 tabBar 之上 */
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  height: 56px;
}

.control-btn {
  background: transparent;
  border: none;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.control-btn:active {
  background: rgba(0, 0, 0, 0.05);
}

.control-btn .icon {
  font-size: 24px;
  line-height: 1;
  color: #111; /* 统一黑色图标（开始/暂停均为黑色） */
  display: none; /* 隐藏原始文本符号，使用 SVG */
}
.control-btn .icon-svg{ width:44px; height:44px; display:flex; align-items:center; justify-content:center }
.control-btn .icon-svg image{ width:28px; height:28px; display:block }
.control-btn .icon-svg svg{ width:28px; height:28px; display:block }

/* 确保三个底部按钮没有文字标签并垂直居中 */
.control-btn .pillow-label, .control-btn .pillow-text { display: none }
.control-btn { height: 44px; width: 44px; border-radius: 8px }


/* 睡觉按钮样式 - 抱枕风格 */
/* 删除抱枕样式（使用统一底部三个按钮） */
.pillow-btn, .pillow-inner, .pillow-highlight, .pillow-label, .sleep-btn { display: none !important }

/* 计时器设置弹窗样式：固定居中，不影响页面高度 */
.timer-settings-overlay{
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.timer-settings{
  width: calc(100vw - 48px);
  max-width: 420px;
  background: rgba(255,255,255,0.98);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.28);
}
.timer-settings .ts-title{ font-size:18px; font-weight:700; margin-bottom:4px; color:#111; text-align:center }
.timer-settings .ts-subtitle{ font-size:14px; color:#666; margin-bottom:16px; display:block; text-align:center }
.timer-settings .ts-option{ 
  display:flex; 
  justify-content:space-between; 
  align-items:center; 
  padding:16px; 
  border-radius:12px; 
  cursor:pointer; 
  background:#f8f8f8;
  margin-bottom:12px;
  transition: all 0.2s;
}
.timer-settings .ts-option:active{ 
  background: rgba(123,97,255,0.1);
  transform: scale(0.98);
}
.timer-settings .ts-option-content{
  flex: 1;
}
.timer-settings .ts-label{ 
  color:#111; 
  font-size:15px; 
  font-weight:600; 
  display:block; 
  margin-bottom:4px;
}
.timer-settings .ts-desc{
  color:#666;
  font-size:12px;
  display:block;
}
.timer-settings .ts-icon{ 
  color:#7B61FF; 
  font-size:20px;
  margin-left:12px;
}
.timer-settings .ts-check{ color:#7B61FF; font-size:18px }
.timer-settings .ts-actions{ display:flex; gap:10px; justify-content:center; margin-top:8px }
.timer-settings .ts-cancel{ background:transparent; border:1px solid rgba(0,0,0,0.1); padding:10px 24px; border-radius:8px; color:#666 }
.timer-settings .ts-save{ background:#111; color:#fff; border:none; padding:8px 12px; border-radius:8px }

/* 退出确认弹窗样式 */
.exit-confirm-overlay{
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.exit-confirm{
  width: calc(100vw - 48px);
  max-width: 420px;
  background: rgba(255,255,255,0.98);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.28);
}
.exit-confirm .ec-title{ font-size:16px; font-weight:700; margin-bottom:12px; color:#111 }
.exit-confirm .ec-message{ font-size:14px; color:#333; margin-bottom:16px; display:block }
.exit-confirm .ec-options{ display:flex; flex-direction:column; gap:10px; margin-bottom:16px }
.ec-option-btn{ 
  background:#f5f5f5; 
  border:none; 
  padding:12px; 
  border-radius:8px; 
  text-align:left;
  width:100%;
}
.ec-option-btn:first-child{
  background:#7B61FF;
  color:white;
}
.exit-confirm .ec-actions{ display:flex; justify-content:flex-end }
.exit-confirm .ec-cancel{ background:transparent; border:1px solid rgba(0,0,0,0.06); padding:8px 12px; border-radius:8px }

/* 响应式调整 */
@media (max-width: 750px) {
  .timer-display {
    bottom: 100px;
    left: 12px;
  }
  
  .timer-text {
    font-size: 20px;
  }
  
  .music-selector {
    width: 180px;
    right: 12px;
  }
}
</style>

