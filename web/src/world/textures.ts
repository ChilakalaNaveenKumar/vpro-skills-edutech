import * as THREE from 'three'

// Untextured sprites and points render as hard squares. These radial alpha
// gradients are what make glows and embers read as light rather than tiles.
function radialTexture(stops: Array<[number, string]>, size = 128): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color))
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Wide, soft falloff for atmospheric bloom around a light source. */
export function glowTexture(): THREE.Texture {
  return radialTexture([
    [0, 'rgba(255,255,255,0.95)'],
    [0.18, 'rgba(255,255,255,0.45)'],
    [0.45, 'rgba(255,255,255,0.12)'],
    [1, 'rgba(255,255,255,0)'],
  ], 256)
}

/** Tight round dot for embers and stars. */
export function dotTexture(): THREE.Texture {
  return radialTexture([
    [0, 'rgba(255,255,255,1)'],
    [0.42, 'rgba(255,255,255,0.7)'],
    [1, 'rgba(255,255,255,0)'],
  ], 64)
}
