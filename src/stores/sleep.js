import { defineStore } from 'pinia'
import { listAlarms, createAlarm, updateAlarm as updateAlarmApi, deleteAlarm as deleteAlarmApi } from '@/api/alarms'

export const useSleepStore = defineStore('sleep', {
  state: () => ({
    napTimerMin: 20,
    napStartTs: null,
    alarms: [],
    reminder: { enabled: false, hour: 22, minute: 0, label: '睡前提醒', ringtone: '蝶梦引', repeat: 'daily', volume: 0.7, vibrate: true },
    napReminder: { enabled: false, hour: 13, minute: 0, label: '小憩提醒', ringtone: '清晨', repeat: 'workdays', volume: 0.7, vibrate: false },
    ritualReminder: { enabled: false, hour: 21, minute: 0, label: '睡前仪式提醒', ringtone: '冥想', repeat: 'daily', volume: 0.5, vibrate: true }
  }),
  actions: {
    // temp/local ids look like "al_<timestamp>"
    _isTempId(id){
      return typeof id === 'string' && id.startsWith('al_')
    },
    startNap(minutes){ this.napTimerMin = minutes; this.napStartTs = Date.now() },
    stopNap(){ this.napStartTs = null },

    async fetchAlarmsFromServer(){
      try{
        const rows = await listAlarms()
        // Normalize server alarms to local schema
        this.alarms = (rows || []).map((r)=>{
          // alarm_time may be "HH:mm" or "HH:mm:ss"
          let hour = 7, minute = 30
          if (typeof r.alarm_time === 'string') {
            const parts = r.alarm_time.split(':')
            hour = Number(parts?.[0] ?? 7)
            minute = Number(parts?.[1] ?? 30)
          } else if (r.hour != null && r.minute != null) {
            hour = r.hour
            minute = r.minute
          }
          return {
            id: r.id || r.alarm_id || `al_${Date.now()}`,
            label: r.label || '闹钟',
            enabled: (r.enabled ?? r.is_enabled) != null ? Boolean(r.enabled ?? r.is_enabled) : true,
            hour,
            minute,
            // Keep both for compatibility
            repeat: r.repeat || 'daily',
            repeatDays: r.repeat_days || r.repeatDays || '',
            ringtone: r.ringtone || 'default',
            snooze: r.snooze_duration ?? r.snooze ?? 5,
            vibrate: (r.vibration ?? r.vibrate) != null ? Boolean(r.vibration ?? r.vibrate) : true,
            volume: typeof r.volume === 'number' ? (r.volume > 1 ? r.volume/100 : r.volume) : 0.8
          }
        })
        this.persist()
      }catch(e){
        // silent fail; keep local alarms
      }
    },

    async addAlarm(alarmInput){
      const id = `al_${Date.now()}`
      const alarm = { id, ringtone: '多普勒', enabled: true, label: '新闹钟', hour: 7, minute: 30, repeat: 'daily', volume: 0.8, vibrate: true, ...alarmInput }
      this.alarms.push(alarm)
      // Try create on server (best-effort)
      try{
        // Build server payload
        // server expects "HH:mm:ss"
        const hh = String(alarm.hour).padStart(2, '0')
        const mm = String(alarm.minute).padStart(2, '0')
        const payload = {
          label: alarm.label,
          alarm_time: `${hh}:${mm}:00`,
          // also send hour/min explicitly for backends that expect separate fields
          hour: Number.isFinite(Number(alarm.hour)) ? Number(alarm.hour) : undefined,
          minute: Number.isFinite(Number(alarm.minute)) ? Number(alarm.minute) : undefined,
          repeat_days: alarm.repeatDays || '1,2,3,4,5',
          snooze_duration: alarm.snooze ?? 5,
          vibration: !!alarm.vibrate,
          is_enabled: alarm.enabled ? 1 : 0,
          volume: Math.round((alarm.volume ?? 0.8) * 100)
        }
        const created = await createAlarm(payload)
        if(created?.id){
          const local = this.alarms.find(a=>a.id===id)
          if(local){ local.id = created.id } // sync id
        }else if(created?.alarm_id){
          const local = this.alarms.find(a=>a.id===id)
          if(local){ local.id = created.alarm_id }
        }
      }catch(e){ /* ignore network/auth errors */ }
      this.persist()
      return alarm
    },
    updateAlarm(id, updates){ 
      const alarm = this.alarms.find(x=>x.id===id); 
      if(alarm){ 
        // allow-list fields to avoid overwriting hour/min with invalid values
        const next = {}
        if (updates.label !== undefined) next.label = String(updates.label)
        if (updates.enabled !== undefined) next.enabled = !!updates.enabled
        if (updates.repeat !== undefined) next.repeat = updates.repeat
        if (updates.repeatDays !== undefined) next.repeatDays = updates.repeatDays
        if (updates.ringtone !== undefined) next.ringtone = updates.ringtone
        if (updates.snooze !== undefined) next.snooze = Number(updates.snooze)
        if (updates.vibrate !== undefined) next.vibrate = !!updates.vibrate
        if (updates.volume !== undefined) {
          const v = Number(updates.volume)
          if (Number.isFinite(v)) next.volume = Math.max(0, Math.min(1, v))
        }
        if (updates.hour !== undefined) {
          const h = Number(updates.hour)
          if (Number.isFinite(h)) next.hour = Math.max(0, Math.min(23, h))
        }
        if (updates.minute !== undefined) {
          const m = Number(updates.minute)
          if (Number.isFinite(m)) next.minute = Math.max(0, Math.min(59, m))
        }
        Object.assign(alarm, next); 
        this.persist()
        // best-effort sync
        try{
          if (this._isTempId(alarm.id)) { /* wait until server assigns id */ return }
          const hh = String(alarm.hour).padStart(2, '0')
          const mm = String(alarm.minute).padStart(2, '0')
          updateAlarmApi(alarm.id, {
            label: alarm.label,
            alarm_time: `${hh}:${mm}:00`,
            hour: Number.isFinite(Number(alarm.hour)) ? Number(alarm.hour) : undefined,
            minute: Number.isFinite(Number(alarm.minute)) ? Number(alarm.minute) : undefined,
            repeat_days: alarm.repeatDays || '1,2,3,4,5',
            snooze_duration: alarm.snooze ?? 5,
            vibration: !!alarm.vibrate,
            is_enabled: alarm.enabled ? 1 : 0,
            volume: Math.round((alarm.volume ?? 0.8) * 100)
          }).catch(()=>{})
        }catch(e){}
      }
    },
    toggleAlarm(id){ const a=this.alarms.find(x=>x.id===id); if(a){ const prev = a.enabled; a.enabled=!a.enabled; this.persist(); 
      // best-effort sync
      try{
        if (this._isTempId(a.id)) { /* wait until server assigns id */ return }
        const hh = String(a.hour).padStart(2, '0')
        const mm = String(a.minute).padStart(2, '0')
        updateAlarmApi(a.id, {
          label: a.label,
          alarm_time: `${hh}:${mm}:00`,
          hour: Number.isFinite(Number(a.hour)) ? Number(a.hour) : undefined,
          minute: Number.isFinite(Number(a.minute)) ? Number(a.minute) : undefined,
          repeat_days: a.repeatDays || '1,2,3,4,5',
          snooze_duration: a.snooze ?? 5,
          vibration: !!a.vibrate,
          is_enabled: a.enabled ? 1 : 0,
          volume: Math.round((a.volume ?? 0.8) * 100)
        }).catch(()=>{})
      }catch(e){}
      // if user turned alarm off and it's a wake alarm, open feedback page
      try{ if(prev && !a.enabled && /起床|起床闹钟|起床/.test(a.label || '')){ uni.navigateTo({ url:'/pages/feedback/Form' }) } }catch(e){} } },
    removeAlarm(id){ 
      const removed = this.alarms.find(x=>x.id===id)
      this.alarms = this.alarms.filter(x=>x.id!==id); 
      this.persist()
      // best-effort server delete
      try{ if(removed?.id && !this._isTempId(removed.id)) deleteAlarmApi(removed.id).catch(()=>{}) }catch(e){} 
    },
    setAlarmTime(id, { hour, minute }){ const a=this.alarms.find(x=>x.id===id); if(a){ 
      const h = Math.max(0, Math.min(23, Number(hour)))
      const m = Math.max(0, Math.min(59, Number(minute)))
      if (Number.isFinite(h)) a.hour = h
      if (Number.isFinite(m)) a.minute = m
      this.persist(); 
      // sync
      try{
        if (this._isTempId(a.id)) { /* wait until server assigns id */ return }
        const hh = String(a.hour).padStart(2, '0')
        const mm = String(a.minute).padStart(2, '0')
        updateAlarmApi(a.id, {
          label: a.label,
          alarm_time: `${hh}:${mm}:00`,
          hour: Number.isFinite(Number(a.hour)) ? Number(a.hour) : undefined,
          minute: Number.isFinite(Number(a.minute)) ? Number(a.minute) : undefined,
          repeat_days: a.repeatDays || '1,2,3,4,5',
          snooze_duration: a.snooze ?? 5,
          vibration: !!a.vibrate,
          is_enabled: a.enabled ? 1 : 0,
          volume: Math.round((a.volume ?? 0.8) * 100)
        }).catch(()=>{})
      }catch(e){} 
    } },
    setAlarmRingtone(id, name){ const a=this.alarms.find(x=>x.id===id); if(a){ a.ringtone=name; this.persist() } },
    setAlarmRepeat(id, repeat){ const a=this.alarms.find(x=>x.id===id); if(a){ a.repeat=repeat; this.persist() } },
    setAlarmVolume(id, v){ const a=this.alarms.find(x=>x.id===id); if(a){ a.volume=Math.max(0, Math.min(1, v)); this.persist(); 
      try{
        if (this._isTempId(a.id)) { /* wait until server assigns id */ return }
        const hh = String(a.hour).padStart(2, '0')
        const mm = String(a.minute).padStart(2, '0')
        updateAlarmApi(a.id, {
          label: a.label,
          alarm_time: `${hh}:${mm}:00`,
          hour: Number.isFinite(Number(a.hour)) ? Number(a.hour) : undefined,
          minute: Number.isFinite(Number(a.minute)) ? Number(a.minute) : undefined,
          repeat_days: a.repeatDays || '1,2,3,4,5',
          snooze_duration: a.snooze ?? 5,
          vibration: !!a.vibrate,
          is_enabled: a.enabled ? 1 : 0,
          volume: Math.round((a.volume ?? 0.8) * 100)
        }).catch(()=>{}) 
      }catch(e){} 
    } },
    setAlarmVibrate(id, flag){ const a=this.alarms.find(x=>x.id===id); if(a){ a.vibrate=!!flag; this.persist(); 
      try{
        if (this._isTempId(a.id)) { /* wait until server assigns id */ return }
        const hh = String(a.hour).padStart(2, '0')
        const mm = String(a.minute).padStart(2, '0')
        updateAlarmApi(a.id, {
          label: a.label,
          alarm_time: `${hh}:${mm}:00`,
          hour: Number.isFinite(Number(a.hour)) ? Number(a.hour) : undefined,
          minute: Number.isFinite(Number(a.minute)) ? Number(a.minute) : undefined,
          repeat_days: a.repeatDays || '1,2,3,4,5',
          snooze_duration: a.snooze ?? 5,
          vibration: !!a.vibrate,
          is_enabled: a.enabled ? 1 : 0,
          volume: Math.round((a.volume ?? 0.8) * 100)
        }).catch(()=>{}) 
      }catch(e){} 
    } },

    setReminder(r){ this.reminder = { ...this.reminder, ...r }; this.persist() },
    setReminderRepeat(repeat){ this.reminder = { ...this.reminder, repeat }; this.persist() },
    setReminderVolume(v){ this.reminder = { ...this.reminder, volume: Math.max(0, Math.min(1, v)) }; this.persist() },
    setReminderVibrate(flag){ this.reminder = { ...this.reminder, vibrate: !!flag }; this.persist() },
    setNapReminder(r){ this.napReminder = { ...this.napReminder, ...r }; this.persist() },
    setRitualReminder(r){ this.ritualReminder = { ...this.ritualReminder, ...r }; this.persist() },

    persist(){
      try{
        uni.setStorageSync('sleepStore', {
          alarms: this.alarms,
          reminder: this.reminder,
          napReminder: this.napReminder,
          ritualReminder: this.ritualReminder,
          napTimerMin: this.napTimerMin,
          napStartTs: this.napStartTs,
        })
      }catch(e){ /* ignore */ }
    },
    load(){
      try{
        const s = uni.getStorageSync('sleepStore')
        if(s && typeof s === 'object'){
          this.alarms = Array.isArray(s.alarms) ? s.alarms : []
          this.reminder = s.reminder || this.reminder
          this.napReminder = s.napReminder || this.napReminder
          this.ritualReminder = s.ritualReminder || this.ritualReminder
          this.napTimerMin = s.napTimerMin ?? this.napTimerMin
          this.napStartTs = s.napStartTs ?? this.napStartTs
        }
      }catch(e){ /* ignore */ }

      // Best effort: refresh from server after local load
      this.fetchAlarmsFromServer().catch(()=>{})
    }
  }
})
