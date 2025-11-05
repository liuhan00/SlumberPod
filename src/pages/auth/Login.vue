<template>
  <view class="page">
    <!-- 背景装饰 -->
    <view class="background">
      <view class="moon">🌙</view>
      <view class="stars">
        <view class="star" v-for="i in 20" :key="i" :style="getStarStyle(i)"></view>
      </view>
      <view class="clouds">
        <view class="cloud cloud-1">☁️</view>
        <view class="cloud cloud-2">☁️</view>
        <view class="cloud cloud-3">☁️</view>
      </view>
    </view>
    
    <view class="card">
      <!-- Logo和标题 -->
      <view class="header">
        <view class="logo">💤</view>
        <text class="title">星眠坞</text>
        <text class="subtitle">给你一个婴儿般好睡眠</text>
      </view>
      
      <!-- 登录表单 -->
      <view class="form">
        <view class="auth-actions">
          <button class="btn primary" @click="wxAuthLogin" :disabled="loading">
            <text v-if="!loading">使用微信登录</text>
            <text v-else>登录中...</text>
          </button>
          <button class="btn secondary" @click="guestLogin" :disabled="loading">
            以游客身份进入
          </button>
        </view>
      </view>
      
      <!-- 底部提示 -->
      <view class="footer">
        <!-- 提示已移除 -->
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { saveAuthLocal } from '@/store/auth'

// 微信登录函数引用
let wxLoginFunction = null
// #ifdef MP-WEIXIN
// 在微信环境下直接导入
import { wxLogin } from '@/api/auth'
wxLoginFunction = wxLogin
// #endif

const loading = ref(false)
const passwordVisible = ref(false)

// 生成星星样式
function getStarStyle(index) {
  const left = Math.random() * 100
  const top = Math.random() * 100
  const size = Math.random() * 2 + 1
  const delay = Math.random() * 3
  const duration = Math.random() * 2 + 2
  
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

function colorForHour(h){
  if(h>=6 && h<12) return '#FFF7E6'
  if(h>=12 && h<18) return '#E6F7FF'
  if(h>=18 && h<21) return '#F5E6FF'
  return '#0f1724'
}
function hexToRgb(hex){
  hex = hex.replace('#','')
  if(hex.length===3) hex = hex.split('').map(c=>c+c).join('')
  const num = parseInt(hex,16)
  return [(num>>16)&255, (num>>8)&255, num&255]
}
function luminance([r,g,b]){
  const a = [r,g,b].map(v=>{ v/=255; return v<=0.03928? v/12.92: Math.pow((v+0.055)/1.055,2.4) })
  return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]
}
function contrastTextColor(bgHex){
  const lum = luminance(hexToRgb(bgHex))
  return lum > 0.5 ? '#000' : '#fff'
}
function applyThemeByTime(){
  const h = new Date().getHours()
  const bg = colorForHour(h)
  const text = contrastTextColor(bg)
  // Only manipulate document in web environment
  // #ifndef MP-WEIXIN
  document.documentElement.style.setProperty('--card-bg', bg)
  document.documentElement.style.setProperty('--text-color', text)
  // #endif
  // #ifdef MP-WEIXIN
  // For mini-programs set css variables on body via uni.setNavigationBarColor or keep styles in-page
  try{ uni.setNavigationBarColor && uni.setNavigationBarColor({ frontColor: (text==='\#000'? '#000000': text), backgroundColor: bg }) }catch(e){}
  // #endif
}
onMounted(()=>{
  applyThemeByTime()
  setInterval(applyThemeByTime, 60*1000)
})

function validate(){ return null }

async function submit(){
  // deprecated
}

async function wxAuthLogin(){
  loading.value = true
  try{
    // #ifdef MP-WEIXIN
    if (typeof wxLoginFunction === 'function') {
      await wxLoginFunction()
      uni.showToast({ title: '登录成功', icon: 'success' })
      uni.reLaunch({ url: '/pages/noise/Free' })
    } else {
      uni.showToast({ title: '微信登录功能不可用', icon: 'none' })
    }
    // #endif
    
    // #ifndef MP-WEIXIN
    uni.showToast({ title: '微信登录功能仅在微信小程序中可用', icon: 'none' })
    // #endif
  }catch(e){
    console.error('微信登录错误:', e)
    uni.showToast({ title: e.message || '登录失败', icon: 'none' })
  }finally{ loading.value = false }
}

function guestLogin(){
  // create a temporary guest session locally
  const guest = { id: `guest_${Date.now()}`, guest: true }
  try{ uni.setStorageSync('app_auth_user', { token: null, user: guest }) }catch(e){}
  uni.reLaunch({ url: '/pages/noise/Free' })
}

function goRegister(){ 
  uni.navigateTo({ url:'/pages/auth/Register' })
}


</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-color);
  background-image: var(--bg-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.moon {
  position: absolute;
  top: 60px;
  right: 40px;
  font-size: 48px;
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
  animation: float 6s ease-in-out infinite;
}

.stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: twinkle 3s ease-in-out infinite;
}

.clouds {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.cloud {
  position: absolute;
  font-size: 32px;
  opacity: 0.3;
  animation: drift 20s linear infinite;
}

.cloud-1 { top: 30%; left: -50px; animation-delay: 0s; }
.cloud-2 { top: 50%; left: -80px; animation-delay: 5s; }
.cloud-3 { top: 70%; left: -60px; animation-delay: 10s; }

.card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px 32px;
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  font-size: 64px;
  margin-bottom: 16px;
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-color);
  display: block;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--muted);
}

.form {
  margin-bottom: 24px;
}

.field {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 0 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.field:focus-within {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
}

.field-icon {
  font-size: 18px;
  margin-right: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.input {
  flex: 1;
  height: 56px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary); /* 更高对比度 */
  font-size: 16px;
}

.input::placeholder {
  color: var(--muted);
}

/* 眼睛按钮改为透明背景、移除圆角 */
.eye{ background: transparent; border: none; margin-left:8px; font-size:18px; padding:0; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:0 }

.btn {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.btn.primary {
  background: var(--bg-color); background-image: var(--bg-gradient);
  color: var(--text-color);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.btn.primary:active {
  transform: translateY(2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.btn.secondary {
  background: transparent;
  color: var(--muted);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.btn.secondary:active {
  background: rgba(255, 255, 255, 0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
}

.line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
}

.divider-text {
  padding: 0 16px;
  color: var(--muted);
  font-size: 14px;
}

.footer {
  text-align: center;
}

.hint {
  font-size: 12px;
  color: var(--muted);
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes drift {
  0% { transform: translateX(0); }
  100% { transform: translateX(100vw); }
}
</style>