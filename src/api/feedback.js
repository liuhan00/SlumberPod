import { BASE } from './index'

// If you don't have a central BASE export, use import.meta.env.VITE_API_BASE
const API_BASE = typeof BASE !== 'undefined' ? BASE : (import.meta.env.VITE_API_BASE || 'http://192.168.163.92:3003')

export async function sendFeedback(payload, token){
  const headers = { 'Content-Type':'application/json' }
  if(token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(API_BASE + '/api/sleep/records', {
    method: 'POST', headers, body: JSON.stringify(payload)
  })
  const j = await res.json()
  if(!res.ok) throw new Error(j.error || 'send feedback failed')
  return j
}
