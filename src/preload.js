// preload.js - minimal runtime shims to ensure fetch/Headers/Request/Response exist in MP runtime
// 立即执行，确保在任何代码运行前修复 bind 方法 - 完全独立版本
(function(){
  'use strict';
  
  // 立即检查并修复 Function.prototype.bind - 不使用任何外部依赖
  // 使用更简单、更早的修复方案
  if (typeof Function.prototype.bind === 'undefined' || !Function.prototype.bind) {
    console.log('[preload] Function.prototype.bind is undefined, applying fix...');
    // 使用最简化的实现，避免任何可能的依赖问题
    Function.prototype.bind = function(thisArg) {
      var fn = this;
      return function() {
        return fn.apply(thisArg, arguments);
      };
    };
    console.log('[preload] Function.prototype.bind fix applied');
  }
  
  // 现在可以安全地使用 bind 方法了
  var g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : global);
  
  // 简化的 fetch 实现，避免复杂依赖
  if (!g.fetch || typeof g.fetch !== 'function'){
    g.fetch = function(url, options = {}){
      return new Promise((resolve, reject)=>{
        try{
          const method = (options.method || 'GET').toUpperCase();
          const headers = options.headers || {};
          const data = options.body || options.data;
          if (typeof uni !== 'undefined' && uni.request){
            uni.request({ url: String(url), method, header: headers, data,
              success(res){
                const response = {
                  ok: res.statusCode >= 200 && res.statusCode < 300,
                  status: res.statusCode,
                  statusText: String(res.errMsg || ''),
                  headers: { get(name){ return headers[name] || res.header && res.header[name]; } },
                  text(){ return Promise.resolve(typeof res.data === 'string' ? res.data : JSON.stringify(res.data)); },
                  json(){ return Promise.resolve(res.data); },
                  blob(){ return Promise.reject(new Error('blob not supported')); }
                };
                resolve(response);
              },
              fail(err){ reject(err); }
            });
          } else {
            reject(new Error('no uni.request available'));
          }
        }catch(e){ reject(e); }
      });
    };
  }
  
  if (!g.Headers){ g.Headers = function(init){ this._map = init || {}; }; g.Headers.prototype.get = function(k){ return this._map[k]; }; }
  if (!g.Request){ g.Request = function(input, init){ this.url = input; this.method = init && init.method || 'GET'; this.headers = init && init.headers || {}; }; }
  if (!g.Response){ g.Response = function(body, init){ this._body = body; this.status = init && init.status || 200; }; g.Response.prototype.json = function(){ return Promise.resolve(this._body); }; g.Response.prototype.text = function(){ return Promise.resolve(typeof this._body === 'string' ? this._body : JSON.stringify(this._body)); }; }
  
  console.log('[preload] Function.prototype.bind fixed and runtime shims installed');

// runtime guard: detect image srcs accidentally prefixed with page path (e.g. /pages/.../https/...)
try{
  if (typeof document !== 'undefined'){
    const ImgProto = window.Image && window.Image.prototype;
    if (ImgProto && Object.getOwnPropertyDescriptor(ImgProto, 'src')){
      const desc = Object.getOwnPropertyDescriptor(ImgProto, 'src');
      Object.defineProperty(ImgProto, 'src', {
        set(v){
          try{
            if (typeof v === 'string' && /\/pages\/.+\/https?\:/.test(v)){
              console.warn('[preload.guard] suspicious image src detected:', v);
              console.trace();
            }
          }catch(e){}
          return desc.set.call(this, v);
        },
        get(){ return desc.get.call(this); },
        configurable:true,
        enumerable:desc.enumerable
      });
    }
    // also override setAttribute for <image> elements
    const origSet = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value){
      try{
        if ((name === 'src' || name === 'data-src') && typeof value === 'string' && /\/pages\/.+\/https?\:/.test(value)){
          console.warn('[preload.guard] suspicious attribute src detected:', value, this);
          console.trace();
        }
      }catch(e){}
      return origSet.call(this, name, value);
    }
  }
}catch(e){ console.warn('preload guard install failed', e); }
})();