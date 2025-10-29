import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3003'

function buildHeaders(){
  const auth = getAuthLocal()
  const t = auth?.token || auth?.access_token || null
  const headers = {}
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

export async function getAudios({ category_id = null, limit = 20 } = {}){
  const url = new URL(BASE + '/api/audios')
  if(category_id) url.searchParams.set('category_id', category_id)
  url.searchParams.set('limit', String(limit))
  const res = await fetch(url.toString(), { method: 'GET', headers: buildHeaders() })
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || j.error || 'fetch audios failed')
  return j
}
