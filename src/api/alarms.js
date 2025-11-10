import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env?.VITE_API_BASE || process.env?.VITE_API_BASE || 'http://192.168.43.89:3003'

function buildHeaders(){
  const auth = getAuthLocal && getAuthLocal()
  const t = auth?.token || auth?.access_token || null
  const headers = { 'Content-Type': 'application/json' }
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

function uniFetch({ method, path, data }){
  const url = `${BASE}${path}`
  return new Promise((resolve, reject)=>{
    uni.request({
      url,
      method,
      data,
      header: buildHeaders(),
      success: (res)=>{
        const { statusCode, data } = res
        if(statusCode === 401) return reject(new Error('AUTH_TOKEN_REQUIRED'))
        if(statusCode >= 200 && statusCode < 300){
          resolve(data)
        }else{
          reject(new Error((data && (data.message || data.error)) || `request failed ${statusCode}`))
        }
      },
      fail: (err)=> reject(err)
    })
  })
}

export async function listAlarms(){
  const j = await uniFetch({ method: 'GET', path: '/api/alarms' })
  return j?.data || j || []
}

export async function createAlarm(payload){
  const j = await uniFetch({ method: 'POST', path: '/api/alarms', data: payload })
  return j?.data || j || {}
}

export async function updateAlarm(id, payload){
  if(!id) throw new Error('alarm id required')
  const j = await uniFetch({ method: 'PUT', path: `/api/alarms/${id}`, data: payload })
  return j?.data || j || {}
}

export async function deleteAlarm(id){
  if(!id) throw new Error('alarm id required')
  const j = await uniFetch({ method: 'DELETE', path: `/api/alarms/${id}` })
  return j?.data || j || { success: true }
}


