// Function.prototype.bind polyfill for WeChat Mini Program (full ES5 behavior)
// This file must be imported first in main.js
(function(){
  'use strict';
  if (typeof Function.prototype.bind === 'undefined' || !Function.prototype.bind) {
    console.log('[Polyfill] Function.prototype.bind missing, applying full ES5 polyfill...');
    Function.prototype.bind = function bind(thisArg){
      var target = this;
      if (typeof target !== 'function') return target;
      var slice = Array.prototype.slice;
      var args = slice.call(arguments, 1);
      var nop = function(){};
      var bound = function(){
        var callArgs = args.concat(slice.call(arguments));
        // If bound used as constructor, ignore thisArg
        return target.apply(this instanceof nop ? this : thisArg, callArgs);
      };
      if (target.prototype) {
        nop.prototype = target.prototype;
        bound.prototype = new nop();
        bound.prototype.constructor = bound;
      }
      return bound;
    };
    console.log('[Polyfill] Function.prototype.bind polyfilled');
  }
  // Safe fetch/Headers stubs for WeChat runtime (avoid vendor using fetch.bind when fetch undefined)
  try{
    if (typeof globalThis !== 'undefined'){
      if (!globalThis.fetch){
        // implement fetch via uni.request in mini-programs
        globalThis.fetch = function(url, opts){
          return new Promise(function(resolve, reject){
            try{
              var method = (opts && opts.method) || 'GET';
              var headers = (opts && opts.headers) || {};
              var body = opts && opts.body;
              var data = body;
              if (typeof body === 'string'){
                try{ data = JSON.parse(body); }catch(e){ data = body }
              }
              uni.request({
                url: url,
                method: method,
                header: headers,
                data: data,
                success: function(res){
                  // normalize to fetch Response-like object
                  resolve({
                    ok: (res.statusCode>=200 && res.statusCode<300),
                    status: res.statusCode,
                    statusText: res.errMsg || '',
                    headers: { get: function(k){ return res.header && res.header[k.toLowerCase()] } },
                    text: function(){ return Promise.resolve(typeof res.data === 'string' ? res.data : JSON.stringify(res.data)); },
                    json: function(){ return Promise.resolve(res.data); },
                    blob: function(){ return Promise.resolve(res.data); }
                  })
                },
                fail: function(err){ reject(err) }
              })
            }catch(e){ reject(e) }
          })
        };
      }
      if (!globalThis.Headers){
        globalThis.Headers = function(init){ this._map = {}; if (init){ for(var k in init) this._map[k]=init[k]; } };
        globalThis.Headers.prototype.get = function(k){ return this._map[k.toLowerCase()]; };
      }
      if (!globalThis.Request){ globalThis.Request = function(){}; }
      if (!globalThis.Response){ globalThis.Response = function(){}; }
      // polyfill minimal URL constructor if missing (basic parsing)
      if (typeof globalThis.URL !== 'function'){
        globalThis.URL = function(url, base){
          // very small polyfill: only supports relative to base simple join and pathname/search/hash extraction
          var _a = document && document.createElement ? document.createElement('a') : null;
          if (_a){ _a.href = url; this.href = _a.href; this.origin = _a.origin; this.pathname = _a.pathname; this.search = _a.search; this.hash = _a.hash; }
          else { this.href = String(url); this.origin = ''; this.pathname = ''; this.search = ''; this.hash = ''; }
        };
      }
      // ensure fetch.bind exists safely
      if (globalThis.fetch && typeof globalThis.fetch.bind !== 'function'){
        try{ globalThis.fetch.bind = Function.prototype.bind.call(Function.prototype.bind, globalThis.fetch); }catch(e){ /* ignore */ }
      }
    }
  }catch(e){}

})();