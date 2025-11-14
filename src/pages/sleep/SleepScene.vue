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
  border-radius: 24px;
  min-height: 140px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 12px 30px rgba(5, 5, 15, 0.3);
  backdrop-filter: blur(20px);
  transition: transform 0.2s, box-shadow 0.2s;
}

.function-card:active {
  transform: scale(0.98);
}

.mailbox-card {
  border-color: rgba(255, 200, 150, 0.45);
  background: linear-gradient(135deg, rgba(255, 220, 150, 0.35) 0%, rgba(255, 200, 100, 0.2) 100%);
}

.story-card {
  border-color: rgba(216, 196, 168, 0.45);
  background: linear-gradient(135deg, rgba(232, 212, 184, 0.35) 0%, rgba(216, 196, 168, 0.2) 100%);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 12px;
  filter: drop-shadow(0 0 8px rgba(255, 200, 100, 0.4));
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #6b5b4f;
  margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.card-desc {
  font-size: 14px;
  color: #f0f0ff;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

@media (max-width: 750px) {
  .function-card {
    padding: 24px;
    min-height: 120px;
  }
  
  .card-icon {
    font-size: 40px;
  }
  
  .card-title {
    font-size: 18px;
  }
  
  .card-desc {
    font-size: 13px;
  }
}
</style>
