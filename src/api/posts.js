import { getAuthLocal } from '@/store/auth'
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3003'

function buildHeaders(token){
  const headers = { 'Content-Type': 'application/json' }
  const t = token || getAuthLocal()?.token || getAuthLocal()?.access_token || null
  if(t) headers.Authorization = `Bearer ${t}`
  return headers
}

export async function createPost({ userId, title='', content='', imageUrls = [] }, token){
  const headers = buildHeaders(token)
  const res = await fetch(BASE + '/api/posts', {
    method: 'POST', headers, body: JSON.stringify({ userId, title, content, imageUrls })
  })
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || j.error || 'create post failed')
  return j
}

export async function getPosts({ page = 1, limit = 10 } = {}){
  const url = new URL(BASE + '/api/posts')
  url.searchParams.set('page', page)
  url.searchParams.set('limit', limit)
  const res = await fetch(url.toString(), { method: 'GET', headers: buildHeaders() })
  const j = await res.json()
  if(!res.ok) throw new Error(j.message || j.error || 'fetch posts failed')
  // expect j.data or j.posts
  return j
}
