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
  const hour = ref(getHour())
  const theme = computed(()=> getThemeByHour(hour.value))
  const themeStore = useThemeStore()
  themeStore.load()
  const bgStyle = computed(()=> {
    const t = theme.value
    const isLight = t === 'day'
    const vars = isLight ? {
      fg: '#0f172a',
      muted: '#475569',
      border: '#cbd5e1',
      cardBg: 'rgba(255,255,255,0.95)',
      cardFg: '#0f172a',
      buttonBg: '#111827',
      buttonFg: '#ffffff',
      inputBg: '#f1f5f9'
    } : {
      fg: '#e7e9ee',
      muted: '#cfd3dc',
      border: 'rgba(255,255,255,0.14)',
      cardBg: 'rgba(25,28,36,0.92)',
      cardFg: '#e7e9ee',
      buttonBg: '#f7c14d',
      buttonFg: '#111111',
      inputBg: '#232733'
    }
    const base = {
      backgroundImage: gradients[t],
      backgroundColor: baseColors[t],
      color: textColors[t],
      backgroundRepeat: 'no-repeat',
      backgroundSize: '100% 100%',
      '--fg': vars.fg,
      '--muted': vars.muted,
      '--border': vars.border,
      '--card-bg': vars.cardBg,
      '--card-fg': vars.cardFg,
      '--btn-bg': vars.buttonBg,
      '--btn-fg': vars.buttonFg,
      '--input-bg': vars.inputBg,
      '--accent': t==='day'? '#334155' : '#f7c14d',
      '--shadow': t==='day'? 'rgba(0,0,0,.08)' : 'rgba(0,0,0,.35)'
    }

    // compute contrast-based colors and expose as CSS variables
    try{
      const bgHex = baseColors[t]
      const textContrast = contrastTextColor(bgHex)
      const mutedContrast = textContrast === '#fff' ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)'
      base['--text-contrast'] = textContrast
      base['--muted-contrast'] = mutedContrast

      // 同步写入 :root，确保首屏渲染时变量已生效，避免先暗后亮的闪烁
      try{
        if(typeof document !== 'undefined' && document.documentElement && document.documentElement.style){
          Object.entries(base).forEach(([k,v]) => {
            if(k.startsWith('--')) document.documentElement.style.setProperty(k, v)
          })
        }
      }catch(_e){}
    }catch(e){}
    return themeStore.override ? { ...base, ...themeStore.override } : base
  })

  const updateFromHash = () => {
    const h = readHourFromHash()
    if(typeof h === 'number') hour.value = h
  }

  onMounted(()=>{
    const h = readHourFromHash()
    if(typeof h === 'number') hour.value = h
    setInterval(()=>{ hour.value = getHour() }, 60*1000)
    if(typeof window !== 'undefined') {
      window.addEventListener('hashchange', updateFromHash)
    }
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
