<template>
  <view class="post">
    <view class="header">
      <image class="avatar" :src="post.author.avatar" />
      <view class="author">
        <text class="name">{{ post.author.name }}</text>
        <text class="time">{{ post.time }}</text>
      </view>
    </view>
    <text class="content">{{ post.content }}</text>
    <image v-if="post.image" class="image" :src="post.image" mode="aspectFill" />
    <view class="actions">
      <button class="btn" @click="like">👍 {{ post.likes }}</button>
      <button class="btn" @click="comment">💬 {{ post.comments.length }}</button>
    </view>
  </view>
</template>
<script setup>
const props = defineProps({ post: { type: Object, required: true } })
const emit = defineEmits(['like','comment'])
function like(){ emit('like', props.post.id) }
function comment(){ emit('comment', props.post.id) }
</script>
<style scoped>
.post{ background:#fff; border-radius:12px; padding:12px; margin-bottom:12px; box-shadow:0 1px 4px rgba(0,0,0,.06) }
.header{ display:flex; align-items:center; gap:10px }
.avatar{ width:36px; height:36px; border-radius:50% }
.author{ display:flex; flex-direction:column }
.name{ font-weight:600; color:#111 }
.time{ font-size:12px; color:#888 }
.content{ margin:10px 0; color:#333 }
.image{ width:100%; height:160px; border-radius:10px }
.actions{ display:flex; gap:10px }
.btn{ padding:6px 10px; border-radius:8px; background:#f2f3f5 }
</style>
