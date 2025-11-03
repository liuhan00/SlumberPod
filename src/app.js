// 微信小程序入口文件 - 保证最早执行 bind 全量 polyfill
(function(){
  'use strict';
  if (typeof Function.prototype.bind === 'undefined' || !Function.prototype.bind) {
    console.log('[App Entry] apply full ES5 bind polyfill...');
    Function.prototype.bind = function bind(thisArg){
      var target = this;
      if (typeof target !== 'function') return target;
      var slice = Array.prototype.slice;
      var args = slice.call(arguments, 1);
      var nop = function(){};
      var bound = function(){
        var callArgs = args.concat(slice.call(arguments));
        return target.apply(this instanceof nop ? this : thisArg, callArgs);
      };
      if (target.prototype) {
        nop.prototype = target.prototype;
        bound.prototype = new nop();
        bound.prototype.constructor = bound;
      }
      return bound;
    };
  }
})();

import './main.js';