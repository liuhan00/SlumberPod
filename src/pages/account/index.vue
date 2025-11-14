<template>
  <view class="page" :style="bgStyle">
    <view class="top">
      <view class="back" @click="goBack">‹</view>
      <text class="title">账号资料</text>
    </view>

    <view class="avatar-wrap">
      <image class="avatar" :src="user.avatar" mode="cover" />
      <button class="camera-btn" @click="changeAvatar">
        <text class="camera-icon">📷</text>
      </button>
    </view>

    <!-- 原生日期选择器（隐藏） -->
    <picker mode="date" :value="birthdayValue" @change="onBirthdayChange" ref="birthdayPicker">
      <view style="display:none"></view>
    </picker>

    <scroll-view class="container" scroll-y>
      <view class="card">
        <view class="row">
          <text class="label">星眠坞ID</text>
          <text class="value">{{ user.userId }}</text>
        </view>

        <view class="row clickable" @click="editNickname">
          <text class="label">昵称</text>
          <view class="right">
            <text class="value">{{ user.nickname || '眠友9177' }}</text>
            <text class="arrow">›</text>
          </view>
        </view>

        <view class="row clickable" @click="editBio">
          <text class="label">简介</text>
          <text class="arrow">›</text>
        </view>

        <view class="row clickable" @click="editGender">
          <text class="label">性别</text>
          <view class="right">
            <text class="value">{{ user.gender || '未选择' }}</text>
            <text class="arrow">›</text>
          </view>
        </view>

        <view class="row clickable" @click="openBirthdayPicker">
          <text class="label">生日</text>
          <view class="right">
            <text class="value">{{ user.birthday || '未选择' }}</text>
            <text class="arrow">›</text>
          </view>
        </view>

    
      </view>

      <view class="card small">
        <view class="row clickable" @click="editPhone">
          <text class="label">手机号</text>
          <view class="right">
            <text class="value">{{ user.phone || '198****9177' }}</text>
            <text class="arrow">›</text>
          </view>
        </view>

        
      </view>

      <view style="height:60px"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { ref } from 'vue'
import { getPlaceholder } from '@/utils/image'

let bgStyle = {}
try{
  const themeApi = useGlobalTheme()
  bgStyle = themeApi?.bgStyle || {}
  console.log('[useGlobalTheme] bgStyle:', bgStyle)
}catch(e){ console.warn('useGlobalTheme failed', e); bgStyle = {} }

let userStore, user
try{
  userStore = useUserStore()
  ({ user } = storeToRefs(userStore))
}catch(e){ console.warn('useUserStore failed', e); user = ref({}) }

const birthdayValue = ref('1995-01-01')
const birthdayPicker = ref(null)

function onBirthdayChange(e){
  const val = e.detail.value
  user.value.birthday = val
  uni.showToast({ title:'生日已保存' })
}

function openBirthdayPicker(){
  try{ birthdayPicker.value?.$el?.open ? birthdayPicker.value.$el.open() : birthdayPicker.value && birthdayPicker.value.$el }catch(e){ }
  // 在小程序/uni-app中，建议直接触发 focus 或 click，但这里尽量保持兼容，使用 showModal 作为回退
  uni.showToast({ title:'使用顶部年份滚轮选择生日（平台特性）', icon:'none' })
}

if (!user.value || !user.value.userId) {
  user.value = {
    userId: '117820224',
    nickname: '眠友9177',
    avatar: getPlaceholder('avatar'),
    bio: '',
    gender: '',
    birthday: '',
    location: '',
    phone: '198****9177',
    background: getPlaceholder('banner')
  }
}

function goBack(){
  uni.navigateBack()
}
function changeAvatar(){
  uni.chooseImage({ count:1, sourceType:['album','camera'], success(res){ const temp = res.tempFilePaths[0]; user.value.avatar = temp; uni.showToast({ title:'头像已更新' }) }, fail(){ uni.showToast({ title:'取消', icon:'none' }) } })
}
function editNickname(){
  uni.showModal({ title:'修改昵称', editable:true, placeholderText:'请输入昵称', success(res){ if(res.confirm) user.value.nickname = res.content } })
}
function editBio(){
  uni.showModal({ title:'修改简介', editable:true, placeholderText:'请输入个人简介（1-50字）', success(res){ if(res.confirm && res.content){ user.value.bio = res.content; uni.showToast({ title:'简介已保存' }) } } })
}

function editGender(){
  uni.showActionSheet({ itemList:['男','女','保密','取消'], success(res){ if(res.tapIndex===3) return; const g=['男','女','保密']; user.value.gender = g[res.tapIndex]; uni.showToast({ title:'性别已更新' }) } })
}


function editLocation(){
  const provinces = ['北京市','天津市','河北省','山西省','内蒙古自治区','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','广西壮族自治区','海南省','重庆市','四川省','贵州省','云南省','西藏自治区','陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区']
  uni.showModal({ title:'请选择', cancelText:'取消', confirmText:'确定', editable:false, content:'', success(res){ /* 由于uni.showModal不支持列表, 使用 ActionSheet 更合适 */ } })
  uni.showActionSheet({ itemList: provinces, success(res){ const sel = provinces[res.tapIndex]; if(sel){ user.value.location = sel; uni.showToast({ title:'已选择 ' + sel }) } }, fail(){ /* no-op */ } })
}

function editBackground(){
  uni.showToast({ title:'更换背景功能开发中', icon:'none' })
}

function editPhone(){
  uni.showModal({ title:'修改手机号', editable:true, placeholderText:'请输入手机号', success(res){ if(res.confirm && res.content){ user.value.phone = res.content; uni.showToast({ title:'手机号已更新' }) } } })
}

// picker refs for uni-app H5 compatibility
const refs = { birthdayPicker }
</script>

<style scoped>
.page{ background:var(--bg-color, #0f0f10); background-image: var(--bg-gradient, none); background-repeat: no-repeat; background-size: 100% 100%; min-height:100vh; color:var(--text-color, #fff); display:flex; flex-direction:column }
.top{ height:56px; display:flex; align-items:center; justify-content:center; position:relative; padding-top: env(safe-area-inset-top); }
.back{ position:absolute; left:14px; top:calc(14px + env(safe-area-inset-top)); font-size:26px; color:var(--fg) }
.title{ font-size:20px; font-weight:700; color:var(--fg) }

.avatar-wrap{ display:flex; justify-content:center; align-items:center; margin:12px 0; position:relative }
.avatar{ width:22vw; height:22vw; max-width:140px; max-height:140px; min-width:88px; min-height:88px; border-radius:50%; border:calc(0.02 * 100vw) solid rgba(255,255,255,0.06); box-shadow:0 8px 20px rgba(0,0,0,0.6); object-fit:cover }
.camera-btn{ position:absolute; right:calc(50% - (22vw)/2 + 12px); bottom:6px; background:linear-gradient(180deg,#444,#222); width:10vw; max-width:44px; height:10vw; max-height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid var(--bg-color, #0f0f10); padding:0 }
.camera-icon{ color:var(--fg); font-size:16px }

.container{ padding:18px; flex:1; overflow:hidden }
scroll-view.container{ flex:1 }
.card{ background:var(--card-bg, rgba(28,28,30,0.9)); border-radius:12px; padding:12px; margin-bottom:12px; box-shadow:0 6px 18px rgba(0,0,0,0.6) }
.card.small{ padding-top:8px }
.row{ display:flex; align-items:center; justify-content:space-between; padding:14px 6px; border-bottom:1px solid rgba(255,255,255,0.03) }
.row:last-child{ border-bottom:none }
.label{ color:var(--muted); font-size:4.2vw; max-font-size:16px }
.value{ color:var(--fg); font-size:4.2vw; max-font-size:16px }
.clickable{ cursor:pointer }
.arrow{ color:#8e8e93; margin-left:8px }
.right{ display:flex; align-items:center; gap:10px }
.bg-thumb{ width:22vw; max-width:80px; height:calc(22vw * 0.65); border-radius:6px }

/* safe area bottom padding */
.page::after{ content:''; height:env(safe-area-inset-bottom); display:block }

@media (min-width:420px){
  .avatar{ max-width:140px }
  .camera{ max-width:44px; max-height:44px }
  .label, .value{ font-size:16px }
}

</style>