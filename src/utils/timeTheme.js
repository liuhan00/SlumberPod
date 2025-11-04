import { ref, computed, onMounted } from 'vue'

export function useTimeTheme() {
  const hour = ref(getHour())
  const theme = computed(()=> getThemeByHour(hour.value))
  const bgStyle = computed(()=> ({
    backgroundImage: gradients[theme.value],
    backgroundColor: baseColors[theme.value],
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%'
  }))

  const updateFromHash = () => {
    const h = readHourFromHash()
    if(typeof h === 'number') hour.value = h
  }

  onMounted(()=>{
    const h = readHourFromHash()
    if(typeof h === 'number') hour.value = h
    const id = setInterval(()=>{ hour.value = getHour() }, 60*1000)
    if(typeof window !== 'undefined') {
      window.addEventListener('hashchange', updateFromHash)
    }
  })

  return { hour, theme, bgStyle }
}

export function getHour(){
  const fromHash = readHourFromHash()
  if(typeof fromHash === 'number') return clampHour(fromHash)
  return new Date().getHours()
}

function clampHour(h){ return Math.max(0, Math.min(23, h)) }

function readHourFromHash(){
  if(typeof window === 'undefined' || !window.location || !window.location.hash) return undefined
  const hash = window.location.hash
  const qIndex = hash.indexOf('?')
  if(qIndex === -1) return undefined
  const query = hash.substring(qIndex+1)
  const usp = new URLSearchParams(query)
  const raw = usp.get('hour')
  if(raw == null) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

export function getThemeByHour(h){
  // 更直观的时间段：晨光(dawn)5-9, 日间(day)9-17, 傍晚(dusk)17-20, 夜间(night)20-5
  if(h>=5 && h<9) return 'dawn'
  if(h>=9 && h<17) return 'day'
  if(h>=17 && h<20) return 'dusk'
  return 'night'
}

export const gradients = {
  // 夜晚：冷色暗调，轻微星辉
  night: 'radial-gradient(120% 80% at 50% 10%, #05060a 0%, #09101a 50%, #071019 100%), linear-gradient(180deg, rgba(10,14,22,0.6), rgba(4,6,10,0.9))',
  // 傍晚：温暖橙紫混合，体现落日余晖
  dusk:  'radial-gradient(120% 80% at 50% 20%, rgba(44,24,60,1) 0%, rgba(32,18,48,0.85) 50%, rgba(18,12,30,0.95) 100%), linear-gradient(180deg, rgba(255,140,84,0.06), rgba(120,60,120,0.04))',
  // 白天：明亮蓝天渐变
  day:   'linear-gradient(180deg, #a8d8ff 0%, #dff1ff 50%, #ffffff 100%)',
  // 晨光：柔和暖光与薄雾感
  dawn:  'radial-gradient(120% 80% at 50% 10%, rgba(255,220,180,0.12) 0%, rgba(255,200,120,0.06) 40%, rgba(30,40,60,0.9) 100%)'
}

export const baseColors = {
  night: '#061018',
  dusk: '#171220',
  day: '#eaf6ff',
  dawn: '#2a3a50',
}

export const textColors = {
  night: '#e7e9ee',
  dusk: '#f0e9f6',
  day: '#0b2340',
  dawn: '#f3f6ff',
}
