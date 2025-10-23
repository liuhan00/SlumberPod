import { defineStore } from 'pinia'

export const useSleepStore = defineStore('sleep', {
  state: () => ({
    napTimerMin: 20,
    napStartTs: null,
    alarms: [ /* { id, hour, minute, enabled, label } */ ],
    reminder: { enabled: false, hour: 22, minute: 0, label: '睡前提醒' }
  }),
  actions: {
    startNap(minutes){ this.napTimerMin = minutes; this.napStartTs = Date.now() },
    stopNap(){ this.napStartTs = null },
    addAlarm(a){
      const id = `al_${Date.now()}`
      const alarm = { id, ...a }
      this.alarms.push(alarm)
      this.persist()
      return alarm
    },
    toggleAlarm(id){ const a=this.alarms.find(x=>x.id===id); if(a){ a.enabled=!a.enabled; this.persist() } },
    removeAlarm(id){ this.alarms = this.alarms.filter(x=>x.id!==id); this.persist() },
    setReminder(r){ this.reminder = { ...this.reminder, ...r }; this.persist() },
    persist(){
      try{ uni.setStorageSync('sleepStore', { alarms:this.alarms, reminder:this.reminder }) }catch(e){}
    },
    load(){
      try{ const s=uni.getStorageSync('sleepStore'); if(s){ this.alarms=s.alarms||[]; this.reminder=s.reminder||this.reminder } }catch(e){}
    }
  }
})
