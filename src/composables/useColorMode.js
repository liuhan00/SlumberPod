import { ref, onMounted } from 'vue'

// Simple color mode composable compatible with browser and uni-app runtimes.
// Returns a reactive `colorMode` ref with values 'light' or 'dark'.
export function useColorMode(){
  const colorMode = ref('light')

  function detect(){
    try{
      // 1. uni-app runtime: try getSystemInfoSync().theme (some runtimes expose)
      if(typeof uni !== 'undefined' && uni.getSystemInfoSync){
        const info = uni.getSystemInfoSync() || {}
        if(info.theme === 'dark') { colorMode.value = 'dark'; return }
      }
      // 2. browser: prefers-color-scheme
      if(typeof window !== 'undefined' && typeof window.matchMedia === 'function'){
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        if(mq){
          colorMode.value = mq.matches ? 'dark' : 'light'
          // listen to changes if supported
          try{
            if(typeof mq.addEventListener === 'function') mq.addEventListener('change', e=> colorMode.value = e.matches ? 'dark' : 'light')
            else if(typeof mq.addListener === 'function') mq.addListener(e=> colorMode.value = e.matches ? 'dark' : 'light')
          }catch(e){}
        }
        return
      }
    }catch(e){}
    // fallback to stored preference or light
    try{ const stored = (typeof uni !== 'undefined' && uni.getStorageSync) ? uni.getStorageSync('color_mode') : (typeof localStorage !== 'undefined' ? localStorage.getItem('color_mode') : null); if(stored) colorMode.value = stored }
    catch(e){}
  }

  function setColorMode(v){
    colorMode.value = v === 'dark' ? 'dark' : 'light'
    try{ if(typeof uni !== 'undefined' && uni.setStorageSync) uni.setStorageSync('color_mode', colorMode.value); else if(typeof localStorage !== 'undefined') localStorage.setItem('color_mode', colorMode.value) }catch(e){}
  }

  onMounted(()=> detect())

  return { colorMode, setColorMode }
}
