import { defineStore } from 'pinia'
import { getPlaceholder } from '@/utils/image'
import { setAuthLocal, getAuthLocal } from '@/store/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null,
    nickname: '睡眠爱好者',
    avatar: getPlaceholder('avatar'),
    bio: '',
    gender: '',
    birthday: '',
    location: '',
    phone: '',
    vip: false,
    stats: {
      totalSleepHours: 128,
      totalSessions: 42,
      favoriteCategory: '自然',
    }
  }),
  actions: {
    toggleVip(){ this.vip = !this.vip },
    updateNickname(n){ this.nickname = n },
    updateAvatar(url){ 
      this.avatar = url 
      // 同步更新本地存储的认证信息
      try {
        const auth = getAuthLocal()
        if (auth) {
          // 更新认证对象中的用户信息
          if (auth.user) {
            auth.user.avatar = url
          } else if (auth.user_metadata) {
            auth.user_metadata.avatar = url
          } else {
            // 如果没有user或user_metadata字段，直接在auth对象上设置avatar
            auth.avatar = url
          }
          // 保存更新后的认证信息
          setAuthLocal(auth)
        }
      } catch (e) {
        console.error('[UserStore] updateAvatar error:', e)
      }
    },
    updateBio(bio){ 
      this.bio = bio 
      this.syncAuthInfo('bio', bio)
    },
    updateGender(gender){ 
      this.gender = gender 
      this.syncAuthInfo('gender', gender)
    },
    updateBirthday(birthday){ 
      this.birthday = birthday 
      this.syncAuthInfo('birthday', birthday)
    },
    updateLocation(location){ 
      this.location = location 
      this.syncAuthInfo('location', location)
    },
    updatePhone(phone){ 
      this.phone = phone 
      this.syncAuthInfo('phone', phone)
    },
    syncAuthInfo(field, value){
      try{
        const auth = getAuthLocal()
        if(!auth) return
        if(auth.user) auth.user[field] = value
        else if(auth.user_metadata) auth.user_metadata[field] = value
        else auth[field] = value
        setAuthLocal(auth)
      }catch(e){ console.warn('[UserStore] syncAuthInfo error:', e) }
    },
    updateUser(userData){
      Object.keys(userData).forEach(key => {
        this.syncAuthInfo(key, userData[key])
      })
    },
    applyAuth(user){
      try {
        if(!user) { 
          this.userId = null; 
          this.nickname = '睡眠爱好者'; 
          this.avatar = getPlaceholder('avatar'); 
          return 
        }
        
        // 处理后端返回的包装结构 {success: true, data: {...}, message: "..."}
        const userData = user.data || user
        
        this.userId = userData.id || userData.user_id || userData.uid || userData.sub || userData.openid || null
        this.nickname = userData.nickname || userData.user_metadata?.name || userData.name || userData.email || this.nickname
        this.bio = userData.bio || userData.user_metadata?.bio || ''
        this.gender = userData.gender !== undefined ? userData.gender : (userData.user_metadata?.gender || '')
        this.birthday = userData.birthday || userData.user_metadata?.birthday || ''
        this.location = userData.location || userData.user_metadata?.location || ''
        this.phone = userData.phone || userData.user_metadata?.phone || ''
        // 使用avatar_url字段作为头像URL
        this.avatar = userData.avatar_url || userData.user_metadata?.avatar || userData.avatar || getPlaceholder('avatar')
      } catch (e) {
        console.error('[UserStore] applyAuth error:', e)
        this.userId = null
        this.nickname = '睡眠爱好者'
        this.avatar = getPlaceholder('avatar')
        this.bio = ''
        this.gender = ''
        this.birthday = ''
        this.location = ''
        this.phone = ''
      }
    }
  }
})