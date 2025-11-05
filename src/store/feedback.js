import { ref } from 'vue'

const STORAGE_KEY = 'sleep_feedback_tasks'
const FEEDBACK_KEY = 'sleep_feedback_records'

function _getStorage(key){
  try{
    if(typeof uni !== 'undefined' && uni.getStorageSync) return uni.getStorageSync(key) || null
    if(typeof localStorage !== 'undefined') return localStorage.getItem(key)
  }catch(e){}
  return null
}
function _setStorage(key, val){
  try{
    if(typeof uni !== 'undefined' && uni.setStorageSync) return uni.setStorageSync(key, val)
    if(typeof localStorage !== 'undefined') return localStorage.setItem(key, val)
  }catch(e){}
}

export const scheduleFeedbackReminder = (timestamp) => {
  const raw = _getStorage(STORAGE_KEY) || '[]'
  const arr = JSON.parse(raw)
  const id = 'fb_' + Date.now()
  arr.push({ id, fireAt: timestamp, attempts:0, enabled:true })
  _setStorage(STORAGE_KEY, JSON.stringify(arr))
  // register local notification (platform-specific)
  try{ if (typeof uni !== 'undefined' && uni.requestPermission) uni.requestPermission() }catch(e){}
}

export const saveFeedback = async (payload) => {
  const raw = _getStorage(FEEDBACK_KEY) || '[]'
  const arr = JSON.parse(raw)
  arr.push(payload)
  _setStorage(FEEDBACK_KEY, JSON.stringify(arr))
  return true
}

export const getScheduled = () => {
  try{ return JSON.parse(_getStorage(STORAGE_KEY) || '[]') }catch(e){ return [] }
}
export const getFeedbacks = () => {
  try{ return JSON.parse(_getStorage(FEEDBACK_KEY) || '[]') }catch(e){ return [] }
}

// function to be called on app start to re-schedule local notifications
export const restoreScheduled = () => {
  const tasks = getScheduled()
  // no-op for now
}

// submitFeedback: try to POST to backend /api/feedback, fallback to local save
export const submitFeedback = async (payload) => {
  // attempt network submit if fetch available and BASE is configured
  try{
    const BASE = typeof process !== 'undefined' && process.env && process.env.VUE_APP_API_BASE ? process.env.VUE_APP_API_BASE : ''
    const url = (BASE ? BASE.replace(/\/$/, '') : '') + '/api/feedback'
    if(typeof fetch === 'function'){
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      if(res && res.ok){
        return true
      }
    }
  }catch(e){ /* ignore and fallback to local */ }
  // fallback: save locally
  return saveFeedback(payload)
}
