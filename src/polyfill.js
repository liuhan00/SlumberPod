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
        globalThis.fetch = function(){ return Promise.reject(new Error('fetch is not available in this environment')); };
      }
      if (!globalThis.Headers){
        globalThis.Headers = function(init){ this._map = {}; if (init){ for(var k in init) this._map[k]=init[k]; } };
        globalThis.Headers.prototype.get = function(k){ return this._map[k.toLowerCase()]; };
      }
      if (!globalThis.Request){ globalThis.Request = function(){}; }
      if (!globalThis.Response){ globalThis.Response = function(){}; }
      // ensure fetch.bind exists safely
      if (globalThis.fetch && typeof globalThis.fetch.bind !== 'function'){
        try{ globalThis.fetch.bind = Function.prototype.bind.call(Function.prototype.bind, globalThis.fetch); }catch(e){ /* ignore */ }
      }
    }
  }catch(e){}

})();