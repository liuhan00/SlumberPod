<template>
  <scroll-view class="page" scroll-y :style="bgStyle">
    <!-- 闹钟区 -->
    <view class="block">
      <view class="block-header">
        <text class="icon">⏰</text>
        <text class="block-title">闹钟</text>
      </view>
      <view class="card">
        <view class="row">
          <text class="label">自定义闹钟</text>
          <switch :checked="hasEnabledAlarm" @change="toggleFirst" />
        </view>
        <view class="time">{{ firstTime }}</view>
        <view class="subrow">
          <text class="pill">搭配铃声：{{ firstAlarm?.ringtone || '多普勒' }}</text>
          <button class="arrow" @click="openRing('alarm')">›</button>
        </view>
        <view class="subrow">
          <text class="pill">编辑时间</text>
          <button class="arrow" @click="openTime('alarm')">›</button>
        </view>
        <view class="subrow">
          <text class="pill">重复：{{ firstAlarm?.repeat || 'daily' }}</text>
          <button class="arrow" @click="openRepeat('alarm')">›</button>
        </view>
        <view class="subrow">
          <text class="pill">音量：{{ Math.round((firstAlarm?.volume||0.8)*100) }}%</text>
          <button class="arrow" @click="changeAlarmVolume">›</button>
        </view>
        <view class="subrow">
          <text class="pill">振动：{{ firstAlarm?.vibrate? '开':'关' }}</text>
          <button class="arrow" @click="toggleAlarmVibrate">›</button>
        </view>
      </view>
    </view>

    <!-- 提醒区：就寝提醒 -->
    <view class="block">
      <view class="block-header">
        <text class="icon">🔔</text>
        <text class="block-title">提醒</text>
      </view>
      <view class="card">
        <view class="row">
          <text class="label">就寝提醒</text>
          <switch :checked="sleep.reminder.enabled" @change="toggleReminder" />
        </view>
        <view class="time">{{ bedTime }}</view>
        <view class="subrow">
          <text class="pill">搭配铃声：蝶梦引</text>
          <button class="arrow" @click="editReminder">›</button>
        </view>
      </view>

      <view class="card">
        <view class="row">
          <text class="label">小憩提醒</text>
          <switch :checked="napEnabled" @change="toggleNap" />
        </view>
        <view class="time">{{ napTime }}</view>
        <view class="subrow">
          <text class="pill">搭配铃声：{{ sleep.napReminder.ringtone }}</text>
          <button class="arrow" @click="openRing('nap')">›</button>
        </view>
        <view class="subrow">
          <text class="pill">编辑时间</text>
          <button class="arrow" @click="openTime('nap')">›</button>
        </view>
        <view class="subrow">
          <text class="pill">重复：{{ sleep.napReminder.repeat }}</text>
          <button class="arrow" @click="openRepeat('nap')">›</button>
        </view>
      </view>

      <view class="card">
        <view class="row">
          <text class="label">睡前仪式提醒</text>
          <switch :checked="ritualEnabled" @change="toggleRitual" />
        </view>
        <view class="time">{{ ritualTime }}</view>
        <view class="subrow">
          <text class="pill">搭配铃声：{{ sleep.ritualReminder.ringtone }}</text>
          <button class="arrow" @click="openRing('ritual')">›</button>
        </view>
        <view class="subrow">
          <text class="pill">编辑时间</text>
          <button class="arrow" @click="openTime('ritual')">›</button>
        </view>
        <view class="subrow">
          <text class="pill">重复：{{ sleep.ritualReminder.repeat }}</text>
          <button class="arrow" @click="openRepeat('ritual')">›</button>
        </view>
      </view>
    </view>

    <!-- 底部添加按钮 -->
    <view class="fab" @click="addAlarm">
      <text>＋</text>
    </view>
  </scroll-view>
</template>
<script setup>
import { computed, ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { useSleepStore } from '@/stores/sleep'
const sleep = useSleepStore()
const two = n=> String(n).padStart(2,'0')

let mockHour
onLoad((query)=>{ mockHour = query?.hour ? Number(query.hour) : undefined })
const { bgStyle } = useGlobalTheme()

onMounted(()=> sleep.load())

// 闹钟：取第一个闹钟作为演示项
const firstAlarm = computed(()=> sleep.alarms[0])
const hasEnabledAlarm = computed(()=> !!firstAlarm.value?.enabled)
const firstTime = computed(()=> firstAlarm.value? `${two(firstAlarm.value.hour)}:${two(firstAlarm.value.minute)}` : '--:--')
function toggleFirst(){ if(firstAlarm.value) sleep.toggleAlarm(firstAlarm.value.id) }
function editFirst(){ uni.showToast({ title:'闹钟详情 敬请期待', icon:'none' }) }
function addAlarm(){ const now=new Date(); sleep.addAlarm({ hour:now.getHours(), minute:now.getMinutes(), label:'新闹钟', enabled:true }); uni.showToast({ title:'已添加新闹钟', icon:'none' }) }
function changeAlarmVolume(){ if(firstAlarm.value){ const v = ((firstAlarm.value.volume||0.8)+0.2)%1.2; sleep.setAlarmVolume(firstAlarm.value.id, v>1? 0 : v) } }
function toggleAlarmVibrate(){ if(firstAlarm.value){ sleep.setAlarmVibrate(firstAlarm.value.id, !(firstAlarm.value.vibrate)) } }

// 就寝提醒
const bedTime = computed(()=> `${two(sleep.reminder.hour)}:${two(sleep.reminder.minute)}`)
const initHour = computed(()=>{
  if(editTarget.value==='alarm' && firstAlarm.value) return firstAlarm.value.hour
  if(editTarget.value==='bed') return sleep.reminder.hour
  if(editTarget.value==='nap') return sleep.napReminder.hour
  if(editTarget.value==='ritual') return sleep.ritualReminder.hour
  return 12
})
const initMinute = computed(()=>{
  if(editTarget.value==='alarm' && firstAlarm.value) return firstAlarm.value.minute
  if(editTarget.value==='bed') return sleep.reminder.minute
  if(editTarget.value==='nap') return sleep.napReminder.minute
  if(editTarget.value==='ritual') return sleep.ritualReminder.minute
  return 0
})
function toggleReminder(){ sleep.setReminder({ enabled: !sleep.reminder.enabled }) }
function editReminder(){ uni.showToast({ title:'就寝提醒设置 敬请期待', icon:'none' }) }

// 小憩与仪式（本地状态模拟）
const napEnabled = ref(false), ritualEnabled = ref(false)
const napTime = ref('13:00'), ritualTime = ref('21:00')
function toggleNap(){ napEnabled.value = !napEnabled.value }
function toggleRitual(){ ritualEnabled.value = !ritualEnabled.value }
function editNap(){ uni.showToast({ title:'小憩提醒设置 敬请期待', icon:'none' }) }
function editRitual(){ uni.showToast({ title:'仪式提醒设置 敬请期待', icon:'none' }) }
</script>
<style scoped>
.page{ min-height:100vh; color:#e7e9ee }
.block{ padding: 12px 16px }
.block-header{ display:flex; align-items:center; gap:6px; margin-bottom:8px }
.icon{ font-size:16px }
.block-title{ font-size:14px; color:#c9cbd3 }
.card{ background:#191c24; border-radius:12px; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,.25); margin-bottom:12px }
.row{ display:flex; justify-content:space-between; align-items:center }
.label{ font-size:14px; color:#e7e9ee }
.time{ font-size:28px; font-weight:800; letter-spacing:1px; margin:6px 0 }
.subrow{ display:flex; justify-content:space-between; align-items:center }
.pill{ font-size:12px; color:#d6c38a; background:#2a2520; padding:4px 8px; border-radius:8px }
.arrow{ width:28px; height:28px; border-radius:8px; background:#232733; color:#cfd3dc }
.fab{ position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); width:56px; height:56px; border-radius:50%; background:#f7c14d; color:#111; display:flex; align-items:center; justify-content:center; font-size:24px; box-shadow:0 6px 16px rgba(0,0,0,.35) }
</style>
