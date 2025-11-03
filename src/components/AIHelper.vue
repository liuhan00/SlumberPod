<template>
  <div class="ai-helper">
    <button class="fab" @click="open = !open">🤖</button>
    <transition name="fade">
      <div v-if="open" class="panel">
        <div class="panel-header">
          <span>AI 解梦小助手</span>
          <button class="close" @click="open=false">✕</button>
        </div>
        <div class="panel-body">
          <div class="messages">
            <div v-for="(m,i) in messages" :key="i" :class="['msg', m.role]">{{ m.text }}</div>
          </div>
          <div class="composer">
            <input v-model="input" placeholder="输入你的梦境，回车发送" @keyup.enter="send" />
            <button @click="send">发送</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const open = ref(false)
const input = ref('')
const messages = ref([{ role: 'system', text: '你好，我是你的解梦小助手。描述一个梦，我会帮你分析。' }])
function send(){
  const t = input.value && input.value.trim()
  if(!t) return
  messages.value.push({ role: 'user', text: t })
  input.value = ''
  // placeholder: local simple echo; replace with real AI call integration later
  setTimeout(()=>{
    messages.value.push({ role: 'assistant', text: '（AI）这是对你梦境的简短分析：' + t.slice(0,80) })
  }, 600)
}
</script>

<style scoped>
.ai-helper { position: fixed; right: 14px; bottom: 76px; z-index: 1200 }
.fab { width:54px; height:54px; border-radius:50%; background:#111; color:#fff; border:none; box-shadow:0 6px 18px rgba(0,0,0,0.3); font-size:22px }
.panel { width:320px; max-width:90vw; background:var(--card-bg,#fff); color:var(--text-primary,#111); border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.25); overflow:hidden }
.panel-header { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:linear-gradient(90deg,#f7f7f8,#eef2ff); font-weight:600 }
.panel-body { padding:12px }
.messages { max-height:240px; overflow:auto; display:flex; flex-direction:column; gap:8px; margin-bottom:8px }
.msg { padding:8px 10px; border-radius:8px; max-width:100% }
.msg.user { align-self:flex-end; background:#007aff; color:white }
.msg.assistant { align-self:flex-start; background:#f1f1f1 }
.msg.system { align-self:center; background:transparent; color:#666; font-size:12px }
.composer { display:flex; gap:8px }
.composer input { flex:1; padding:8px 10px; border-radius:8px; border:1px solid #ddd }
.composer button { padding:8px 12px; border-radius:8px; background:#111; color:#fff; border:none }
.fade-enter-active,.fade-leave-active{transition:all .18s}
.fade-enter-from{opacity:0;transform:scale(.98)}
</style>