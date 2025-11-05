<template>
  <scroll-view class="page" scroll-y :style="bgStyle">
    <view class="section">
      <text class="title">关于 星眠坞</text>

      <view class="hero">
        <image class="logo" src="/static/logoo.png" mode="aspectFit" />
        <text class="app-name">星眠坞</text>
        <text class="tagline">白噪音 · 睡眠训练 · 放松陪伴</text>
      </view>

      <view class="card">
        <text class="line"><text class="muted">应用：</text> 星眠坞</text>
        <text class="line"><text class="muted">版本：</text> v0.1.0</text>
        <text class="line"><text class="muted">简介：</text> 提供白噪音、睡眠引导与放松音频，帮助入睡与提高睡眠质量。</text>
      </view>

      <view class="card">
        <text class="line"><text class="muted">开源协议：</text> MIT（示例）</text>
        <text class="line"><text class="muted">技术栈：</text> uni-app + Vue3 + Pinia</text>
        <text class="line"><text class="muted">项目主页：</text> <text class="link" @click="openLink('https://github.com/')">GitHub</text></text>
      </view>

      <view class="card">
        <text class="section-title">支持与反馈</text>
        <text class="line">如果你有功能建议或遇到问题，请通过以下方式联系我们：</text>
        <view class="actions">
          <button class="btn" @click="openLink(contactLink)">打开帮助中心</button>
          <button class="btn ghost" @click="copyEmail">复制支持邮箱</button>
        </view>
      </view>

      <view class="card small">
        <text class="line small">隐私与数据：本应用仅用于示例演示；实际产品应在此处说明用户数据收集、存储与处理策略。</text>
      </view>

      <view class="footer">
        <text class="copyright">© 2025 星眠坞</text>
        <text class="version">Build v0.1.0</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
import { useGlobalTheme } from '@/composables/useGlobalTheme'
const { bgStyle } = useGlobalTheme()
const contactLink = 'https://ask.dcloud.net.cn/'
const supportEmail = 'support@example.com'

function openLink(url){
  try{
    const opened = window.open(url, '_blank')
    if(!opened) uni.setClipboardData({ data: url, success(){ uni.showToast({ title:'链接已复制，请在浏览器打开', icon:'none' }) } })
  }catch(e){
    uni.setClipboardData({ data: url, success(){ uni.showToast({ title:'链接已复制，请在浏览器打开', icon:'none' }) } })
  }
}

function copyEmail(){
  uni.setClipboardData({ data: supportEmail, success(){ uni.showToast({ title:'支持邮箱已复制', icon:'none' }) } })
}
</script>

<style scoped>
.page{ min-height:100vh; padding-top: constant(safe-area-inset-top); padding-top: env(safe-area-inset-top); }
.section{ padding: 16px }
.title{ font-size:18px; font-weight:700; color: var(--fg); margin-bottom:12px }
.hero{ display:flex; align-items:center; gap:12px; margin-bottom:14px }
.logo{ width:60px; height:60px; border-radius:12px }
.app-name{ font-size:16px; font-weight:700; color: var(--fg) }
.tagline{ font-size:12px; color: var(--muted) }
.card{ background: var(--card-bg); color: var(--card-fg); border-radius:12px; padding:14px; box-shadow:0 1px 6px var(--shadow); margin-bottom:12px }
.small{ padding:10px }
.line{ display:block; margin-bottom:8px }
.muted{ color: var(--muted); font-weight:600 }
.section-title{ font-weight:700; margin-bottom:8px }
.actions{ display:flex; gap:8px }
.btn{ padding:8px 12px; border-radius:8px; background: var(--input-bg); color: var(--fg); border:none }
.btn.ghost{ background:transparent; border:1px solid rgba(0,0,0,0.06) }
.link{ color: var(--primary); text-decoration:underline }
.footer{ margin-top:8px; display:flex; justify-content:space-between; color: var(--muted); font-size:12px }
</style>
