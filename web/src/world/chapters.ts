// Scene ledger: the full contract for the Dawn Ascent world as data, so no
// thresholds are scattered through CSS or the render loop.

export interface CameraFrame {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  // Tall/narrow viewports step back along the view direction and open FOV
  // rather than accepting an arbitrary center crop.
  mobile?: { position: [number, number, number]; target: [number, number, number]; fov: number }
}

export interface WorldState {
  /** Directional key light (sun/moon) intensity. */
  key: number
  /** Key light colour - travels cold moonlight to warm dawn. */
  keyColor: string
  /** Sun/moon elevation along the ridge, in world units. */
  sunElevation: number
  /** Lantern practicals, 0 = unlit. */
  practicals: number
  /** Exponential fog density. */
  fog: number
  fogColor: string
  skyTop: string
  skyHorizon: string
  /** Star field opacity - fades as dawn arrives. */
  stars: number
  /** Rising ember density. */
  embers: number
  /** Ground albedo - dark rock warming into lit earth. */
  ground: string
  /** Renderer tone-mapping exposure. */
  exposure: number
}

export interface Chapter {
  id: string
  /** Dwell weight - more scroll distance for views that need it. */
  scrollWeight: number
  camera: CameraFrame
  world: WorldState
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'arrival',
    scrollWeight: 1.15,
    camera: {
      position: [0, 2.2, 22],
      target: [0, 5.0, -14],
      fov: 36,
      mobile: { position: [0, 2.8, 29], target: [0, 5.4, -12], fov: 46 },
    },
    world: {
      key: 0.24, keyColor: '#5b7ba8', sunElevation: -6,
      practicals: 0.35, fog: 0.016, fogColor: '#070a10',
      skyTop: '#05070c', skyHorizon: '#0b1220',
      stars: 1, embers: 0.22, ground: '#0a0d12', exposure: 0.82,
    },
  },
  {
    id: 'stakes',
    scrollWeight: 1,
    camera: {
      position: [-5.2, 5.4, 12],
      target: [1.6, 7.5, -18],
      fov: 44,
      mobile: { position: [-4.2, 6.2, 18], target: [1.2, 7.8, -16], fov: 52 },
    },
    world: {
      key: 0.36, keyColor: '#6d86ad', sunElevation: -3,
      practicals: 0.62, fog: 0.014, fogColor: '#0a0f18',
      skyTop: '#070b13', skyHorizon: '#14202f',
      stars: 0.82, embers: 0.34, ground: '#0d1118', exposure: 0.88,
    },
  },
  {
    id: 'path',
    scrollWeight: 1.3,
    camera: {
      position: [2.4, 9.0, -2],
      target: [-1.2, 11.0, -30],
      fov: 40,
      mobile: { position: [2.0, 9.8, 5], target: [-0.8, 11.2, -26], fov: 50 },
    },
    world: {
      key: 0.52, keyColor: '#9a7f86', sunElevation: 0.5,
      practicals: 1, fog: 0.012, fogColor: '#141420',
      skyTop: '#0c1220', skyHorizon: '#33283a',
      stars: 0.5, embers: 0.5, ground: '#141119', exposure: 0.95,
    },
  },
  {
    id: 'mentor',
    scrollWeight: 1.1,
    camera: {
      position: [-3.0, 12.5, -18],
      target: [1.0, 13.5, -26],
      fov: 50,
      mobile: { position: [-2.4, 13.0, -13], target: [0.8, 13.8, -24], fov: 58 },
    },
    world: {
      key: 0.72, keyColor: '#e08a44', sunElevation: 4,
      practicals: 0.88, fog: 0.010, fogColor: '#221a1c',
      skyTop: '#152036', skyHorizon: '#7a4a34',
      stars: 0.2, embers: 0.42, ground: '#241a18', exposure: 1.02,
    },
  },
  {
    id: 'horizon',
    scrollWeight: 1.25,
    camera: {
      position: [0, 22.0, -34],
      target: [0, 24.0, -66],
      fov: 42,
      mobile: { position: [0, 22.6, -27], target: [0, 24.4, -62], fov: 52 },
    },
    world: {
      key: 1.35, keyColor: '#ffcf8f', sunElevation: 11,
      practicals: 0.22, fog: 0.007, fogColor: '#d8b189',
      skyTop: '#4a6f9e', skyHorizon: '#ffb765',
      stars: 0, embers: 0.16, ground: '#4a3a2c', exposure: 1.12,
    },
  },
]

export const CHAPTER_IDS = CHAPTERS.map((c) => c.id)
