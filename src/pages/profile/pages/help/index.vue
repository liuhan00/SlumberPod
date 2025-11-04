<template>
  <scroll-view class="page" scroll-y :style="bgStyle">
    <view class="section">
      <text class="title">帮助与客服</text>

      <view class="faq">
        <view class="q">
          <text class="q-title">Q: 如何收藏喜欢的声音？</text>
          <text class="q-content">在声音卡片的菜单中点击“收藏”，可在“我喜欢的”中查看已收藏的声音。</text>
        </view>

        <view class="q">
          <text class="q-title">Q: 播放列表如何管理？</text>
          <text class="q-content">进入“队列”页面，支持单条移除、清空队列或保存为播放列表（视功能开放情况）。</text>
        </view>

        <view class="q">
          <text class="q-title">Q: 无法播放或遇到错误怎么办？</text>
          <text class="q-content">请尝试重启应用或切换网络；若问题持续，请在下面联系客服或通过应用内反馈提交问题并附上问题描述。</text>
        </view>
      </view>

      <view class="contact">
        <text class="label">联系客服</text>
        <button class="btn" @click="contact">打开客服页面</button>
        <button class="btn ghost" @click="copyLink">复制链接</button>
      </view>

      <view class="note">
        <text class="note-text">紧急问题请通过应用内“反馈”或发送邮件至 support@example.com（示例）。</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
import { useGlobalTheme } from '@/composables/useGlobalTheme'
const { bgStyle } = useGlobalTheme()
const CUSTOMER_LINK = 'https://ask.dcloud.net.cn/'

function contact(){
  try{
    const opened = window.open(CUSTOMER_LINK, '_blank')
    if(!opened){
      uni.setClipboardData({ data: CUSTOMER_LINK, success(){ uni.showToast({ title:'已复制链接，请在浏览器打开', icon:'none' }) } })
    }
  }catch(e){
    uni.setClipboardData({ data: CUSTOMER_LINK, success(){ uni.showToast({ title:'已复制链接，请在浏览器打开', icon:'none' }) } })
  }
}

function copyLink(){
  uni.setClipboardData({ data: CUSTOMER_LINK, success(){ uni.showToast({ title:'客服链接已复制', icon:'none' }) } })
}
</script>

<style scoped>
.page{ min-height:100vh; padding-top: constant(safe-area-inset-top); padding-top: env(safe-area-inset-top); }
.section{ padding: 12px 16px }
.title{ font-size:18px; font-weight:600; color: var(--fg); margin-bottom:12px }
.faq{ background: var(--card-bg); color: var(--card-fg); border-radius:12px; padding:16px; box-shadow:0 1px 6px var(--shadow) }
.q{ margin-bottom:14px }
.q-title{ font-weight:700; color: var(--fg); margin-bottom:6px }
.q-content{ color: var(--muted); line-height:1.5 }
.contact{ margin-top:16px; display:flex; align-items:center; gap:8px }
.label{ font-size:12px; color: var(--muted) }
.btn{ padding:8px 12px; border-radius:8px; background: var(--input-bg); color: var(--fg); border:none }
.btn.ghost{ background: transparent; border:1px solid rgba(0,0,0,0.06) }
.note{ margin-top:12px }
.note-text{ font-size:12px; color: var(--muted) }
</style>
