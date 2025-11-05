import { ref, computed, onMounted } from 'vue'
import { gradients, baseColors, textColors, getHour, getThemeByHour } from '@/utils/timeTheme'
import { useThemeStore } from '@/stores/theme'

// contrast helper
function contrastTextColor(bgHex){
  if(!bgHex) return '#fff'
  let hex = String(bgHex).replace('#','')
  if(hex.length===3) hex = hex.split('').map(c=>c+c).join('')
  const num = parseInt(hex,16)
  if(Number.isNaN(num)) return '#fff'
  const r = (num>>16)&255, g=(num>>8)&255, b=num&255
  const a = [r,g,b].map(v=>{ v/=255; return v<=0.03928? v/12.92: Math.pow((v+0.055)/1.055,2.4) })
  const lum = 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]
  return lum > 0.5 ? '#000' : '#fff'
}

export function useGlobalTheme(){
  // Force single static theme for all pages (as requested)
  const hour = ref(getHour())
  const theme = computed(()=> 'day')
  const themeStore = useThemeStore()
  themeStore.load()
  const bgStyle = computed(()=> {
    // Use the screenshot-like soft blue gradient and matching variables
    const base = {
      backgroundImage: 'linear-gradient(180deg, #dff3ff 0%, #eef8ff 50%, #ffffff 100%)',
      backgroundColor: '#e6f6ff',
      color: '#13303f',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '100% 100%',
      '--fg': '#13303f',
      '--muted': '#6b7280',
      '--border': '#d1e7f7',
      '--card-bg': 'rgba(255,255,255,0.98)',
      '--card-fg': '#13303f',
      '--btn-bg': '#7fb8ff',
      '--btn-fg': '#fff',
      '--input-bg': '#f1f8ff',
      '--accent': '#7fb8ff',
      '--shadow': 'rgba(0,0,0,0.06)'
    }
    // apply any themeStore overrides if present
    return themeStore.override ? { ...base, ...themeStore.override } : base
  })

  onMounted(()=>{
    // keep hour reactive for compatibility but do not change theme dynamically
    setInterval(()=>{ hour.value = getHour() }, 60*1000)
  })

  return { hour, theme, bgStyle }
}

function readHourFromHash(){
  if(typeof window === 'undefined' || !window.location || !window.location.hash) return undefined
  const hash = window.location.hash
  const qIndex = hash.indexOf('?')
  if(qIndex === -1) return undefined
  const usp = new URLSearchParams(hash.substring(qIndex+1))
  const raw = usp.get('hour')
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}
