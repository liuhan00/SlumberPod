<script setup>
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { useGlobalTheme } from '@/composables/useGlobalTheme'
import { ref } from 'vue'
import { getPlaceholder } from '@/utils/image'
// 导入上传头像的API
import { uploadAvatar } from '@/api/users'
import { logout } from '@/api/auth'
import { setAuthLocal } from '@/store/auth'

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

function maskedPhone(phone){
  if(!phone) return '未绑定'
  const s = String(phone)
  if(s.length>=7) return s.slice(0,3) + '****' + s.slice(-4)
  return s
}

function onBirthdayChange(e){
  const val = e.detail.value
  user.value.birthday = val
  uni.showToast({ title:'生日已保存' })
}

function openBirthdayPicker(){
  try{ birthdayPicker.value?.$el?.open ? birthdayPicker.value.$el.open() : birthdayPicker.value && birthdayPicker.value.$el }catch(e){ }
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
    phone: '19800009177',
    background: getPlaceholder('banner')
  }
}

function goBack(){
  uni.navigateBack()
}

// 修改changeAvatar函数，实现真正的上传功能
function changeAvatar(){
  console.log('[Profile Account] changeAvatar called')
  uni.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      console.log('[Profile Account] Image selected:', tempFilePath)
      try {
        // 调用上传接口
        console.log('[Profile Account] Calling uploadAvatar API')
        const result = await uploadAvatar(tempFilePath)
        console.log('[Profile Account] Upload result:', result)
        
        // 从响应中提取头像URL
        const avatarUrl = result.data?.avatar_url || result.avatar_url || result.url || result.data?.url || tempFilePath
        
        // 更新用户头像
        user.value.avatar = avatarUrl
        
        // 更新全局用户状态
        if (userStore) {
          userStore.updateAvatar(avatarUrl)
        }
        
        // 更新本地存储的认证信息
        const auth = uni.getStorageSync('auth')
        if (auth) {
          // 更新认证对象中的用户信息
          if (auth.user) {
            auth.user.avatar = avatarUrl
          } else if (auth.user_metadata) {
            auth.user_metadata.avatar = avatarUrl
          }
          // 保存更新后的认证信息
          setAuthLocal(auth)
        }
        
        uni.showToast({ title: '头像上传成功' })
      } catch (err) {
        console.error('[Profile Account] 上传头像失败:', err)
        uni.showToast({ 
          title: '上传失败: ' + (err.message || '未知错误'), 
          icon: 'none',
          duration: 3000
        })
      }
    },
    fail: () => {
      uni.showToast({ title: '取消上传', icon: 'none' })
    }
  })
}

function editNickname(){
  uni.showModal({ title:'修改昵称', editable:true, placeholderText:'请输入昵称', success(res){ if(res.confirm) user.value.nickname = res.content } })
}

function editBio(){
  uni.showModal({ title:'修改简介', editable:true, placeholderText:'请输入个人简介（1-50字）', success(res){ if(res.confirm && res.content){ user.value.bio = res.content; uni.showToast({ title:'简介已保存' }) } } })
}

function editGender(){
  // 去掉"保密"选项，避免重复取消按钮
  uni.showActionSheet({ itemList:['男','女'], success(res){ if(res.tapIndex < 0) return; const g=['男','女']; user.value.gender = g[res.tapIndex]; uni.showToast({ title:'性别已更新' }) } })
}

function editLocation(){
  const provinces = ['北京市','天津市','河北省','山西省','内蒙古自治区','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','广西壮族自治区','海南省','重庆市','四川省','贵州省','云南省','西藏自治区','陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区']
  uni.showActionSheet({ itemList: provinces, success(res){ const sel = provinces[res.tapIndex]; if(sel){ user.value.location = sel; uni.showToast({ title:'已选择 ' + sel }) } }, fail(){ } })
}

function editBackground(){
  uni.chooseImage({ count:1, success(res){ const temp = res.tempFilePaths[0]; user.value.background = temp; uni.showToast({ title:'背景已更新' }) } })
}

function editPhone(){
  uni.showModal({ title:'修改手机号', editable:true, placeholderText:'请输入手机号', success(res){ if(res.confirm && res.content){ user.value.phone = res.content; uni.showToast({ title:'手机号已更新' }) } } })
}

function openThirdParty(){
  uni.showToast({ title:'第三方绑定设置', icon:'none' })
}

// 完善退出登录逻辑
async function logoutHandler(){
  uni.showModal({ 
    title:'退出登录', 
    content:'确定要退出当前账号吗？', 
    success: async (res) => { 
      if(res.confirm){ 
        try {
          // 调用登出API
          await logout()
          // 清除用户状态
          user.value = {}
          // 跳转到登录页面
          uni.reLaunch({ url:'/pages/auth/Login' })
        } catch (e) {
          console.error('Logout error:', e)
          uni.showToast({ title: '退出登录失败', icon: 'none' })
        }
      } 
    } 
  })
}

// 删除注销账号函数

// picker refs for uni-app H5 compatibility
const refs = { birthdayPicker }
</script>

<template>
  <view class="page" :style="bgStyle">
    <view class="top">
      <view class="back" @click="goBack">‹</view>
      <text class="title">账号资料</text>
    </view>

    <view class="avatar-wrap">
      <image class="avatar" :src="user.avatar" mode="cover" />
      <button class="camera-btn" @click="changeAvatar">
        <text class="camera-icon">📸</text>
      </button>
    </view>

    <scroll-view class="container" scroll-y>
      <view class="card">
        <view class="row clickable" @click="editNickname">
          <text class="label">昵称</text>
          <view class="right">
            <text class="value">{{ user.nickname || '眠友9177' }}</text>
            <text class="arrow">›</text>
          </view>
        </view>

        <view class="row clickable" @click="editBio">
          <text class="label">简介</text>
          <view class="right">
            <text class="value">{{ user.bio || '未填写' }}</text>
            <text class="arrow">›</text>
          </view>
        </view>

        <view class="row clickable" @click="editGender">
          <text class="label">性别</text>
          <view class="right">
            <text class="value">{{ user.gender || '未选择' }}</text>
            <text class="arrow">›</text>
          </view>
        </view>

        <!-- 生日放在同一卡片下，使用 picker 包裹行以在小程序上展示原生滚轮 -->
        <picker mode="date" :value="birthdayValue" @change="onBirthdayChange">
          <view class="row clickable">
            <text class="label">生日</text>
            <view class="right">
              <text class="value">{{ user.birthday || '未选择' }}</text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>
      </view>

      <!-- 注：已删除手机号/第三方应用卡片 -->

      <view class="actions-block">
        <button class="btn logout" @click="logoutHandler">退出登录</button>
        <!-- 已删除注销账号按钮 -->
      </view>

    </scroll-view>
  </view>
</template>

<style scoped>
.page{ background:var(--bg-color, #0b0b0d); background-image: var(--bg-gradient, none); background-repeat: no-repeat; background-size: 100% 100%; min-height:100vh; color:var(--text-color, #fff); display:flex; flex-direction:column }
.top{ height:56px; display:flex; align-items:center; justify-content:center; position:relative; padding-top: env(safe-area-inset-top); }
.back{ position:absolute; left:14px; top:calc(12px + env(safe-area-inset-top)); font-size:22px; color:var(--fg) }
.title{ font-size:18px; font-weight:700; color:var(--fg) }

.avatar-wrap{ display:flex; justify-content:center; align-items:center; margin:16px 0; position:relative }
.avatar{ width:26vw; height:26vw; max-width:140px; max-height:140px; min-width:90px; min-height:90px; border-radius:50%; border:4px solid rgba(255,255,255,0.04); box-shadow:0 10px 30px rgba(0,0,0,0.7); object-fit:cover }
.camera-btn{ position:absolute; right:calc(50% - (26vw)/2 + 10px); bottom:6px; background:linear-gradient(180deg,#444,#222); width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; color:var(--fg); border:3px solid var(--bg-color, #0b0b0d); padding:0; box-sizing: border-box; }
.camera-icon{ color:var(--fg); font-size:24px; line-height: 1; }

.container{ padding:18px; flex:1; overflow:hidden }
scroll-view.container{ flex:1 }
.card{ background:rgba(255,255,255,0.02); border-radius:12px; padding:12px; margin-bottom:12px; box-shadow:0 8px 20px rgba(0,0,0,0.6) }
.card.small{ padding-top:8px }
.row{ display:flex; align-items:center; justify-content:space-between; padding:14px 6px; border-bottom:1px solid rgba(255,255,255,0.03) }
.row:last-child{ border-bottom:none }
.label{ color:var(--muted); font-size:14px }
.value{ color:var(--fg); font-size:14px }
.clickable{ cursor:pointer }
.arrow{ color:#8e8e93; margin-left:8px }
.right{ display:flex; align-items:center; gap:10px }
.bg-thumb{ width:22vw; max-width:80px; height:calc(22vw * 0.65); border-radius:6px }

.actions-block{ padding:0 18px; display:flex; flex-direction:column; gap:12px }
.btn{ padding:14px 12px; border-radius:10px; border:none; font-weight:600; width: calc(100% - 36px); margin-left: 18px; margin-right: 18px; }
.btn.logout{ background: #ADD8E6; color: #000000; }

/* safe area bottom padding */
.page::after{ content:''; height:env(safe-area-inset-bottom); display:block }

@media (min-width:420px){
  .avatar{ max-width:140px }
  .camera{ max-width:44px; max-height:44px }
  .label, .value{ font-size:16px }
}
</style>