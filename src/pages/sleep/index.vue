<template>
  <scroll-view class="page" scroll-y>
    <view class="hero">
      <text class="greet">{{ greet }}</text>
      <text class="sub">听听深睡脑波，可以减少睡前大脑兴奋</text>
    </view>
    <view class="section">
      <view class="record card">
        <text class="title">记录睡眠</text>
        <text class="desc">记录梦话呼噜声</text>
      </view>
    </view>
    <view class="section actions">
      <view class="circle" @click="goNap"><text>小憩</text></view>
      <view class="circle" @click="goAlarm"><text>闹钟与提醒</text></view>
      <view class="circle" @click="ritual"><text>睡前仪式</text></view>
    </view>
    <view class="section">
      <view class="tabs">
        <text v-for="c in categories" :key="c" :class="['tab', c===active? 'active':'']" @click="active=c">{{ c }}</text>
      </view>
      <view class="grid">
        <NoiseCard v-for="n in filtered" :key="n.id" :item="n" />
      </view>
    </view>
  </scroll-view>
</template>
<script setup>
import { computed, ref } from 'vue'
import NoiseCard from '@/components/NoiseCard.vue'

const categories = ['全部','自然','居家','环境']
const active = ref('全部')
import { allNoises as noises } from '@/data/noises'
const filtered = computed(() => active.value==='全部' ? noises : noises.filter(n=>n.category===active.value))
</script>
<style scoped>
.page { min-height:100vh }
.section { padding: 12px 16px }
.hero{ height:160px; padding: 12px 16px; background: radial-gradient(120% 80% at 50% 20%, #1f2430 0%, #161a24 60%, #12141c 100%); color:#fff; border-bottom-left-radius: 24px; border-bottom-right-radius: 24px }
.greet{ font-size:22px; font-weight:700 }
.sub{ margin-top:6px; color: #cfd3dc }
.card{ background:#fff; border-radius:12px; padding:12px; box-shadow:0 1px 4px rgba(0,0,0,.06) }
actions{ }
.actions{ display:flex; justify-content:space-around; align-items:center; padding: 0 16px }
.circle{ width:80px; height:80px; border-radius:50%; background:#f2f3f5; display:flex; align-items:center; justify-content:center; color:#333 }
.tabs { display:flex; gap:8px; margin:10px 0 }
.tab { padding:6px 10px; border-radius:14px; background:#f2f3f5; color:#666 }
.active { background:#111; color:#fff }
.grid { display:flex; flex-wrap:wrap; justify-content:space-between }
</style>
