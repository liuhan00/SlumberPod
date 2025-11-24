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

    <!-- 环境动画 -->
    <view class="ambient-layer">
      <view class="leaf" :class="{ play: animationStarted }"></view>
      <view class="firefly-cluster" :class="{ play: animationStarted }">
        <view
          v-for="config in fireflyConfigs"
          :key="config.delay"
          class="firefly"
          :style="{ '--delay': config.delay + 'ms', '--move-x': config.x + 'px', '--move-y': config.y + 'px' }"
        ></view>
      </view>
    </view>

    <!-- 场景交互按钮（仅包含睡觉按钮，学习按钮已移至根节点，避免被父容器动画影响） -->
    <view class="scene-buttons" :class="{ 'play-animation': animationStarted }">
      <view class="sleep-button interactive-button" @click="goSleepScene">
        <view class="pillow-shell">
          <view class="pillow-stitch pillow-stitch-top"></view>
          <view class="pillow-stitch pillow-stitch-bottom"></view>
          <view class="pillow-emblem">
            <text class="icon-text">🌙</text>
          </view>
        </view>
        <text class="button-label">睡觉</text>
      </view>
    </view>

    <!-- 学习按钮放在根级，避免被 .scene-buttons 的动画/transform/overflow 影响 -->
    <view class="study-button interactive-button" @click="goStudy">
      <!-- 使用静态图片作为学习按钮（位于 src/static/book.png） -->
      <image class="study-img" src="/static/book.png" mode="aspectFit" aria-hidden="true" />
      <text class="study-label">学习</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const animationStarted = ref(false)
const fireflyConfigs = [
  { delay: 0, x: -72, y: 12 },
  { delay: 120, x: -44, y: -28 },
  { delay: 240, x: -18, y: 32 },
  { delay: 360, x: -64, y: 48 },
  { delay: 480, x: -26, y: -42 },
  { delay: 600, x: -52, y: 18 }
]

onMounted(() => {
  nextTick(() => {
    animationStarted.value = true
  })
})

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

@keyframes leafGlide {
  0% {
    opacity: 0;
    transform: translate(-18vw, -46vh) rotate(-28deg) scale(0.55);
  }
  40% {
    opacity: 1;
    transform: translate(-26vw, 12vh) rotate(-10deg) scale(0.9);
  }
  70% {
    transform: translate(-32vw, 44vh) rotate(8deg) scale(1.05);
  }
  100% {
    opacity: 0;
    transform: translate(-34vw, 58vh) rotate(2deg) scale(0.95);
  }
}

/* 禁用点击高亮（去除点击时的蓝色闪烁） */
/* '*' 选择器在 WXSS 中不被支持，改为直接作用于按钮本身 */
.scene-buttons .interactive-button {
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}

.scene-buttons .interactive-button:active {
  transform: translateY(8px) scale(0.99); /* 只保留轻微下沉，不改颜色 */
  background: transparent !important;
}

/* 有些平台会在按下时给元素背景色，统一覆盖 */
.scene-buttons .interactive-button,
.scene-buttons .interactive-button:active {
  background-color: transparent !important;
}

@keyframes fireflySwarm {
  0% {
    opacity: 0;
    transform: translate(22vw, -32vh) scale(0.45) rotate(-6deg);
  }
  40% {
    opacity: 1;
    transform: translate(-10vw, 8vh) scale(0.8) rotate(2deg);
  }
  70% {
    transform: translate(-16vw, 42vh) scale(0.95) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translate(-18vw, 58vh) scale(0.9) rotate(0deg);
  }
}

@keyframes fireflyGather {
  0% {
    opacity: 0;
    transform: translate3d(calc(var(--move-x) * 1.1), calc(var(--move-y) * 1.1), 0) scale(0.5);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(0.1);
  }
}

@keyframes fireflyTwinkle {
  0%, 100% {
    box-shadow: 0 0 6px rgba(255, 233, 135, 0.6), 0 0 16px rgba(255, 180, 0, 0.3);
    opacity: 0.5;
  }
  50% {
    box-shadow: 0 0 14px rgba(255, 233, 135, 1), 0 0 26px rgba(255, 180, 0, 0.6);
    opacity: 1;
  }
}

@keyframes pillowReveal {
  0% {
    opacity: 0;
    transform: translate(-28px, 46px) scale(0.55) rotate(-8deg);
    filter: blur(4px);
  }
  45% {
    opacity: 1;
    transform: translate(4px, -12px) scale(1.08) rotate(-2deg);
    filter: blur(0);
  }
  70% {
    transform: translate(-2px, 8px) scale(0.96) rotate(3deg);
  }
  100% {
    opacity: 1;
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
}

@keyframes pillowGlow {
  0% {
    opacity: 0.65;
    transform: scale(0.7);
  }
  40% {
    opacity: 0.9;
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}

@keyframes bookReveal {
  /* 不改变元素定位（避免从页面顶部错位），只做缩放/旋转/模糊过渡 */
  0% {
    opacity: 0;
    transform: scale(0.6) rotate(-8deg);
    filter: blur(3px);
  }
  40% {
    opacity: 1;
    transform: scale(1.06) rotate(6deg);
    filter: blur(0);
  }
  70% {
    transform: scale(0.99) rotate(-2deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes bookGleam {
  0% {
    opacity: 0;
    transform: translateX(-60%) skewX(-12deg);
  }
  45% {
    opacity: 0.85;
  }
  100% {
    opacity: 0;
    transform: translateX(120%) skewX(-12deg);
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

/* 场景按钮布局 */
.scene-buttons {
  position: absolute;
  inset: 0;
  z-index: 120;
  pointer-events: none;
}

.scene-buttons .interactive-button {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: auto;
  cursor: pointer;
  opacity: 0;
  transform: translateY(18px) scale(0.82);
  transition: transform 0.3s ease, filter 0.3s ease;
  will-change: transform, opacity, filter;
}

.scene-buttons .interactive-button:active {
  transform: translateY(8px) scale(0.9);
}

.scene-buttons.play-animation .sleep-button {
  animation: pillowReveal 1.3s cubic-bezier(0.22, 1.2, 0.36, 1) forwards;
  animation-delay: 0.8s;
}

.scene-buttons.play-animation .study-button {
  animation: bookReveal 1.4s cubic-bezier(0.23, 1, 0.34, 1) forwards;
  animation-delay: 1.2s;
}

.scene-buttons.play-animation .sleep-button .pillow-shell::after {
  animation: pillowGlow 2.4s ease-out 1s 2;
}

.scene-buttons.play-animation .study-button .book-cover::after {
  animation: bookGleam 2s ease-out 1.3s forwards;
}

.scene-buttons.play-animation .study-button .book-structure::after {
  opacity: 0.35;
  transition: opacity 0.4s ease 1.2s;
}

.sleep-button {
  /* 更大幅度向右且略向上，确保落在床面而非床脚 */
  position: absolute !important;
  left: 68vw; /* 明显向右 */
  top: 56vh; /* 向上，落在床面 */
  width: clamp(100px, 18vw, 140px);
  height: auto;
  transform: translate(-50%, -50%);
  z-index: 1200;
}

.sleep-button .button-label {
  /* 字体保持不变 */
  font-size: clamp(16px, 2.2vw, 18px);
  font-weight: 700;
  color: rgba(255, 245, 220, 0.98);
  text-shadow: 0 2px 8px rgba(0,0,0,0.6);
  letter-spacing: 1.6px;
}

.sleep-button .pillow-shell {
  /* 更强调抱枕形状，放置在床上 */
  border-radius: 48% 48% 44% 44% / 60% 60% 50% 50%;
  padding: 12% 10%;
  background: linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04));
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 18px 36px rgba(0,0,0,0.22), inset 0 6px 12px rgba(255,255,255,0.06);
  transform: translateY(6px) rotate(-4deg) perspective(100px);
}

.study-button {
  /* 固定到视口并放置到左上（书桌位置） */
  position: fixed !important;
  left: 14vw !important; /* 放到大画框左侧 */
  top: -26vh !important; /* 再上移两个书的高度（相对上次再上移约 -10vh，总计 -26vh） */
  width: 110px !important;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 1 !important;
  pointer-events: auto;
  z-index: 2147483000 !important;
  overflow: visible !important;
  transform: none !important;
}

/* 确保图片可见且没有背景 */
.study-img { width: 110px; height: 86px; object-fit: cover; border-radius: 6px; box-shadow: none; opacity: 0.78; backdrop-filter: blur(2px) saturate(0.9); mix-blend-mode: normal; }

/* 移除旧的 book-structure 影响 */
.book-structure { display: none !important; }

.study-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 96px;
  font-size: 30px;
  line-height: 1;
  background: linear-gradient(180deg,#fffaf0,#fff1d8);
  color: #6b4a2a;
  border: 1px solid rgba(107,74,42,0.18);
  padding: 6px 8px;
  border-radius: 12px;
  box-shadow: 0 18px 42px rgba(0,0,0,0.30);
  z-index: 11000;
  overflow: visible; /* 允许 svg 溢出以显示书脊阴影 */
}

/* 强制 svg 具有明显描边和透明背景 */
.study-icon svg { display: block !important; width: 96px; height: auto; background: transparent; }
.study-icon svg path, .study-icon svg rect, .study-icon svg polygon { stroke: rgba(59,53,45,0.9); stroke-width: 0.9; }


.study-label {
  position: absolute;
  left: calc(110px - 28px); /* 更靠近书按钮 */
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-rl; /* 竖排文字 */
  text-orientation: mixed;
  font-size: 16px; /* 加大字体 */
  font-weight: 700; /* 加粗 */
  color: rgba(255,250,230,1); /* 更亮 */
  text-shadow: 0 2px 6px rgba(0,0,0,0.45); /* 提升可读性 */
  pointer-events: none;
  letter-spacing: 1px;
  opacity: 0.98;
}

@media (max-width: 750px) {
  .sleep-button { left: 10vw; bottom: 10vh; width: clamp(90px, 28vw, 140px) }
  .study-button { right: 12vw; bottom: 46vh; width: clamp(100px, 36vw, 160px) }
}

.pillow-shell {
  position: relative;
  width: 100%;
  aspect-ratio: 1.3 / 0.9;
  border-radius: 40% 40% 35% 35% / 50% 50% 45% 45%;
  /* 半透明 + 模糊，跟随背景更柔和 */
  background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06));
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(6px) saturate(120%);
  box-shadow: 0 14px 30px rgba(0,0,0,0.18), inset 0 4px 8px rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16% 12%; /* 稍微减少内边距 */
  overflow: hidden;
  transform: perspective(100px) rotateX(3deg);
}

.pillow-shell::before {
  content: '';
  position: absolute;
  top: 15%;
  left: 10%;
  right: 10%;
  height: 20%;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.05) 70%);
  border-radius: 50% / 30%;
  filter: blur(2px);
  pointer-events: none;
}

.pillow-shell::after {
  content: '';
  position: absolute;
  top: 20%;
  left: 15%;
  right: 15%;
  height: 30%;
  background: radial-gradient(ellipse at center, rgba(255, 250, 235, 0.3), rgba(255, 214, 154, 0.05));
  border-radius: 50% / 25%;
  opacity: 0;
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.pillow-stitch {
  position: absolute;
  left: 10%;
  right: 10%;
  height: 3px;
  border-radius: 50%;
  background: linear-gradient(90deg, rgba(139, 69, 19, 0.3), rgba(139, 69, 19, 0.1) 50%, rgba(139, 69, 19, 0.3));
  opacity: 0.6;
  pointer-events: none;
  transform: scale(0.8);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.pillow-stitch-top {
  top: 40%;
}

.pillow-stitch-bottom {
  bottom: 40%;
}

.pillow-emblem {
  position: relative;
  width: 38%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 30%, rgba(255, 255, 255, 1), rgba(255, 200, 132, 0.7));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 5px 10px rgba(255, 255, 255, 0.5), inset 0 -7px 12px rgba(230, 141, 60, 0.6);
  z-index: 1;
}

.icon-text {
  font-size: clamp(24px, 3.4vw, 32px);
  line-height: 1;
}

.button-label {
  font-size: clamp(15px, 2vw, 18px);
  font-weight: 600;
  color: rgba(255, 238, 210, 0.9);
  text-shadow: 0 1px 4px rgba(111, 54, 9, 0.55);
  letter-spacing: 2px;
}

.book-structure {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4.4;
  overflow: visible;
  transform: translateZ(0);
  /* 制作翻开的书：两页并列，中间有褶皱和投影 */
}

/* 移除翻书的样式，改为仅使用 📖 图标作为学习按钮 */
.book-left,
.book-right,
.book-seam,
.book-cover,
.book-pages,
.book-spine,
.book-structure {
  display: none !important;
}

.study-icon {
  /* 书本样式：去掉纯白圆底，使用卡片式书本容器 */
  position: relative;
  width: 110px;
  height: 88px;
  padding: 8px 10px;
  background: linear-gradient(180deg, #fffaf0 0%, #fff1d8 100%);
  border-radius: 10px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(107,74,42,0.12);
}

/* 确保内联 SVG 可见并适配容器 */
.study-icon svg { width: 88px; height: 66px; display: block; }

/* 使用 📖 图标作为学习按钮标识，放在书中央上方 */
.book-structure .study-icon {
  position: absolute;
  top: 4%;
  left: 50%;
  transform: translateX(-50%);
  font-size: clamp(20px, 3.6vw, 28px);
  pointer-events: none;
  filter: drop-shadow(0 6px 10px rgba(0,0,0,0.24));
}

/* 中缝（书脊/折痕） */
.book-seam {
  position: absolute;
  left: 50%;
  top: 6%;
  bottom: 10%;
  width: 2%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, rgba(40,35,30,0.12), rgba(255,255,255,0.02));
  box-shadow: inset 0 0 6px rgba(0,0,0,0.12);
  border-radius: 2px;
}

/* 翻页纸边效果 */
.book-left::after,
.book-right::after {
  content: '';
  position: absolute;
  height: 100%;
  width: 12px;
  top: 0;
  background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(255,255,255,0));
}
.book-left::after { right: -12px; }
.book-right::after { left: -12px; }

/* 文字占位（可改为 img or inner content） */

/* 书封面保持淡色边 */
.book-cover {
  display: none; /* 不显示原来的封面，使用翻页样式 */
}

/* 小屏微调 */
@media (max-width: 750px) {
  .book-left, .book-right { top: 8%; bottom: 12% }
  .book-left { transform: perspective(500px) rotateY(10deg) translateX(-2%) }
  .book-right { transform: perspective(500px) rotateY(-10deg) translateX(2%) }
}

.book-spine {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 16%; /* 缩小书脊宽度，避免遮挡文字 */
  border-radius: 4px 0 0 4px;
  background: linear-gradient(90deg, #4a3228 0%, #6b4530 45%, #8b5a3c 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px; /* 减少内边距 */
  color: rgba(248, 232, 202, 1);
  text-shadow: 0 2px 4px rgba(35, 18, 5, 0.6);
  box-shadow: inset 2px 0 5px rgba(0, 0, 0, 0.3);
}

.book-spine-icon {
  display: none; /* 隐藏原书脊图标，改放到书封面内 */
}

.book-spine-text {
  display: none; /* 隐藏原书脊文字 */
}

/* 在书封面顶部显示“学习”文字（去掉图标） */
.book-cover::before { content: '' }

.book-cover::after {
  content: '学习';
  position: absolute;
  top: 14%; /* 放在书的上方 */
  left: 50%;
  transform: translate(-50%, 0%);
  font-size: clamp(14px, 2vw, 16px);
  color: rgba(248, 232, 202, 0.98);
  text-shadow: 0 1px 2px rgba(0,0,0,0.45);
  pointer-events: none;
  font-weight: 600;
}
.book-cover {
  position: absolute;
  top: 8%;
  bottom: 10%;
  left: 20%;
  right: 8%;
  border-radius: 6px;
  /* 使用半透明卡片风格，自动适配背景色调 */
  background: linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06));
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(4px) saturate(110%);
  box-shadow: 0 10px 22px rgba(0,0,0,0.14), inset 0 6px 10px rgba(255,255,255,0.06);
  transform-origin: left center;
  transform: perspective(600px) rotateY(-2deg) scale(0.98);
}

.book-cover::after {
  content: '';
  position: absolute;
  inset: 12%;
  border-radius: 10px;
  background: linear-gradient(140deg, rgba(255, 247, 226, 0.12), rgba(255, 247, 226, 0));
  opacity: 0;
  transition: opacity 0.4s ease;
}
.book-cover::after {
  content: '';
  position: absolute;
  inset: 12%;
  border-radius: 10px;
  background: linear-gradient(140deg, rgba(255, 247, 226, 0.35), rgba(255, 247, 226, 0));
  opacity: 0;
  transition: opacity 0.4s ease;
}

.book-pages {
  position: absolute;
  top: 10%;
  bottom: 12%;
  right: 0;
  width: 8%;
  border-radius: 0 6px 6px 0;
  background: linear-gradient(90deg, #fdf7e4 0%, #f7e6c6 50%, #f0d6a4 100%);
  box-shadow: inset -3px 0 5px rgba(140, 94, 44, 0.2), inset -1px 0 2px rgba(0, 0, 0, 0.1);
}

@media (hover: hover) {
  .scene-buttons .interactive-button:hover .pillow-shell {
    filter: brightness(1.06);
  }

  .scene-buttons .interactive-button:hover .pillow-shell::after {
    opacity: 0.55;
    transform: scale(1.08);
  }

  .scene-buttons .interactive-button:hover .book-cover {
    filter: brightness(1.08);
  }

  .scene-buttons .interactive-button:hover .book-cover::after {
    opacity: 0.55;
  }

  .scene-buttons .interactive-button:hover .book-structure::after {
    opacity: 0.4;
  }
}

.scene-buttons .interactive-button:active .pillow-shell,
.scene-buttons .interactive-button:active .book-cover {
  filter: brightness(1.08);
}

.scene-buttons .interactive-button:active .pillow-shell::after {
  opacity: 0.65;
  transform: scale(1.12);
}

.scene-buttons .interactive-button:active .book-cover::after {
  opacity: 0.6;
}

.scene-buttons .interactive-button:active .book-structure::after {
  opacity: 0.52;
}

@media (max-width: 750px) {
  .scene-buttons .interactive-button {
    gap: 6px;
  }

  .sleep-button {
    left: 16vw;
    bottom: 1vh;
    width: clamp(78px, 36vw, 120px);
  }

  .study-button {
    right: 6vw;
    bottom: 42vh;
    width: clamp(52px, 24vw, 88px);
  }

  .button-label {
    letter-spacing: 1.5px;
  }
}

.ambient-layer {
  position: absolute;
  inset: 0;
  z-index: 90;
  pointer-events: none;
  overflow: hidden;
}

.leaf {
  position: absolute;
  top: -18vh;
  left: 68vw;
  width: 88px;
  height: 46px;
  border-radius: 50% 50% 40% 40%;
  background: radial-gradient(circle at 50% 30%, rgba(255, 236, 179, 0.9), rgba(205, 170, 82, 0.8) 55%, rgba(141, 94, 31, 0.6) 100%);
  box-shadow: 0 8px 18px rgba(141, 94, 31, 0.3);
  opacity: 0;
  transform-origin: center;
  filter: blur(0.2px);
  will-change: transform, opacity;
}

.leaf::after {
  content: '';
  position: absolute;
  inset: 10px 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 250, 220, 0.7), rgba(255, 214, 123, 0));
}

.leaf.play {
  animation: leafGlide 1.8s cubic-bezier(0.18, 0.82, 0.3, 1) forwards;
}

.firefly-cluster {
  position: absolute;
  top: -12vh;
  right: -12vw;
  width: 200px;
  height: 200px;
  opacity: 0;
  pointer-events: none;
}

.firefly-cluster.play {
  animation: fireflySwarm 2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: 0.6s;
}

.firefly {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: -6px 0 0 -6px;
  background: radial-gradient(circle, rgba(252, 255, 206, 1) 0%, rgba(248, 217, 116, 0.8) 45%, rgba(248, 217, 116, 0) 75%);
  box-shadow: 0 0 12px rgba(255, 233, 135, 0.8), 0 0 24px rgba(255, 180, 0, 0.4);
  opacity: 0;
}

.firefly-cluster.play .firefly {
  animation: fireflyGather 1.4s ease-out forwards, fireflyTwinkle 2.4s ease-in-out infinite;
  animation-delay: calc(0.6s + var(--delay)), calc(0.6s + var(--delay));
}

.firefly:nth-child(odd) {
  filter: blur(0.4px);
}


</style>