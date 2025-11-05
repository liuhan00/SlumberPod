<template>
  <view class="overlay" v-if="visible">
    <view class="backdrop" @click="dismiss" />
    <view class="card">
      <view class="header">
        <view class="icon">🌙</view>
        <view class="texts">
          <text class="title">睡眠反馈</text>
          <text class="subtitle">感谢你使用星眠坞，告诉我们你的睡眠感受吧</text>
        </view>
      </view>

      <view class="rating-row">
        <text class="label">今早感觉</text>
        <view class="stars">
          <button v-for="i in 5" :key="i" :class="['star', i<=rating? 'active': '']" @click="setRating(i)">★</button>
        </view>
      </view>

      <textarea v-model="comment" class="comment" placeholder="简要描述你的睡眠（可选）：如入睡难度、梦境、醒来感受等" />

      <view class="actions">
        <button class="btn primary" @click="submit">提交反馈</button>
        <button class="btn" @click="askLater">稍后提醒</button>
      </view>

      <view class="footer">
        <label class="checkbox"><input type="checkbox" v-model="noMore" /> 不再提示</label>
      </view>
    </view>

    <!-- later picker sheet -->
    <view class="sheet" v-if="showPicker">
      <text class="sheet-title">选择提醒时间</text>
      <view class="quick">
        <button class="q" @click="setQuick(60)">1 小时后</button>
        <button class="q" @click="setQuick(120)">2 小时后</button>
        <button class="q" @click="setQuick(24*60)">明天同一时间</button>
      </view>
      <view class="picker-row">
        <input type="number" v-model="pickHour" min="0" max="23" />
        <text>时</text>
        <input type="number" v-model="pickMinute" min="0" max="59" />
        <text>分</text>
      </view>
      <view class="sheet-actions">
        <button class="btn" @click="cancelPicker">取消</button>
        <button class="btn primary" @click="confirmPicker">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { scheduleFeedbackReminder, submitFeedback } from '@/store/feedback'

const emit = defineEmits(['close'])
const visible = ref(true)
const showPicker = ref(false)
const noMore = ref(false)
const pickHour = ref('')
const pickMinute = ref('')
const rating = ref(4)
const comment = ref('')

function dismiss(){
  try{ emit('close') }catch(e){}
  try{ uni.navigateBack() }catch(e){}
}

function setRating(v){ rating.value = v }

async function submit(){
  const payload = { rating: rating.value, comment: (comment.value||'').trim(), noMore: !!noMore.value }
  try{
    await submitFeedback(payload)
    uni.showToast({ title:'感谢你的反馈', icon:'success' })
    emit('close')
  }catch(e){
    uni.showToast({ title:'提交失败，请稍后再试', icon:'none' })
  }
}

function askLater(){ showPicker.value = true }
function cancelPicker(){ showPicker.value = false }

function setQuick(mins){
  const now = Date.now()
  const fireAt = now + mins * 60 * 1000
  scheduleFeedbackReminder(fireAt)
  uni.showToast({ title:'已设置提醒', icon:'success' })
  emit('close')
}

function confirmPicker(){
  let h = parseInt(pickHour.value || 0)
  let m = parseInt(pickMinute.value || 0)
  if(isNaN(h) || isNaN(m)) return uni.showToast({ title:'请输入有效时间', icon:'none' })
  const now = new Date()
  const fire = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
  let fireAt = fire.getTime()
  if(fireAt <= Date.now()){
    uni.showToast({ title:'请选择未来时间', icon:'none' }); return
  }
  scheduleFeedbackReminder(fireAt)
  uni.showToast({ title:'已设置提醒', icon:'success' })
  emit('close')
}
</script>

<style scoped>
.overlay{ position:fixed; inset:0; z-index:2500 }
.backdrop{ position:absolute; inset:0; background:rgba(0,0,0,0.45) }
.card{ position:absolute; left:6%; right:6%; top:14%; background:#ffffff; border-radius:14px; padding:16px; display:flex; flex-direction:column; gap:12px; box-shadow:0 10px 30px rgba(0,0,0,0.12) }
.header{ display:flex; gap:12px; align-items:center }
.icon{ width:48px; height:48px; border-radius:10px; background:linear-gradient(135deg,#f6f8ff,#fff7fb); display:flex; align-items:center; justify-content:center; font-size:22px }
.texts{ display:flex; flex-direction:column }
.title{ font-size:16px; font-weight:700 }
.subtitle{ color:#6b7280; font-size:13px }
.rating-row{ display:flex; align-items:center; gap:12px }
.label{ color:#374151 }
.stars{ display:flex; gap:6px }
.star{ background:transparent; border:none; font-size:18px; color:#d1d5db }
.star.active{ color:#f59e0b }
.comment{ min-height:72px; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.06); resize:none }
.actions{ display:flex; gap:10px }
.btn{ flex:1; padding:10px; border-radius:10px; background:#f3f4f6; border:none }
.btn.primary{ background:#6b46c1; color:#fff }
.footer{ display:flex; justify-content:flex-end }
.checkbox{ font-size:13px; color:#6b7280 }
.sheet{ position:absolute; left:6%; right:6%; bottom:8%; background:#fff; padding:14px; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.12) }
.sheet-title{ font-weight:600; margin-bottom:8px }
.quick{ display:flex; gap:8px; margin-bottom:8px }
.q{ padding:8px 12px; border-radius:8px; background:#f3f4f6; border:none }
.picker-row{ display:flex; align-items:center; gap:8px }
.sheet-actions{ display:flex; justify-content:space-between; margin-top:12px }
</style>