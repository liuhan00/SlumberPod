// 确保 polyfill 最先执行
import './polyfill'

// uni-app 入口文件
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
// removed supabase usage — project doesn't use supabase in frontend
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
      // 忽略特定的后台获取数据错误，这是微信小程序框架的问题
      if (typeof msg === 'string' && (msg.includes('private_getBackgroundFetchData') || msg.includes('saaa_config.json') || msg.includes('backgroundfetch') || msg.includes('n is not a function'))) {
        console.warn('Ignored WeChat framework error:', msg);
        return true; // 阻止错误继续传播
      }
      
      try{ console.error('Global onerror captured:', { msg, url, line, col, error }); }catch(e){}
      if(typeof origOnError === 'function'){
        try{ return origOnError.apply(this, arguments) }catch(e){}
      }
    }
    
    // 添加未处理的 Promise rejection 监听器
    const origOnUnhandledRejection = globalThis.onunhandledrejection
    globalThis.onunhandledrejection = function(event) {
      // 忽略特定的后台获取数据错误
      if (event && event.reason) {
        const reasonStr = typeof event.reason === 'string' ? event.reason : JSON.stringify(event.reason);
        if (reasonStr.includes('private_getBackgroundFetchData') || reasonStr.includes('saaa_config.json') || reasonStr.includes('backgroundfetch') || reasonStr.includes('n is not a function')) {
          console.warn('Ignored WeChat framework promise rejection:', reasonStr);
          event.preventDefault(); // 阻止错误继续传播
          return true;
        }
      }
      
      if(typeof origOnUnhandledRejection === 'function'){
        try{ return origOnUnhandledRejection.apply(this, arguments) }catch(e){}
      }
    }
    
    // 尝试覆盖 console.error 来屏蔽特定的错误信息
    const origConsoleError = console.error;
    console.error = function() {
      // 检查参数中是否包含我们要忽略的错误信息
      const args = Array.from(arguments);
      const shouldIgnore = args.some(arg => {
        if (typeof arg === 'string') {
          return arg.includes('private_getBackgroundFetchData') || 
                 arg.includes('saaa_config.json') || 
                 arg.includes('backgroundfetch') ||
                 arg.includes('wxapplib') ||
                 arg.includes('n is not a function');
        }
        if (typeof arg === 'object' && arg !== null) {
          const str = JSON.stringify(arg);
          return str.includes('private_getBackgroundFetchData') || 
                 str.includes('saaa_config.json') || 
                 str.includes('backgroundfetch') ||
                 str.includes('wxapplib') ||
                 str.includes('n is not a function');
        }
        return false;
      });
      
      if (shouldIgnore) {
        console.warn('Ignored WeChat framework console error:', ...args);
        return;
      }
      
      // 正常输出错误信息
      origConsoleError.apply(console, arguments);
    };
  }catch(e){ console.warn('安装全局错误处理失败', e) }
}


export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // supabase removed — no runtime initialization
  return {
    app
  }
}