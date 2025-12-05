<template>
  <view class="container">
    <view class="close" @click="goBack">✕</view>
    <view class="audio-card">
      <image class="cover" :src="audio.cover || ''" @error="onCoverError" mode="aspectFill" />
      <view class="meta">
        <text class="title">{{audio.title}}</text>
        <text class="subtitle">{{audio.subtitle}}</text>
      </view>
      <button class="play-mini" @click="previewPlay">▶</button>
    </view>

    <textarea class="content" v-model="contentText" placeholder="发布50字以上，更容易获赞哦~" auto-height="true" maxlength="500" />
    <view class="divider"></view>

    <view class="tags-row">
      <scroll-view scroll-x class="tag-scroll">
        <view v-for="(t, i) in selectedTags" :key="i" class="tag">#{{t}}</view>
      </scroll-view>
      <button class="choose" @click="chooseTopic"># 选择话题</button>
    </view>

    <view class="bottom">
      <button class="publish" :disabled="publishing" @click="publishPost">发布帖子</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      audio: {
        id: '',
        title: '未知音频',
        subtitle: '',
        cover: ''
      },
      contentText: '',
      selectedTags: [],
      publishing: false
    }
  },
  onLoad(query) {
    // 通过路由传入 audioId, title, cover
    if (query && query.audioId) this.audio.id = query.audioId
    if (query && query.title) this.audio.title = decodeURIComponent(query.title)
    if (query && query.subtitle) this.audio.subtitle = decodeURIComponent(query.subtitle)
    if (query && query.cover) this.audio.cover = decodeURIComponent(query.cover)
    // 若无标题则走兜底
    if (!this.audio.title || this.audio.title === '未知音频') {
      this.audio.title = '白噪音组合'
    }
  },
  methods: {
    goBack() { uni.navigateBack() },
    previewPlay() { /* 可调用播放器中心服务播放预览 */ },
    chooseTopic() { uni.navigateTo({ url: '/pages/community/topicSelect' }) },
    onCoverError(e){ this.audio.cover = '' },
    async publishPost() {
      if ((this.contentText || '').trim().length < 50) {
        uni.showToast({ title: '请至少输入50字', icon: 'none' })
        return
      }
      this.publishing = true
      try {
        // 调用社区发布接口（示例）
        const res = await uni.request({
          url: (process.env.VUE_APP_API_BASE || '') + '/api/community/posts',
          method: 'POST',
          data: {
            audioId: this.audio.id,
            content: this.contentText,
            tags: this.selectedTags
          }
        })
        if (res[1] && res[1].statusCode >= 200 && res[1].statusCode < 300) {
          uni.showToast({ title: '发布成功', icon: 'none' })
          setTimeout(() => uni.navigateBack(), 800)
        } else {
          uni.showToast({ title: '发布失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '网络错误', icon: 'none' })
      } finally {
        this.publishing = false
      }
    }
  }
}
</script>

<style scoped>
.container{ padding:16px; background:var(--page-bg,#f6f6f6); min-height:100vh }
.close{ position:fixed; left:12px; top:12px; color:#111; font-size:20px }
.audio-card{ margin-top:36px; background: transparent; padding:12px; display:flex; align-items:center }
.cover{ width:56px; height:56px; border-radius:8px }
.meta{ margin-left:12px; flex:1 }
.title{ color:#111; font-size:16px; font-weight:700 }
.subtitle{ color:#888; font-size:12px; margin-top:6px }
.play-mini{ background:transparent; color:#333; border:none; outline:none }
.content{ margin-top:16px; min-height:200px; color:#111; background:transparent; padding:12px; font-size:14px }
.tags-row{ margin-top:16px; display:flex; align-items:center }
.tag-scroll{ flex:1 }
.tag{ background:transparent; color:#555; padding:6px 10px; margin-right:8px; display:inline-block }
.choose{ background:transparent; color:#555; padding:8px 12px; border:none; outline:none }
.bottom{ position:fixed; left:16px; right:16px; bottom:20px }
.publish{ width:100%; background:transparent; color:#2fb670; padding:12px; font-size:16px; border:none; outline:none }
.publish:disabled{ opacity:0.6 }
.divider{ height:1px; background:#e0e0e0; margin:16px 0 }
</style>