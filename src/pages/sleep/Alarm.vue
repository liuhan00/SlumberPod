<template>
  <scroll-view class="page" scroll-y>
    <view class="card">
      <text class="title">闹钟与提醒</text>
      <view class="row">
        <text>新增闹钟</text>
        <input class="num" type="number" v-model.number="hour" min="0" max="23" />
        <text>:</text>
        <input class="num" type="number" v-model.number="minute" min="0" max="59" />
        <input class="text" type="text" v-model="label" placeholder="标签(可选)" />
        <button class="btn" @click="add">添加</button>
      </view>
      <view class="list">
        <view class="item" v-for="a in sleep.alarms" :key="a.id">
          <text class="time">{{ two(a.hour) }}:{{ two(a.minute) }}</text>
          <text class="label">{{ a.label }}</text>
          <button class="btn" @click="toggle(a.id)">{{ a.enabled? '禁用':'启用' }}</button>
          <button class="btn danger" @click="remove(a.id)">删除</button>
        </view>
      </view>
    </view>
    <view class="card">
      <text class="title">睡前提醒</text>
      <view class="row">
        <text>时间</text>
        <input class="num" type="number" v-model.number="rHour" min="0" max="23" />
        <text>:</text>
        <input class="num" type="number" v-model.number="rMinute" min="0" max="59" />
        <button class="btn" @click="saveReminder">保存</button>
      </view>
      <view class="row">
        <text>状态</text>
        <button class="btn" @click="toggleReminder">{{ sleep.reminder.enabled? '关闭':'开启' }}</button>
      </view>
    </view>
  </scroll-view>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useSleepStore } from '@/stores/sleep'
const sleep = useSleepStore()
const hour = ref(7), minute = ref(30), label=ref('起床')
const rHour = ref(sleep.reminder.hour), rMinute = ref(sleep.reminder.minute)

onMounted(()=> sleep.load())

function add(){ const a=sleep.addAlarm({ hour:hour.value, minute:minute.value, label:label.value, enabled:true }); uni.showToast({ title:'已添加', icon:'none' }) }
function toggle(id){ sleep.toggleAlarm(id) }
function remove(id){ sleep.removeAlarm(id) }
function saveReminder(){ sleep.setReminder({ hour:rHour.value, minute:rMinute.value }); uni.showToast({ title:'已保存', icon:'none' }) }
function toggleReminder(){ sleep.setReminder({ enabled: !sleep.reminder.enabled }) }
function two(n){ return String(n).padStart(2,'0') }
</script>
<style scoped>
.page{ min-height:100vh; padding:12px 16px }
.card{ background:#fff; border-radius:12px; padding:12px; box-shadow:0 1px 4px rgba(0,0,0,.06); margin-bottom:12px }
.title{ font-size:16px; font-weight:600 }
.row{ display:flex; align-items:center; gap:8px; margin-top:8px; flex-wrap:wrap }
.num{ width:60px; background:#f2f3f5; border-radius:8px; padding:6px 8px }
.text{ flex:1; background:#f2f3f5; border-radius:8px; padding:6px 8px }
.list{ margin-top:8px }
.item{ display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid #eee }
.time{ font-size:18px; font-weight:700 }
.label{ color:#666 }
.btn{ padding:6px 10px; border-radius:8px; background:#f2f3f5 }
.danger{ background:#ffeded; color:#c62828 }
</style>
