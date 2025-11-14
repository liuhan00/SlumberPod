import { getPlaceholder } from '@/utils/image'

export const allNoises = [
  { id:'n1', name:'海浪', author:'自然声', cover:getPlaceholder('noise'), category:'自然', src:'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav' },
  { id:'n2', name:'雨声', author:'自然声', cover:getPlaceholder('noise'), category:'自然', src:'https://www2.cs.uic.edu/~i101/SoundFiles/ImperialMarch60.wav' },
  { id:'n3', name:'壁炉', author:'居家', cover:getPlaceholder('noise'), category:'居家', src:'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand60.wav' },
  { id:'n4', name:'树林', author:'自然声', cover:getPlaceholder('noise'), category:'自然', src:'https://www2.cs.uic.edu/~i101/SoundFiles/ClassicRock60.wav' },
  { id:'n5', name:'地铁', author:'环境', cover:getPlaceholder('noise'), category:'环境', src:'https://www2.cs.uic.edu/~i101/SoundFiles/Fanfare60.wav' },
]
