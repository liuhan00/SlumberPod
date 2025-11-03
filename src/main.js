// 确保 polyfill 最先执行
import './polyfill'

// uni-app 入口文件
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'
import { createClient } from '@supabase/supabase-js'
import { applySession } from './store/auth'

// add debug to ensure main.js executed
console.log('main.js loaded')

// 诊断日志：记录原生 bind 状态并安装全局未捕获错误钩子以捕获初始化阶段的异常堆栈。
try{
  console.log('typeof Function.prototype.bind =', typeof Function.prototype.bind)
  console.log('Function.prototype.bind exists =', !!Function.prototype.bind)
} catch(e){ console.warn('检测 bind 状态失败', e) }

// uni 环境下的全局错误捕获（尽量无侵入）
if (typeof globalThis !== 'undefined'){
  try{
    // 兼容 uni 小程序 runtime
    const origOnError = globalThis.onerror
    globalThis.onerror = function(msg, url, line, col, error){
      try{ console.error('Global onerror captured:', { msg, url, line, col, error }); }catch(e){}
      if(typeof origOnError === 'function'){
        try{ return origOnError.apply(this, arguments) }catch(e){}
      }
    }
  }catch(e){ console.warn('安装全局 onerror 失败', e) }
}


export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // initialize supabase client and attach to globalProperties for easy access
  try{
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    app.config.globalProperties.$supabase = supabase

    // try to restore session on app start
    supabase.auth.getSession().then(({ data }) => {
      const session = data && data.session
      if(session){
        applySession({ user: session.user, access_token: session.access_token })
        try{ import('./stores/user.js').then(m=>{ const store = m.useUserStore(); store.applyAuth(session.user) }).catch(()=>{}) }catch(e){}
      }
      // subscribe to auth changes to keep local storage updated
      supabase.auth.onAuthStateChange((event, sess)=>{
        if(sess && sess.access_token){ applySession({ user: sess.user, access_token: sess.access_token }); import('./stores/user.js').then(m=>{ m.useUserStore().applyAuth(sess.user) }).catch(()=>{}) }
        if(event === 'SIGNED_OUT'){ applySession(null); import('./stores/user.js').then(m=>{ m.useUserStore().applyAuth(null) }).catch(()=>{}) }
      })
    }).catch(e=>{ console.warn('supabase session restore failed', e) })

  }catch(e){ console.warn('supabase init failed', e) }

  return {
    app
  }
}
