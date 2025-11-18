<template>
  <view class="page">
    <view class="background-layer">
      <image class="room-image" src="/static/cottage.png" mode="aspectFill"></image>
      <view class="dark-overlay"></view>
    </view>

    <view class="content">
      <view class="section-title">
        <text class="title">睡觉</text>
        <text class="subtitle">温柔的夜，悄悄降临</text>
      </view>

    <view class="function-cards">
      <view class="function-card mailbox-card" @click="goMailbox">
        <view class="card-icon">📮</view>
        <text class="card-title">晚安邮箱</text>
        <text class="card-desc">投递与接收晚安消息</text>
      </view>

      <view class="function-card story-card" @click="goStories">
        <view class="card-icon">📖</view>
        <text class="card-title">睡眠故事</text>
        <text class="card-desc">聆听故事，安然入睡</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
function goMailbox() {
  uni.navigateTo({ url: '/pages/sleep/Mailbox' })
}

function goStories() {
  uni.navigateTo({ url: '/pages/sleep/Stories' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  position: relative;
  background: #11111a;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.background-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.room-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 100% center;
  filter: brightness(0.75);
}

.dark-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10, 10, 20, 0.35), rgba(5, 5, 10, 0.55));
}

.content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  text-align: center;
  color: #f4f4f7;
  }

.title {
  font-size: 26px;
  font-weight: 700;
}

.subtitle {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  color: #d0d0e0;
}

.function-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.function-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  border-radius: 26px;
  min-height: 140px;
  background: rgba(22, 23, 38, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 36px rgba(5, 8, 20, 0.35);
  backdrop-filter: blur(24px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.function-card:active {
  transform: translateY(1px) scale(0.99);
}

.mailbox-card {
  background: linear-gradient(150deg, rgba(79, 63, 81, 0.8), rgba(56, 43, 66, 0.75));
  border-color: rgba(255, 177, 141, 0.16);
}

.story-card {
  background: linear-gradient(150deg, rgba(55, 63, 92, 0.82), rgba(48, 54, 78, 0.75));
  border-color: rgba(159, 183, 255, 0.16);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 62px;
  border-radius: 18px;
  font-size: 36px;
  margin-bottom: 14px;
  color: #ffe5dc;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 6px rgba(255,255,255,0.2);
}

.mailbox-card .card-icon {
  background: rgba(255, 166, 129, 0.18);
  color: #ffd8c9;
}

.story-card .card-icon {
  background: rgba(166, 182, 255, 0.18);
  color: #e0e6ff;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #f6f0ff;
  margin-bottom: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
}

.card-desc {
  font-size: 14px;
  color: #dcdfee;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  line-height: 1.5;
}

@media (max-width: 750px) {
  .function-card {
    padding: 26px;
    min-height: 120px;
  }
  
  .card-icon {
    width: 54px;
    height: 54px;
    font-size: 30px;
  }
  
  .card-title {
    font-size: 18px;
  }
  
  .card-desc {
    font-size: 13px;
  }
}
</style>
