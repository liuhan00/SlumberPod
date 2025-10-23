import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: 'u1',
    nickname: '睡眠爱好者',
    avatar: 'https://picsum.photos/seed/avatar/200',
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
    updateAvatar(url){ this.avatar = url }
  }
})
