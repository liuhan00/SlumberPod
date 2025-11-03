import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  build: {
    rollupOptions: {
      // 强制在每个 chunk 的最开头插入 polyfill（intro 比 banner 更靠前）
      output: {
        intro: `
(function(){
  'use strict';
  if (typeof Function.prototype.bind === 'undefined' || !Function.prototype.bind) {
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
        `,
        banner: ''
      },
      plugins: [
        {
          name: 'function-bind-polyfill',
          transform(code, id) {
            // 兜底：在源文件开头也注入一次（避免某些 chunk 未带 intro）
            if (id.endsWith('.js') && !id.includes('node_modules')) {
              const polyfill = `
(function(){
  'use strict';
  if (typeof Function.prototype.bind === 'undefined' || !Function.prototype.bind) {
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
`;
              return polyfill + code;
            }
            return code;
          }
        }
      ]
    }
  }
})