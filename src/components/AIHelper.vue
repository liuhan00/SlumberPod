<template>
  <view>
    <view class="floating" @click.stop="open = true" title="解梦小助手">
      <view class="pillow">枕</view>
    </view>

    <view v-if="open" class="ai-modal" @click.self="close">
      <view class="modal-card">
        <view class="modal-header">
          <view class="logo">🛌</view>
          <view class="title">枕眠 · AI 解梦</view>
          <button class="close" @click.stop="close">✕</button>
        </view>

        <scroll-view class="messages" scroll-y>
          <view v-for="(m, i) in messages" :key="i" :class="['msg', m.role]">
            <text class="content">{{ m.content }}</text>
          </view>
        </scroll-view>

        <view class="input-row">
          <input class="input" v-model="input" placeholder="轻声描述你的梦境，我会帮你解读..." />
          <button class="send" @click="send" :disabled="loading">发送</button>
        </view>

        <view class="hint">提示：输入梦境背景、情绪和关键词，解读更精准。</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
const COZE_API_URL = import.meta.env.VITE_COZE_API_URL || ''
const COZE_API_KEY = import.meta.env.VITE_COZE_API_KEY || ''

const open = ref(false)
const input = ref('')
const messages = ref([
  { role: 'assistant', content: '你好，我是枕眠 AI。想聊聊你的梦吗？' }
])
const loading = ref(false)

function close(){ open.value = false }

async function send(){
  const text = (input.value || '').trim()
  if(!text) return
  messages.value.push({ role: 'user', content: text })
  input.value = ''
  loading.value = true
  try{
    if(!COZE_API_URL){
      messages.value.push({ role: 'assistant', content: '未配置 Coze API，请在环境变量 VITE_COZE_API_URL 设置。' })
      return
    }
    const body = { input: text }
    const res = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, COZE_API_KEY ? { Authorization: `Bearer ${COZE_API_KEY}` } : {}),
      body: JSON.stringify(body)
    })
    if(!res.ok){
      const err = await res.text()
      throw new Error(err || 'Coze 请求失败')
    }
    const data = await res.json()
    const reply = data?.output?.text || data?.text || data?.answer || JSON.stringify(data)
    messages.value.push({ role: 'assistant', content: reply })
  }catch(e){
    messages.value.push({ role: 'assistant', content: '调用失败：' + (e.message || e) })
  }finally{ loading.value = false }
}
</script>

<style scoped>
/* 小程序兼容简化样式（避免使用不支持的选择器） */
.floating { position: fixed; right: 18px; bottom: 110px; width: 64px; height: 64px; border-radius: 32px; z-index: 2200; display: -webkit-box; display:flex; -webkit-box-align:center; align-items:center; -webkit-box-pack:center; justify-content:center; cursor: pointer; }
.pillow { width:56px; height:56px; border-radius:28px; background-color:#ffecec; display:flex; align-items:center; justify-content:center; color:#5a3b4a; font-weight:700; font-size:18px; box-shadow: 0 6px 12px rgba(0,0,0,0.12); }
.ai-modal { position: fixed; right: 18px; bottom: 190px; width: 320px; max-height: 440px; z-index: 2201; display: block; }
.modal-card { width:100%; background-color:#ffffff; border-radius:12px; padding:10px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
.modal-header { display:flex; align-items:center; }
.logo { width:36px; height:36px; border-radius:8px; background-color:#e6f0ff; display:flex; align-items:center; justify-content:center; font-size:18px; }
.title { flex:1; font-weight:700; color:#2d3440; margin-left:8px; }
.close { background:transparent; border:none; font-size:16px; }
.messages { display:block; padding:6px 0; max-height:280px; overflow:auto; }
.msg { padding:8px 10px; border-radius:8px; margin-bottom:8px; word-break:break-word; }
.msg.user { background:#fff1f4; color:#6b4250; align-self:flex-end; }
.msg.assistant { background:#eef6ff; color:#2b3a4a; align-self:flex-start; }
.input-row { display:flex; align-items:center; margin-top:8px; }
.input { flex:1; padding:8px 10px; border-radius:20px; border:1px solid rgba(0,0,0,0.06); background:#fff; }
.send { padding:8px 12px; border-radius:20px; background:#7b61ff; color:#fff; border:none; }
.hint { margin-top:8px; font-size:12px; color:#8b93a3; }
</style>