// Value-noise fbm heightfield for the ascent. Shared by the mesh builder and
// anything that needs to sit on the ground (lantern posts, grass, camera checks).

function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash2(ix, iy)
  const b = hash2(ix + 1, iy)
  const c = hash2(ix, iy + 1)
  const d = hash2(ix + 1, iy + 1)
  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy
}

function fbm(x: number, y: number, octaves = 4): number {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  for (let i = 0; i < octaves; i += 1) {
    value += amplitude * smoothNoise(x * frequency, y * frequency)
    frequency *= 2.07
    amplitude *= 0.5
  }
  return value
}

/** The route's lateral drift - a gentle S so the camera turn reveals new ground. */
export function pathX(z: number): number {
  return 3.2 * Math.sin(z * 0.035)
}

/** Large-scale ascent profile: valley floor at +z rising to the ridge at -z. */
function ridgeProfile(z: number): number {
  const t = Math.min(1, Math.max(0, (40 - z) / 110))
  return 24 * Math.pow(t, 1.6)
}

export function terrainHeight(x: number, z: number): number {
  const base = ridgeProfile(z)
  const detail = (fbm(x * 0.035 + 11.3, z * 0.035 + 4.7) - 0.5) * 7.5
  const ridges = (fbm(x * 0.011, z * 0.011, 2) - 0.5) * 9

  // Flatten and slightly sink a corridor along the route so the path reads.
  const dx = Math.abs(x - pathX(z))
  const corridor = Math.exp(-(dx * dx) / 26)
  const height = base + detail * (1 - corridor * 0.85) + ridges * (1 - corridor * 0.6)
  return height - corridor * 0.9
}

/** Surface normal by finite difference - used for slope-based ground colour. */
export function terrainSlope(x: number, z: number): number {
  const e = 1.2
  const hx = terrainHeight(x + e, z) - terrainHeight(x - e, z)
  const hz = terrainHeight(x, z + e) - terrainHeight(x, z - e)
  return Math.min(1, Math.sqrt(hx * hx + hz * hz) / (2 * e) / 1.6)
}

/** Where the six module lanterns stand, valley to ridge. */
export const LANTERN_Z = [16, 4, -8, -18, -28, -40]
