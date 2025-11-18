<template>
  <view class="page">
    <!-- 背景图片 -->
    <image 
      class="bg-image" 
      src="/static/cabin.png" 
      mode="aspectFill"
      @error="handleImageError"
      @load="handleImageLoad"
    ></image>

    <!-- 闪光效果 -->
    <view class="sparkle sparkle-1"></view>
    <view class="sparkle sparkle-2"></view>
    <view class="sparkle sparkle-3"></view>
    <view class="sparkle sparkle-4"></view>
    <view class="sparkle sparkle-5"></view>
    <view class="sparkle sparkle-6"></view>
    <view class="sparkle sparkle-7"></view>
    <view class="sparkle sparkle-8"></view>
    <view class="sparkle sparkle-9"></view>
    <view class="sparkle sparkle-10"></view>
    <view class="sparkle sparkle-11"></view>
    <view class="sparkle sparkle-12"></view>

    <!-- 底部按钮 -->
    <view class="bottom-options">
      <view class="circle-btn sleep" @click="goSleepScene">
        <text class="btn-icon">🌙</text>
        <text class="btn-label">睡觉</text>
      </view>
      <view class="circle-btn study" @click="goStudy">
        <text class="btn-icon">📚</text>
        <text class="btn-label">学习</text>
      </view>
    </view>
  </view>
</template>

<script setup>
function goStudy(){ uni.navigateTo({ url:'/pages/sleep/Study' }) }
function goSleepScene(){ uni.navigateTo({ url:'/pages/sleep/SleepScene' }) }

function handleImageError(e) {
  console.error('图片加载失败:', e)
  uni.showToast({
    title: '图片加载失败',
    icon: 'none',
    duration: 2000
  })
}

function handleImageLoad(e) {
  console.log('图片加载成功:', e)
}
</script>

<style scoped>
.page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* 背景图片 */
.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  object-fit: cover;
  animation: breathe 4s ease-in-out infinite;
}

/* 放大缩小动画 */
@keyframes breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}

/* 闪光效果 */
.sparkle {
  position: absolute;
  z-index: 10;
  width: 4px;
  height: 4px;
  pointer-events: none;
}

.sparkle::before,
.sparkle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%);
  border-radius: 50%;
  animation: twinkle 2.5s ease-in-out infinite;
}

.sparkle::before {
  width: 4px;
  height: 4px;
  box-shadow: 0 0 3px rgba(255, 255, 255, 0.8),
              0 0 6px rgba(255, 255, 255, 0.5),
              0 0 9px rgba(255, 255, 255, 0.3);
}

.sparkle::after {
  width: 6px;
  height: 6px;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.6),
              0 0 8px rgba(255, 255, 255, 0.4);
}

/* 闪烁动画 */
@keyframes twinkle {
  0%, 100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.8);
  }
}

/* 闪光点位置分布 */
.sparkle-1 {
  top: 15%;
  left: 20%;
}

.sparkle-1::before {
  animation-delay: 0s;
}

.sparkle-1::after {
  animation-delay: 0.5s;
}

.sparkle-2 {
  top: 25%;
  left: 75%;
}

.sparkle-2::before {
  animation-delay: 0.3s;
}

.sparkle-2::after {
  animation-delay: 0.8s;
}

.sparkle-3 {
  top: 35%;
  left: 45%;
}

.sparkle-3::before {
  animation-delay: 0.6s;
}

.sparkle-3::after {
  animation-delay: 1.1s;
}

.sparkle-4 {
  top: 50%;
  left: 15%;
}

.sparkle-4::before {
  animation-delay: 0.9s;
}

.sparkle-4::after {
  animation-delay: 1.4s;
}

.sparkle-5 {
  top: 60%;
  left: 80%;
}

.sparkle-5::before {
  animation-delay: 1.2s;
}

.sparkle-5::after {
  animation-delay: 1.7s;
}

.sparkle-6 {
  top: 20%;
  left: 60%;
}

.sparkle-6::before {
  animation-delay: 1.5s;
}

.sparkle-6::after {
  animation-delay: 2s;
}

.sparkle-7 {
  top: 40%;
  left: 30%;
}

.sparkle-7::before {
  animation-delay: 0.2s;
}

.sparkle-7::after {
  animation-delay: 0.7s;
}

.sparkle-8 {
  top: 55%;
  left: 65%;
}

.sparkle-8::before {
  animation-delay: 0.8s;
}

.sparkle-8::after {
  animation-delay: 1.3s;
}

.sparkle-9 {
  top: 30%;
  left: 10%;
}

.sparkle-9::before {
  animation-delay: 1.1s;
}

.sparkle-9::after {
  animation-delay: 1.6s;
}

.sparkle-10 {
  top: 45%;
  left: 90%;
}

.sparkle-10::before {
  animation-delay: 0.4s;
}

.sparkle-10::after {
  animation-delay: 0.9s;
}

.sparkle-11 {
  top: 70%;
  left: 50%;
}

.sparkle-11::before {
  animation-delay: 1.3s;
}

.sparkle-11::after {
  animation-delay: 1.8s;
}

.sparkle-12 {
  top: 10%;
  left: 40%;
}

.sparkle-12::before {
  animation-delay: 0.7s;
}

.sparkle-12::after {
  animation-delay: 1.2s;
}

/* 底部按钮 */
.bottom-options {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 20px 16px;
  padding-bottom: calc(40px + env(safe-area-inset-bottom));
  background: transparent;
  pointer-events: none;
}

.bottom-options .circle-btn {
  pointer-events: auto;
}

.circle-btn {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.circle-btn:active {
  transform: scale(0.95);
}

.circle-btn.sleep {
  background: linear-gradient(135deg, #FFB347 0%, #FF8C42 100%);
  box-shadow: 0 4px 20px rgba(255, 179, 71, 0.5),
              0 0 30px rgba(255, 179, 71, 0.3),
              inset 0 2px 10px rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.circle-btn.study {
  background: linear-gradient(135deg, #D4A574 0%, #C19A6B 100%);
  box-shadow: 0 4px 20px rgba(212, 165, 116, 0.5),
              0 0 30px rgba(212, 165, 116, 0.3),
              inset 0 2px 10px rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.btn-icon {
  font-size: 36px;
  line-height: 1;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
}

.btn-label {
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

/* 响应式调整 */
@media (max-width: 750px) {
  .circle-btn {
    width: 84px;
    height: 84px;
  }
  
  .btn-icon {
    font-size: 32px;
  }
  
  .btn-label {
    font-size: 11px;
  }
}
</style>