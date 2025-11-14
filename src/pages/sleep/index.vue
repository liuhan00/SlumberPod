<template>
  <view class="page">
    <!-- 夜空背景 -->
    <view class="night-sky">
      <!-- 月亮 -->
      <view class="moon"></view>
      
      <!-- 星星 -->
      <view class="star star-1"></view>
      <view class="star star-2"></view>
      <view class="star star-3"></view>
      <view class="star star-4"></view>
      <view class="star star-5"></view>
      <view class="star star-6"></view>
      <view class="star star-7"></view>
      <view class="star star-8"></view>
      <view class="star star-9"></view>
      <view class="star star-10"></view>
      <view class="star star-11"></view>
      <view class="star star-12"></view>
    </view>
    
    <!-- 地面背景 -->
    <view class="ground-bg">
      <!-- 背景几何树/山 - 深色剪影风格 -->
      <view class="bg-tree bg-tree-1"></view>
      <view class="bg-tree bg-tree-2"></view>
      <view class="bg-tree bg-tree-3"></view>
      <view class="bg-tree bg-tree-4"></view>
      <view class="bg-tree bg-tree-5"></view>
      <view class="bg-tree bg-tree-6"></view>
      <view class="bg-tree bg-tree-7"></view>
      <view class="bg-tree bg-tree-8"></view>
      <view class="bg-tree bg-tree-9"></view>
      <view class="bg-tree bg-tree-10"></view>
      
      <!-- 散落的白色圆石 -->
      <view class="stone stone-1"></view>
      <view class="stone stone-2"></view>
      <view class="stone stone-3"></view>
      <view class="stone stone-4"></view>
      <view class="stone stone-5"></view>
      <view class="stone stone-6"></view>
      
      <!-- 蜿蜒小径 -->
      <view class="winding-path"></view>
      
      <!-- 小屋建筑 -->
      <view class="cabin">
        <!-- 主屋顶 -->
        <view class="main-roof">
          <view class="roof-tiles"></view>
        </view>
        
        <!-- 侧屋顶 -->
        <view class="side-roof side-roof-left"></view>
        <view class="side-roof side-roof-right"></view>
        
        <!-- 阁楼窗屋顶 -->
        <view class="dormer-roof-top"></view>
        
        <!-- 小屋主体 -->
        <view class="cabin-body">
          <!-- 浅色地基 -->
          <view class="foundation"></view>
          
          <!-- 半木结构框架 -->
          <view class="timber-frame timber-horizontal timber-1"></view>
          <view class="timber-frame timber-horizontal timber-2"></view>
          <view class="timber-frame timber-vertical timber-3"></view>
          <view class="timber-frame timber-vertical timber-4"></view>
          <view class="timber-frame timber-diagonal timber-5"></view>
          
          <!-- 阁楼窗 -->
          <view class="dormer-window">
            <view class="dormer-frame"></view>
          </view>
          
          <!-- 拱形门 -->
          <view class="arched-door">
            <view class="door-panels"></view>
          </view>
          
          <!-- 壁灯 - 带发光效果 -->
          <view class="wall-lamp lamp-left">
            <view class="lamp-glow"></view>
          </view>
          <view class="wall-lamp lamp-right">
            <view class="lamp-glow"></view>
          </view>
          
          <!-- 窗户灯光 -->
          <view class="window-light window-left"></view>
          <view class="window-light window-right"></view>
        </view>
        
        <!-- 门前小径 -->
        <view class="door-path"></view>
        
        <!-- 户外用餐区 -->
        <view class="outdoor-area">
          <!-- 木桌 -->
          <view class="wooden-table">
            <view class="table-top"></view>
            <view class="table-leg leg-1"></view>
            <view class="table-leg leg-2"></view>
            <view class="table-leg leg-3"></view>
            <view class="table-leg leg-4"></view>
            <!-- 桌上的物品 -->
            <view class="table-item item-1"></view>
            <view class="table-item item-2"></view>
            <view class="table-item item-3"></view>
          </view>
          
          <!-- 凳子 -->
          <view class="stool stool-1">
            <view class="stool-top"></view>
            <view class="stool-leg"></view>
          </view>
          <view class="stool stool-2">
            <view class="stool-top"></view>
            <view class="stool-leg"></view>
          </view>
          
          <!-- 长凳 -->
          <view class="bench">
            <view class="bench-seat"></view>
            <view class="bench-leg leg-left"></view>
            <view class="bench-leg leg-right"></view>
          </view>
          
          <!-- 木箱 -->
          <view class="crate crate-1">
            <view class="crate-top"></view>
            <view class="crate-side"></view>
          </view>
          <view class="crate crate-2">
            <view class="crate-top"></view>
            <view class="crate-side"></view>
          </view>
          <view class="crate crate-3">
            <view class="crate-top"></view>
            <view class="crate-side"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部小圆圈按钮 -->
    <view class="bottom-options">
      <view class="circle-btn sleep" @click="goSleepScene">
        <text class="btn-icon">🌙</text>
        <text class="btn-label">睡觉</text>
      </view>
      <view class="circle-btn study" @click="goStudy">
        <text class="btn-icon">📚</text>
        <text class="btn-label">自习室</text>
      </view>
    </view>
    </view>
</template>
<script setup>
import { computed } from 'vue'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore(); themeStore.load()
const { hour, theme, bgStyle } = useGlobalTheme()

const cardStyle = computed(()=> ({ background: 'var(--card-bg)', color:'var(--card-fg)' }))

const greet = computed(()=>{
  const h = hour.value
  if(h>=5 && h<10) return '早上好'
  if(h>=10 && h<17) return '下午好'
  if(h>=17 && h<21) return '晚上好'
  return '晚安'
})

function goStudy(){ uni.navigateTo({ url:'/pages/sleep/Study' }) }
function goSleepScene(){ uni.navigateTo({ url:'/pages/sleep/SleepScene' }) }
function goNap(){ uni.navigateTo({ url:'/pages/sleep/Nap' }) }
function goAlarm(){ uni.navigateTo({ url:'/pages/sleep/Alarm' }) }
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
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1a1a2e 0%, #2d2d44 30%, #3d3d5c 60%, #4a4a6a 100%);
  background-image: none !important;
}

/* 夜空背景 */
.night-sky {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  z-index: 0;
  overflow: hidden;
}

/* 月亮 */
.moon {
  position: absolute;
  top: 15%;
  right: 15%;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFF4CC 100%);
  border-radius: 50%;
  box-shadow: 0 0 30px rgba(255, 249, 230, 0.6),
              0 0 60px rgba(255, 249, 230, 0.3);
  z-index: 1;
  animation: moonGlow 3s ease-in-out infinite;
}

@keyframes moonGlow {
  0%, 100% { 
    box-shadow: 0 0 30px rgba(255, 249, 230, 0.6),
                0 0 60px rgba(255, 249, 230, 0.3);
  }
  50% { 
    box-shadow: 0 0 40px rgba(255, 249, 230, 0.8),
                0 0 80px rgba(255, 249, 230, 0.5);
  }
}

/* 星星 */
.star {
  position: absolute;
  background: #FFFFFF;
  border-radius: 50%;
  animation: twinkle 2s ease-in-out infinite;
}

.star::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 2px;
  background: #FFFFFF;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
}

.star-1 { top: 20%; left: 10%; width: 3px; height: 3px; animation-delay: 0s; }
.star-2 { top: 15%; left: 25%; width: 2px; height: 2px; animation-delay: 0.3s; }
.star-3 { top: 25%; left: 40%; width: 4px; height: 4px; animation-delay: 0.6s; }
.star-4 { top: 18%; left: 55%; width: 2px; height: 2px; animation-delay: 0.9s; }
.star-5 { top: 22%; left: 70%; width: 3px; height: 3px; animation-delay: 1.2s; }
.star-6 { top: 30%; left: 20%; width: 2px; height: 2px; animation-delay: 0.2s; }
.star-7 { top: 28%; left: 60%; width: 3px; height: 3px; animation-delay: 0.5s; }
.star-8 { top: 35%; left: 35%; width: 2px; height: 2px; animation-delay: 0.8s; }
.star-9 { top: 32%; left: 75%; width: 3px; height: 3px; animation-delay: 1.1s; }
.star-10 { top: 40%; left: 15%; width: 2px; height: 2px; animation-delay: 0.4s; }
.star-11 { top: 38%; left: 50%; width: 3px; height: 3px; animation-delay: 0.7s; }
.star-12 { top: 42%; left: 80%; width: 2px; height: 2px; animation-delay: 1s; }

@keyframes twinkle {
  0%, 100% { 
    opacity: 0.6;
    transform: scale(1);
  }
  50% { 
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 深色地面背景 - 夜晚的草地 */
.ground-bg {
  position: absolute;
  top: 40%;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 60vh;
  background: linear-gradient(180deg, #2d3a2d 0%, #1a2a1a 100%);
  background-image: 
    radial-gradient(circle at 20% 60%, rgba(45, 58, 45, 0.8) 0%, transparent 50%),
    radial-gradient(circle at 70% 50%, rgba(26, 42, 26, 0.6) 0%, transparent 50%),
    radial-gradient(circle at 40% 70%, rgba(35, 50, 35, 0.7) 0%, transparent 50%);
  padding-bottom: calc(120px + env(safe-area-inset-bottom));
  overflow: visible;
  z-index: 2;
}

/* 背景几何树/山 - 深色剪影风格 */
.bg-tree {
  position: absolute;
  background: #1a2a1a;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  opacity: 0.8;
}

.bg-tree-1 {
  bottom: 52%;
  left: 5%;
  width: 60px;
  height: 80px;
  background: #0f1a0f;
  border-radius: 10px 10px 5px 5px;
}

.bg-tree-2 {
  bottom: 57%;
  left: 12%;
  width: 45px;
  height: 65px;
  background: #1a2a1a;
  border-radius: 8px;
}

.bg-tree-3 {
  bottom: 55%;
  left: 20%;
  width: 70px;
  height: 90px;
  background: #0d150d;
  border-radius: 12px 12px 6px 6px;
}

.bg-tree-4 {
  bottom: 59%;
  left: 30%;
  width: 50px;
  height: 70px;
  background: #1a2a1a;
  border-radius: 9px;
}

.bg-tree-5 {
  bottom: 53%;
  left: 40%;
  width: 65px;
  height: 85px;
  background: #0f1a0f;
  border-radius: 11px 11px 5px 5px;
}

.bg-tree-6 {
  bottom: 56%;
  right: 35%;
  width: 55px;
  height: 75px;
  background: #1a2a1a;
  border-radius: 10px;
}

.bg-tree-7 {
  bottom: 58%;
  right: 25%;
  width: 48px;
  height: 68px;
  background: #0d150d;
  border-radius: 8px;
}

.bg-tree-8 {
  bottom: 54%;
  right: 15%;
  width: 62px;
  height: 82px;
  background: #0f1a0f;
  border-radius: 12px 12px 6px 6px;
}

.bg-tree-9 {
  bottom: 60%;
  right: 8%;
  width: 42px;
  height: 60px;
  background: #1a2a1a;
  border-radius: 9px;
}

.bg-tree-10 {
  bottom: 52%;
  right: 2%;
  width: 58px;
  height: 78px;
  background: #0d150d;
  border-radius: 10px;
}

/* 散落的白色圆石 - 在月光下发光 */
.stone {
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(255, 255, 255, 0.3),
              0 0 8px rgba(255, 255, 255, 0.2);
}

.stone-1 {
  bottom: 49%;
  left: 8%;
  width: 12px;
  height: 12px;
}

.stone-2 {
  bottom: 51%;
  left: 15%;
  width: 10px;
  height: 10px;
}

.stone-3 {
  bottom: 47%;
  left: 35%;
  width: 14px;
  height: 14px;
}

.stone-4 {
  bottom: 50%;
  left: 50%;
  width: 11px;
  height: 11px;
}

.stone-5 {
  bottom: 48%;
  right: 30%;
  width: 13px;
  height: 13px;
}

.stone-6 {
  bottom: 52%;
  right: 12%;
  width: 9px;
  height: 9px;
}

/* 蜿蜒小径 - 月光下的石板路 */
.winding-path {
  position: absolute;
  bottom: 47%;
  left: 0;
  right: 0;
  height: 25px;
  background: rgba(200, 200, 200, 0.4);
  border-radius: 12px;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
  clip-path: polygon(
    0% 100%,
    5% 80%,
    15% 85%,
    25% 75%,
    35% 80%,
    45% 70%,
    55% 75%,
    65% 70%,
    75% 75%,
    85% 72%,
    95% 78%,
    100% 75%,
    100% 100%
  );
}

/* 小屋建筑 */
.cabin {
  position: absolute;
  bottom: 60%;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 280px;
  z-index: 10;
}

/* 主屋顶 - 陶土橙/棕色瓦片 */
.main-roof {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 140px solid transparent;
  border-right: 140px solid transparent;
  border-bottom: 100px solid #CD853F;
  z-index: 15;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
}

.roof-tiles {
  position: absolute;
  top: -100px;
  left: -140px;
  width: 280px;
  height: 100px;
  background: repeating-linear-gradient(
    90deg,
    #CD853F 0px,
    #CD853F 18px,
    #D2691E 18px,
    #D2691E 20px
  );
  clip-path: polygon(0 100%, 50% 0, 100% 100%);
}

/* 侧屋顶 */
.side-roof {
  position: absolute;
  width: 0;
  height: 0;
  border-bottom: 60px solid #CD853F;
  z-index: 14;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.15));
}

.side-roof-left {
  top: 20px;
  left: -50px;
  border-left: 50px solid transparent;
  border-right: 0;
}

.side-roof-right {
  top: 20px;
  right: -50px;
  border-left: 0;
  border-right: 50px solid transparent;
}

/* 阁楼窗屋顶 */
.dormer-roof-top {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 25px solid transparent;
  border-right: 25px solid transparent;
  border-bottom: 20px solid #D2691E;
  z-index: 16;
}

/* 小屋主体 - 温暖的米白色墙壁 */
.cabin-body {
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  width: 260px;
  height: 180px;
  background: linear-gradient(135deg, #FFF8E7 0%, #FFF5E1 100%);
  z-index: 12;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3),
              0 0 30px rgba(255, 249, 230, 0.2);
}

/* 浅色地基 */
.foundation {
  position: absolute;
  bottom: -20px;
  left: -10px;
  right: -10px;
  height: 20px;
  background: #F5F5DC;
  z-index: 11;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 半木结构框架 */
.timber-frame {
  position: absolute;
  background: #8B4513;
  z-index: 13;
}

.timber-horizontal {
  height: 8px;
  left: 0;
  right: 0;
}

.timber-1 {
  top: 30px;
}

.timber-2 {
  top: 120px;
}

.timber-vertical {
  width: 8px;
  top: 0;
  bottom: 0;
}

.timber-3 {
  left: 60px;
}

.timber-4 {
  right: 60px;
}

.timber-diagonal {
  width: 8px;
  height: 100px;
  top: 40px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  transform-origin: center;
}

/* 阁楼窗 */
.dormer-window {
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 17;
}

.dormer-frame {
  width: 35px;
  height: 30px;
  background: #FFFFFF;
  border: 3px solid #8B4513;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* 拱形门 */
.arched-door {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 90px;
  z-index: 14;
}

.door-panels {
  width: 100%;
  height: 100%;
  background: #8B4513;
  border: 3px solid #654321;
  border-radius: 25px 25px 0 0;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.door-panels::before {
  content: '';
  position: absolute;
  top: 15px;
  left: 8px;
  right: 8px;
  bottom: 15px;
  border: 2px solid #654321;
  border-radius: 20px 20px 0 0;
}

/* 壁灯 - 带温暖灯光 */
.wall-lamp {
  position: absolute;
  top: 80px;
  width: 20px;
  height: 25px;
  background: #FFF9E6;
  border: 2px solid #8B6F47;
  border-radius: 4px 4px 0 0;
  z-index: 15;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.lamp-glow {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, rgba(255, 249, 230, 0.8) 0%, transparent 70%);
  border-radius: 50%;
  animation: lampFlicker 2s ease-in-out infinite;
  z-index: -1;
}

@keyframes lampFlicker {
  0%, 100% { 
    opacity: 0.8;
    transform: translateX(-50%) scale(1);
  }
  50% { 
    opacity: 1;
    transform: translateX(-50%) scale(1.1);
  }
}

.lamp-left {
  left: 20px;
}

.lamp-right {
  right: 20px;
}

/* 窗户灯光 */
.window-light {
  position: absolute;
  top: 100px;
  width: 35px;
  height: 40px;
  background: rgba(255, 249, 200, 0.6);
  border: 2px solid #8B6F47;
  border-radius: 4px;
  z-index: 16;
  box-shadow: 0 0 15px rgba(255, 249, 200, 0.8),
              inset 0 0 10px rgba(255, 249, 200, 0.5);
  animation: windowGlow 3s ease-in-out infinite;
}

@keyframes windowGlow {
  0%, 100% { 
    box-shadow: 0 0 15px rgba(255, 249, 200, 0.8),
                inset 0 0 10px rgba(255, 249, 200, 0.5);
  }
  50% { 
    box-shadow: 0 0 20px rgba(255, 249, 200, 1),
                inset 0 0 15px rgba(255, 249, 200, 0.7);
  }
}

.window-left {
  left: 30px;
}

.window-right {
  right: 30px;
}

/* 门前小径 - 月光下的石板 */
.door-path {
  position: absolute;
  bottom: -42px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 30px;
  background: rgba(220, 220, 220, 0.5);
  border-radius: 0 0 30px 30px;
  z-index: 9;
  box-shadow: 0 2px 6px rgba(255, 255, 255, 0.2);
}

/* 户外用餐区 */
.outdoor-area {
  position: absolute;
  bottom: -77px;
  right: -80px;
  z-index: 8;
}

/* 木桌 */
.wooden-table {
  position: relative;
  width: 80px;
  height: 50px;
}

.table-top {
  width: 100%;
  height: 8px;
  background: #8B4513;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.table-leg {
  position: absolute;
  width: 4px;
  height: 42px;
  background: #654321;
  bottom: 0;
}

.leg-1 { left: 8px; }
.leg-2 { right: 8px; }
.leg-3 { left: 8px; top: 8px; }
.leg-4 { right: 8px; top: 8px; }

.table-item {
  position: absolute;
  width: 8px;
  height: 12px;
  background: #D2691E;
  border-radius: 2px;
  top: -10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.item-1 { left: 20px; }
.item-2 { left: 36px; }
.item-3 { left: 52px; }

/* 凳子 */
.stool {
  position: absolute;
  width: 20px;
  height: 25px;
}

.stool-1 {
  bottom: 50px;
  left: 10px;
}

.stool-2 {
  bottom: 50px;
  right: 10px;
}

.stool-top {
  width: 100%;
  height: 4px;
  background: #8B4513;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.stool-leg {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 3px;
  height: 21px;
  background: #654321;
}

/* 长凳 */
.bench {
  position: absolute;
  bottom: 50px;
  left: -30px;
  width: 50px;
  height: 20px;
}

.bench-seat {
  width: 100%;
  height: 5px;
  background: #8B4513;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.bench-leg {
  position: absolute;
  bottom: 0;
  width: 3px;
  height: 15px;
  background: #654321;
}

.leg-left {
  left: 8px;
}

.leg-right {
  right: 8px;
}

/* 木箱 */
.crate {
  position: absolute;
  width: 30px;
  height: 25px;
}

.crate-1 {
  bottom: 0;
  left: -50px;
}

.crate-2 {
  bottom: 25px;
  left: -50px;
}

.crate-3 {
  bottom: 0;
  left: -20px;
}

.crate-top {
  width: 100%;
  height: 5px;
  background: #8B4513;
  border: 2px solid #654321;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.crate-side {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: #A0522D;
  border: 2px solid #654321;
  border-top: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

/* 底部小圆圈按钮 - 在 tabBar 上方 */
.bottom-options {
  position: fixed; /* 使用 fixed 定位，相对于视口 */
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100; /* 确保在 tabBar 上方 */
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 20px 16px;
  padding-bottom: calc(40px + env(safe-area-inset-bottom)); /* 为 tabBar 留出空间 */
  background: transparent; /* 移除白色背景，让岛屿显示出来 */
  pointer-events: none; /* 让点击事件穿透到 tabBar */
}

.bottom-options .circle-btn {
  pointer-events: auto; /* 按钮本身可点击 */
}

.circle-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.circle-btn::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.circle-btn:active::before {
  opacity: 1;
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
  font-size: 32px;
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
  .cabin {
    width: 240px;
    height: 220px;
  }
  
  .main-roof {
    border-left-width: 110px;
    border-right-width: 110px;
    border-bottom-width: 80px;
  }
  
  .roof-tiles {
    width: 220px;
    height: 80px;
    top: -80px;
    left: -110px;
  }
  
  .cabin-body {
    width: 200px;
    height: 140px;
    top: 80px;
  }
  
  .side-roof-left {
    left: -40px;
    border-left-width: 40px;
    border-bottom-width: 50px;
  }
  
  .side-roof-right {
    right: -40px;
    border-right-width: 40px;
    border-bottom-width: 50px;
  }
  
  .dormer-frame {
    width: 28px;
    height: 24px;
  }
  
  .arched-door {
    width: 40px;
    height: 70px;
  }
  
  .bg-tree {
    transform: scale(0.8);
  }
  
  .stone {
    transform: scale(0.8);
  }
  
  .outdoor-area {
    transform: scale(0.8);
  }
  
  .circle-btn {
    width: 70px;
    height: 70px;
  }
  
  .btn-icon {
    font-size: 28px;
  }
  
  .btn-label {
    font-size: 11px;
  }
}

.page { min-height:100vh }
.section { padding: 12px 16px }
.hero{ height:180px; padding: 12px 16px; color: var(--fg); border-bottom-left-radius: 24px; border-bottom-right-radius: 24px }
.greet{ font-size:26px; font-weight:700 }
.sub{ margin-top:6px; color: var(--muted) }
.card{ background: var(--card-bg); color: var(--card-fg); border-radius:12px; padding:12px; box-shadow:0 1px 4px var(--shadow) }
.title{ font-size:16px; font-weight:600 }
.desc{ margin-top:4px; color: var(--muted) }
.actions{ display:flex; justify-content:space-around; align-items:center; padding: 0 16px }
.circle{ width:88px; height:88px; border-radius:50%; background: var(--input-bg); display:flex; align-items:center; justify-content:center; color: var(--fg) }
</style>
