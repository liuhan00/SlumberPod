// feedback API
const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.236.92:3003'

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
