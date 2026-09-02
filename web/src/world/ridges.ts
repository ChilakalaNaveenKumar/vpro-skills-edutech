import * as THREE from 'three'

// Distant ridge silhouettes. Flat shapes, fog disabled, each layer lighter than
// the one in front - atmospheric perspective without extra geometry cost.
function ridgeShape(seed: number, height: number, roughness: number): THREE.Shape {
  const shape = new THREE.Shape()
  const span = 900
  const steps = 64
  shape.moveTo(-span / 2, -160)
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const x = -span / 2 + span * t
    const wave =
      Math.sin(t * 6.1 + seed) * 0.5 +
      Math.sin(t * 13.7 + seed * 2.3) * 0.3 +
      Math.sin(t * 27.3 + seed * 4.1) * roughness
    shape.lineTo(x, height + wave * height * 0.42)
  }
  shape.lineTo(span / 2, -160)
  shape.closePath()
  return shape
}

export interface RidgeLayer {
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
  /** How much this layer picks up the sky's horizon colour. */
  blend: number
}

export function createRidges(): RidgeLayer[] {
  const specs = [
    { z: -150, height: 26, seed: 1.7, roughness: 0.18, blend: 0.16 },
    { z: -230, height: 44, seed: 4.2, roughness: 0.13, blend: 0.3 },
    { z: -320, height: 66, seed: 8.9, roughness: 0.09, blend: 0.46 },
  ]

  return specs.map((spec) => {
    const material = new THREE.MeshBasicMaterial({ color: 0x0b1018, fog: false, depthWrite: true })
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(ridgeShape(spec.seed, spec.height, spec.roughness)), material)
    mesh.position.z = spec.z
    return { mesh, material, blend: spec.blend }
  })
}
