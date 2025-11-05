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
        <text class="title">加入星眠坞</text>
        <text class="subtitle">开启你的优质睡眠之旅</text>
      </view>
      
      <!-- 注册表单 -->
      <view class="form">
        <view class="field">
          <view class="field-icon">👤</view>
          <input v-model="name" placeholder="昵称" class="input" />
        </view>
        <view class="field">
          <view class="field-icon">📱</view>
          <input v-model="identifier" placeholder="手机号或邮箱" class="input" />
        </view>
        <view class="field">
          <view class="field-icon">🔒</view>
          <input :type="passwordVisible ? 'text' : 'password'" v-model="password" placeholder="" class="input" />
          <button type="button" class="eye" @click="passwordVisible = !passwordVisible">{{ passwordVisible ? '👁️' : '🙈' }}</button>
        </view>
        <view class="password-hint">密码需包含大小写字母和数字，且长度至少为8位</view>
        
        <button class="btn primary" @click="submit" :disabled="loading">
          <text v-if="!loading">开始睡眠之旅</text>
          <text v-else>注册中...</text>
        </button>
        
        <view class="divider">
          <view class="line"></view>
          <text class="divider-text">或</text>
          <view class="line"></view>
        </view>
        
        <button class="btn secondary" @click="goLogin">
          已有账号，去登录
        </button>
      </view>
      
      <!-- 底部提示 -->
      <view class="footer">
        <text class="hint">注册后将自动登录并保存用户信息到本地</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { saveAuthLocal } from '@/store/auth'

const name = ref('')
const identifier = ref('')
const password = ref('')
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

// 根据小时生成背景颜色（简单方案）
function colorForHour(h){
  // morning: 6-11, day:12-17, evening:18-20, night:21-5
  if(h>=6 && h<12) return '#FFF7E6' // warm light
  if(h>=12 && h<18) return '#E6F7FF' // light blue
  if(h>=18 && h<21) return '#F5E6FF' // purple-ish
  return '#0f1724' // dark night
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
  document.documentElement.style.setProperty('--card-bg', bg)
  document.documentElement.style.setProperty('--text-color', text)
}

onMounted(()=>{
  applyThemeByTime()
  // 每分钟检查一次以便跨小时变换
  setInterval(applyThemeByTime, 60*1000)
})

function validate(){
  if(!name.value.trim()) return '请输入昵称'
  if(!identifier.value.trim()) return '请输入手机号或邮箱'
  // enforce backend password rule: must contain uppercase, lowercase, number, min len 8
  const pw = password.value || ''
  const ok = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}/.test(pw)
  if(!ok) return '密码需包含大小写字母和数字，且长度至少为8位'
  return null
}

async function submit(){
  const err = validate()
  if(err) return uni.showToast({ title: err, icon: 'none' })
  loading.value = true
  try{
    const api = await import('@/api/auth')
    await api.register({ username: name.value, email: identifier.value, password: password.value })
    uni.showToast({ title: '注册成功，请检查邮箱验证（如已启用）', icon: 'success' })
    uni.reLaunch({ url: '/pages/home/index' })
  }catch(e){
    uni.showToast({ title: e.message || '注册失败', icon: 'none' })
  }finally{ loading.value = false }
}

function goLogin(){ 
  uni.navigateTo({ url:'/pages/auth/Login' })
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
  color: var(--muted);
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
  color: var(--muted); /* 提高可见性 */
}

.eye{ background:transparent; border:none; margin-left:8px; font-size:18px }
.password-hint{ color:var(--muted); font-size:12px; margin-bottom:12px }
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