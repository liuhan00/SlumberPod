<template>
  <scroll-view class="page" scroll-y>
    <view class="section">
      <CommunityComposer @submit="createPost" />
      <view class="tabs">
        <text v-for="t in tabs" :key="t" :class="['tab', t===active? 'active':'']" @click="active=t">{{ t }}</text>
      </view>
      <PostCard v-for="p in filtered" :key="p.id" :post="p" @like="onLike" @comment="onComment" />
    </view>
  </scroll-view>
</template>
<script setup>
import { ref, computed } from 'vue'
import CommunityComposer from '@/components/CommunityComposer.vue'
import PostCard from '@/components/PostCard.vue'

const tabs=['推荐','最新','关注']
const active = ref('推荐')
const posts = ref([
  { id:'p1', time:'刚刚', content:'昨晚试了雨声+树林组合，很快入睡。', image:'https://picsum.photos/seed/p1/800/400', likes:12, comments:[], author:{ name:'Sleepy', avatar:'https://picsum.photos/seed/a1/100' } },
  { id:'p2', time:'1小时前', content:'有谁用过壁炉声？感觉很温暖~', image:'', likes:7, comments:[], author:{ name:'Cozy', avatar:'https://picsum.photos/seed/a2/100' } },
])
const filtered = computed(()=> posts.value)
function onLike(id){ const p=posts.value.find(x=>x.id===id); if(p) p.likes++ }
function onComment(id){ uni.showToast({ title:'评论功能待上线', icon:'none' }) }
function createPost(text){
  const id=`p${Date.now()}`
  posts.value.unshift({ id, time:'刚刚', content:text, image:'', likes:0, comments:[], author:{ name:'我', avatar:'https://picsum.photos/seed/me/100' } })
}
</script>
<style scoped>
.page{ min-height:100vh }
.section{ padding:12px 16px }
.tabs{ display:flex; gap:8px; margin: 8px 0 }
.tab{ padding:6px 10px; border-radius:14px; background:#f2f3f5; color:#666 }
.active{ background:#111; color:#fff }
</style>
