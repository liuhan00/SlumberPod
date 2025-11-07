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
      <view class="picker-row">
        <text class="picker-label">选择延迟时长（最多 12 小时）</text>
        <view style="margin-top:12px; display:flex; flex-direction:column; gap:10px; align-items:center;">
          <!-- 单个圆形风格滑动器替代：使用水平range，最大720分钟，显示小时与分钟 -->
          <!-- Wheel picker: hours (0-12) and minutes (0-59) -->
          <template v-if="isWeixinMini">
            <picker-view :value="pickerValue" class="wheel" @change="onPickerChange">
              <picker-view-column class="wheel-col">
                <view v-for="(h, idx) in hoursList" :key="h" class="wheel-item">{{ h }} 小时</view>
              </picker-view-column>
              <picker-view-column class="wheel-col">
                <view v-for="(m, idx) in minutesList" :key="m" class="wheel-item">{{ m }} 分钟</view>
              </picker-view-column>
            </picker-view>
          </template>
          <template v-else>
            <!-- H5 fallback: two scrollable columns emulating wheel -->
            <div class="wheel-fallback">
              <div class="wheel-col-f">
                <div v-for="h in hoursList" :key="h" @click="selectHour(h)" class="wheel-item-f">{{ h }} 小时</div>
              </div>
              <div class="wheel-col-f">
                <div v-for="m in minutesList" :key="m" @click="selectMinute(m)" class="wheel-item-f">{{ m }} 分钟</div>
              </div>
            </div>
          </template>

          <view style="display:flex; gap:12px; align-items:center; margin-top:6px;">
            <text style="font-weight:600">当前选择：</text>
            <text>{{ delayHours }} 小时</text>
            <text>{{ delayMinutes }} 分钟</text>
          </view>

          <view style="display:flex; gap:8px; margin-top:6px;">
            <button class="q" @click="setQuick(60)">1 小时后</button>
            <button class="q" @click="setQuick(120)">2 小时后</button>
            <button class="q" @click="setQuick(180)">3 小时后</button>
          </view>
        </view>
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

const isWeixinMini = (typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function')
const emit = defineEmits(['close'])
const visible = ref(true)
const showPicker = ref(false)
const noMore = ref(false)
const delayHours = ref(1)
const delayMinutes = ref(0)
const rating = ref(4)
const comment = ref('')

// wheel data
const hoursList = Array.from({length:13}).map((_,i)=>i) // 0..12
const minutesList = Array.from({length:60}).map((_,i)=>i) // 0..59
const pickerValue = ref([1,0]) // indices for hour/minute lists

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

function onPickerChange(e){
  try{
    // e.detail.value is [hourIndex, minuteIndex]
    const val = e && e.detail && Array.isArray(e.detail.value) ? e.detail.value : pickerValue.value
    const hIdx = Number(val[0] || 0)
    const mIdx = Number(val[1] || 0)
    const h = hoursList[hIdx] || 0
    const m = minutesList[mIdx] || 0
    delayHours.value = h
    delayMinutes.value = m
    pickerValue.value = [hIdx, mIdx]
  }catch(err){ console.warn('picker change parse failed', err) }
}

function selectHour(h){ delayHours.value = Number(h); pickerValue.value[0] = hoursList.indexOf(Number(h)) }
function selectMinute(m){ delayMinutes.value = Number(m); pickerValue.value[1] = minutesList.indexOf(Number(m)) }

function confirmPicker(){
  const hrs = Number(delayHours.value||0)
  const mins = Number(delayMinutes.value||0)
  if(isNaN(hrs) || isNaN(mins) || hrs<0 || mins<0) return uni.showToast({ title:'请选择有效的时间', icon:'none' })
  const total = hrs*60 + mins
  if(total <= 0) return uni.showToast({ title:'请选择未来时间', icon:'none' })
  if(total > 12*60) return uni.showToast({ title:'最多只能选择 12 小时', icon:'none' })
  const fireAt = Date.now() + total * 60 * 1000
  scheduleFeedbackReminder(fireAt)
  uni.showToast({ title:'已设置提醒', icon:'success' })
  emit('close')
}
</script>

<style scoped>
.overlay{ position:fixed; inset:0; z-index:2500 }
.backdrop{ position:absolute; inset:0; background:rgba(0,0,0,0.45) }
.card{ position:relative; left:6%; right:6%; top:14%; background:#ffffff; border-radius:14px; padding:16px; display:flex; flex-direction:column; gap:12px; box-shadow:0 10px 30px rgba(0,0,0,0.12); overflow:visible; z-index:2501 }
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
.sheet{ position:fixed; left:6%; right:6%; bottom:8%; background:#fff; padding:14px; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.12); z-index:2600 }
.sheet-title{ font-weight:600; margin-bottom:8px }
.wheel{ height:160px; width:100%; }
.wheel-col{ }
.wheel-item{ height:40px; display:flex; align-items:center; justify-content:center; font-size:16px }
.wheel-fallback{ display:flex; gap:8px; width:100% }
.wheel-col-f{ flex:1; max-height:160px; overflow:auto; text-align:center; border-radius:8px; background:#fafafa }
.wheel-item-f{ padding:12px 0; font-size:15px; color:#222 }
.sheet-actions{ display:flex; justify-content:space-between; margin-top:12px }
</style>