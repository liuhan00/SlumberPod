require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const PORT = process.env.PORT || 3003

if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY){
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const app = express()
// 动态放行本地 Vite 端口（5173/5174/5175/5176 等）以及无 Origin 的请求（如 curl）
app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (curl) and same-origin
    if (!origin) return callback(null, true)
    // allow local dev servers on localhost and 127.0.0.1 (any port)
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || origin.startsWith('http://localhost') ) return callback(null, true)
    // you can add other allowed origins here, e.g. production host
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
// 显式处理预检请求（解决 No 'Access-Control-Allow-Origin' 问题）
app.options('*', cors())
app.use(bodyParser.json())

// Register: create user via Supabase Admin (service role)
app.post('/api/auth/register', async (req, res) => {
  let { name, identifier, password } = req.body
  if(!identifier || !password) return res.status(400).json({ error: 'identifier and password required' })
  // 后端兜底清洗：去掉 mailto: 等 scheme 前缀，去除首尾空白
  if (typeof identifier === 'string') {
    identifier = identifier.trim()
    // 去掉 mailto: 或其他类似的 scheme (如 tel:)，只保留实际值
    const schemeMatch = identifier.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):(.+)$/)
    if (schemeMatch) {
      identifier = schemeMatch[2]
    }
  }

  try{
    // 创建 auth 用户
    // 支持邮箱或手机号作为 identifier：如果包含 @ 则当作 email，否则当作 phone
    // 构造创建参数：邮箱或手机号。邮箱不再传 email_confirm 以避免 500 unexpected_failure
    let createPayload
    if (identifier && identifier.includes('@')) {
      createPayload = { email: identifier, password }
    } else {
      // 如果你未启用手机号登录，请改用邮箱注册
      // 为避免被当作邮箱校验失败，直接返回提示
      return res.status(400).json({ error: '请输入有效邮箱；如需手机号注册，请先在 Supabase 控制台启用 Phone provider 并使用 +86 格式' })
      // 手机号必须是 E.164（例如 +86138xxxx）。简单校验，不符合直接返回提示
      if (!/^\+\d{6,}$/.test(identifier)) {
        return res.status(400).json({ error: 'Invalid phone format. Use E.164 like +86138xxxx' })
      }
      createPayload = { phone: identifier, password }
    }

    let { data, error } = await adminClient.auth.admin.createUser(createPayload)

    // 如果返回 500 unexpected_failure，尝试一次回退：去掉所有可选参数最小化重试
    if (error && error.status === 500) {
      console.warn('createUser unexpected_failure, retrying with minimal payload')
      try {
        const minimalPayload = createPayload.email ? { email: createPayload.email, password } : { phone: createPayload.phone, password }
        const retry = await adminClient.auth.admin.createUser(minimalPayload)
        data = retry.data
        error = retry.error
      } catch (re) {
        console.warn('createUser retry threw:', re)
      }
    }
    // 如果依然返回 500 或有 error，则在控制台打印更详细信息（包含 raw）以便诊断
    if (error) {
      console.error('createUser final error detail (raw):', error)
    }

    // 详细日志，便于诊断
    console.log('createUser result data:', data)
    console.log('createUser result error:', error && (typeof error === 'object' ? JSON.stringify(error) : error))

    if(error) {
      console.error('Supabase admin createUser error (full):', error)
      // 如果是 500 unexpected_failure，记录并继续使用公共 signUp 作为后备（anon key）
      try {
        if (createPayload.email) {
          const pub = await publicClient.auth.signUp({ email: createPayload.email, password })
          if (pub.error) {
            console.error('Public signUp error:', pub.error)
            // 返回更详细的错误用于前端调试（500 表示服务器端/数据库错误）
            return res.status(500).json({ error: pub.error.message || 'signUp failed', raw: pub.error })
          }
          data = { user: pub.data.user }
          console.log('Public signUp success for:', pub.data.user?.email)
        } else if (createPayload.phone) {
          const pub = await publicClient.auth.signUp({ phone: createPayload.phone, password })
          if (pub.error) {
            console.error('Public signUp error:', pub.error)
            // 返回更详细的错误用于前端调试（500 表示服务器端/数据库错误）
            return res.status(500).json({ error: pub.error.message || 'signUp failed', raw: pub.error })
          }
          data = { user: pub.data.user }
          console.log('Public signUp success for phone:', pub.data.user?.phone)
        }
      } catch (se) {
        console.error('Fallback signUp threw:', se)
        return res.status(400).json({ error: error.message || 'Database error creating new user', raw: error })
      }
    }

    if (!data || !data.user) {
      console.error('Supabase createUser returned no user data')
      return res.status(500).json({ error: 'User creation failed: no user data returned' })
    }

    const userId = data.user.id
    const userEmail = data.user.email
    const username = name || (identifier && identifier.split('@')[0]) || userId

    // 生成JWT token
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' })

    // (已注释) 尝试写入业务表 profiles 的逻辑会触发 Supabase 数据库端的 trigger/constraint，
    // 在某些项目配置下会导致 500 unexpected_failure。因此为了调试注册流程，
    // 暂时跳过 profiles 插入。请在确认数据库 trigger/约束后恢复此逻辑。
    /*
    try {
      const insertResp = await adminClient.from('profiles').insert({ id: userId, username: username, full_name: username })
      console.log('profiles insert response:', insertResp)
      if (insertResp.error) {
        // 写入失败时记录但不阻止注册返回（注册已经在 auth 成功）
        console.warn('profiles insert error (non-fatal):', insertResp.error)
      }
    } catch (ie) {
      console.warn('profiles insert threw error (non-fatal):', ie)
    }
    */

    console.log('Registration successful for:', userEmail)

    return res.json({ 
      ok: true, 
      user: { id: userId, email: userEmail, name: username }, 
      token: token
    })

  } catch(e) {
    console.error('Registration error:', e)
    return res.status(500).json({ error: 'Registration failed: ' + (e.message || 'Unknown error') })
  }
})

// Login: verify via supabase auth admin signIn? We'll use verify by calling verify password via RPC: use admin API to generate OTP? Simpler: use Supabase REST auth endpoint via supabase-js signInWithPassword but with service role key.
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body
  if(!identifier || !password) return res.status(400).json({ error: 'identifier and password required' })
  try{
    // signInWithPassword using service role key
    const resp = await adminClient.auth.signInWithPassword({ email: identifier, password })
    if(resp.error) return res.status(400).json({ error: resp.error.message })
    const user = resp.data.user
    const session = resp.data.session
    // issue backend JWT
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({ ok:true, user, session, token })
  }catch(e){ console.error(e); return res.status(500).json({ error: e.message }) }
})

// Get current user by backend token
app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization
  if(!authHeader) return res.status(401).json({ error: 'missing auth header' })
  const parts = authHeader.split(' ')
  if(parts.length !== 2) return res.status(401).json({ error: 'invalid auth header' })
  const token = parts[1]
  try{
    const payload = jwt.verify(token, JWT_SECRET)
    const userId = payload.sub
    const { data, error } = await adminClient.auth.admin.getUserById(userId)
    if(error) return res.status(400).json({ error: error.message })
    return res.json({ ok:true, user: data.user })
  }catch(e){ return res.status(401).json({ error: 'invalid token' }) }
})

app.listen(PORT, ()=> console.log('Server listening on', PORT))
