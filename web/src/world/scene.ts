import * as THREE from 'three'
import { CHAPTERS, type WorldState } from './chapters'
import { LANTERN_Z, pathX, terrainHeight, terrainSlope } from './terrain'
import type { ConductorState } from './conductor'
import { dotTexture, glowTexture } from './textures'
import { createRidges } from './ridges'

export interface Quality {
  dprCap: number
  grassCount: number
  emberCount: number
  terrainSegments: number
  antialias: boolean
  tall: boolean
}

export function qualityFor(width: number, height: number): Quality {
  const mobile = width <= 768
  return {
    dprCap: mobile ? 1.4 : 1.8,
    grassCount: mobile ? 900 : 2600,
    emberCount: mobile ? 220 : 520,
    terrainSegments: mobile ? 120 : 190,
    antialias: !mobile,
    tall: height / width > 1.2,
  }
}

const SKY_VERT = `
varying vec3 vWorld;
void main() {
  vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`

const SKY_FRAG = `
uniform vec3 uTop;
uniform vec3 uHorizon;
varying vec3 vWorld;
void main() {
  float h = normalize(vWorld).y;
  float t = smoothstep(-0.12, 0.62, h);
  gl_FragColor = vec4(mix(uHorizon, uTop, t), 1.0);
}`

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function createDawnWorld(canvas: HTMLCanvasElement, quality: Quality) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality.antialias, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.dprCap))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const glowMap = glowTexture()
  const dotMap = dotTexture()

  const scene = new THREE.Scene()
  const fog = new THREE.FogExp2(0x070a10, 0.03)
  scene.fog = fog

  const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 900)
  const worldRoot = new THREE.Group()
  scene.add(worldRoot)

  // --- environment: sky, stars, sun ---
  const skyUniforms = {
    uTop: { value: new THREE.Color(CHAPTERS[0].world.skyTop) },
    uHorizon: { value: new THREE.Color(CHAPTERS[0].world.skyHorizon) },
  }
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 18),
    new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: skyUniforms, side: THREE.BackSide, depthWrite: false, fog: false }),
  )
  worldRoot.add(sky)

  const starPositions = new Float32Array(1400 * 3)
  for (let i = 0; i < 1400; i += 1) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 0.92 + 0.05)
    const r = 560
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi))
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  const starMaterial = new THREE.PointsMaterial({ color: 0xdfe7f5, map: dotMap, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 1, depthWrite: false, fog: false })
  const stars = new THREE.Points(starGeometry, starMaterial)
  worldRoot.add(stars)

  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcf8f, transparent: true, opacity: 0.95, fog: false })
  const sun = new THREE.Mesh(new THREE.CircleGeometry(7.5, 48), sunMaterial)
  worldRoot.add(sun)

  const sunGlowMaterial = new THREE.SpriteMaterial({ color: 0xffb765, map: glowMap, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
  const sunGlow = new THREE.Sprite(sunGlowMaterial)
  sunGlow.scale.set(120, 120, 1)
  worldRoot.add(sunGlow)

  const ridges = createRidges()
  ridges.forEach((layer) => worldRoot.add(layer.mesh))

  const keyLight = new THREE.DirectionalLight(0x5b7ba8, 0.16)
  worldRoot.add(keyLight)
  const fillLight = new THREE.HemisphereLight(0x2a3550, 0x0a0d12, 0.52)
  worldRoot.add(fillLight)

  // --- terrain ---
  const segments = quality.terrainSegments
  const terrainGeometry = new THREE.PlaneGeometry(340, 340, segments, segments)
  terrainGeometry.rotateX(-Math.PI / 2)
  const position = terrainGeometry.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(position.count * 3)
  const rock = new THREE.Color()
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const z = position.getZ(i) - 40
    const h = terrainHeight(x, z)
    position.setY(i, h)
    position.setZ(i, z)
    // Colour by slope, not texture: exposed faces read lighter than the corridor.
    const slope = terrainSlope(x, z)
    rock.setRGB(0.055 + slope * 0.05, 0.06 + slope * 0.045, 0.075 + slope * 0.04)
    colors[i * 3] = rock.r
    colors[i * 3 + 1] = rock.g
    colors[i * 3 + 2] = rock.b
  }
  terrainGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  terrainGeometry.computeVertexNormals()
  const terrainMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 })
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
  worldRoot.add(terrain)

  // --- architecture: six module lanterns along the route ---
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.85, metalness: 0.1 })
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.17, 3.4, 7), postMaterial, LANTERN_Z.length)
  const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xfb7a02, transparent: true, opacity: 1 })
  const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 14, 10), lampMaterial, LANTERN_Z.length)
  const matrix = new THREE.Matrix4()
  const lampPoints: THREE.Vector3[] = []
  LANTERN_Z.forEach((z, i) => {
    const x = pathX(z) + 2.5
    const groundY = terrainHeight(x, z)
    matrix.makeTranslation(x, groundY + 1.7, z)
    posts.setMatrixAt(i, matrix)
    matrix.makeTranslation(x, groundY + 3.6, z)
    lamps.setMatrixAt(i, matrix)
    lampPoints.push(new THREE.Vector3(x, groundY + 3.6, z))
  })
  posts.instanceMatrix.needsUpdate = true
  lamps.instanceMatrix.needsUpdate = true
  worldRoot.add(posts, lamps)

  // Additive glow per lamp - the emitter, its glow and the practical light are
  // matched so lamps read luminous without asking bloom to invent them.
  const glowMaterial = new THREE.SpriteMaterial({ color: 0xfb7a02, map: glowMap, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
  lampPoints.forEach((p) => {
    const sprite = new THREE.Sprite(glowMaterial)
    sprite.position.copy(p)
    sprite.scale.set(4.2, 4.2, 1)
    worldRoot.add(sprite)
  })

  // Two practical point lights, moved to the lanterns nearest the camera, so
  // the lit route costs two lights instead of six.
  const practicals = [new THREE.PointLight(0xfb7a02, 0, 26, 2), new THREE.PointLight(0xfb7a02, 0, 26, 2)]
  practicals.forEach((light) => worldRoot.add(light))

  // --- grounding grass near the route ---
  const bladeGeometry = new THREE.ConeGeometry(0.06, 0.75, 3)
  bladeGeometry.translate(0, 0.375, 0)
  const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x101812, roughness: 1, metalness: 0 })
  const grass = new THREE.InstancedMesh(bladeGeometry, grassMaterial, quality.grassCount)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < quality.grassCount; i += 1) {
    const z = 24 - Math.random() * 78
    const x = pathX(z) + (Math.random() - 0.5) * 22
    dummy.position.set(x, terrainHeight(x, z), z)
    dummy.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3)
    dummy.scale.setScalar(0.7 + Math.random() * 0.9)
    dummy.updateMatrix()
    grass.setMatrixAt(i, dummy.matrix)
  }
  grass.instanceMatrix.needsUpdate = true
  worldRoot.add(grass)

  // --- atmosphere: rising embers ---
  const emberCount = quality.emberCount
  const emberPositions = new Float32Array(emberCount * 3)
  const emberSpeeds = new Float32Array(emberCount)
  const emberSeed = new Float32Array(emberCount)
  function seedEmber(i: number, spread = true) {
    const z = 22 - Math.random() * 74
    emberPositions[i * 3] = pathX(z) + (Math.random() - 0.5) * 26
    emberPositions[i * 3 + 1] = terrainHeight(pathX(z), z) + (spread ? Math.random() * 16 : 0.4)
    emberPositions[i * 3 + 2] = z
    emberSpeeds[i] = 0.35 + Math.random() * 0.9
    emberSeed[i] = Math.random() * Math.PI * 2
  }
  for (let i = 0; i < emberCount; i += 1) seedEmber(i)
  const emberGeometry = new THREE.BufferGeometry()
  emberGeometry.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3))
  const emberMaterial = new THREE.PointsMaterial({ color: 0xffa445, map: dotMap, size: 0.26, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })
  const embers = new THREE.Points(emberGeometry, emberMaterial)
  worldRoot.add(embers)

  // --- camera curves: one through positions, one through targets ---
  function buildCurves(tall: boolean) {
    const positions = CHAPTERS.map((c) => {
      const frame = tall && c.camera.mobile ? c.camera.mobile : c.camera
      return new THREE.Vector3(...frame.position)
    })
    const targets = CHAPTERS.map((c) => {
      const frame = tall && c.camera.mobile ? c.camera.mobile : c.camera
      return new THREE.Vector3(...frame.target)
    })
    return {
      position: new THREE.CatmullRomCurve3(positions, false, 'catmullrom', 0.35),
      target: new THREE.CatmullRomCurve3(targets, false, 'catmullrom', 0.35),
      fovs: CHAPTERS.map((c) => (tall && c.camera.mobile ? c.camera.mobile.fov : c.camera.fov)),
    }
  }
  let curves = buildCurves(quality.tall)

  const scratchPosition = new THREE.Vector3()
  const scratchTarget = new THREE.Vector3()
  const colorA = new THREE.Color()
  const colorB = new THREE.Color()

  function blendState(a: WorldState, b: WorldState, t: number) {
    keyLight.intensity = lerp(a.key, b.key, t)
    keyLight.color.set(colorA.set(a.keyColor)).lerp(colorB.set(b.keyColor), t)
    fog.density = lerp(a.fog, b.fog, t)
    fog.color.set(colorA.set(a.fogColor)).lerp(colorB.set(b.fogColor), t)
    skyUniforms.uTop.value.set(colorA.set(a.skyTop)).lerp(colorB.set(b.skyTop), t)
    skyUniforms.uHorizon.value.set(colorA.set(a.skyHorizon)).lerp(colorB.set(b.skyHorizon), t)
    starMaterial.opacity = lerp(a.stars, b.stars, t)
    emberMaterial.opacity = lerp(a.embers, b.embers, t) * 0.85
    terrainMaterial.color.set(colorA.set(a.ground)).lerp(colorB.set(b.ground), t)
    renderer.toneMappingExposure = lerp(a.exposure, b.exposure, t)

    ridges.forEach((layer) => {
      layer.material.color.copy(colorA.set(a.skyTop)).lerp(colorB.set(b.skyTop), t)
      layer.material.color.lerp(skyUniforms.uHorizon.value, layer.blend)
    })

    const practicalLevel = lerp(a.practicals, b.practicals, t)
    lampMaterial.opacity = 0.25 + practicalLevel * 0.75
    glowMaterial.opacity = practicalLevel * 0.7
    practicals.forEach((light) => { light.intensity = practicalLevel * 9 })

    const elevation = lerp(a.sunElevation, b.sunElevation, t)
    sun.position.set(0, elevation, -420)
    sun.lookAt(camera.position)
    sunGlow.position.copy(sun.position)
    const sunVisible = Math.min(1, Math.max(0, (elevation + 6) / 12))
    sunMaterial.opacity = sunVisible * 0.95
    sunGlowMaterial.opacity = sunVisible * 0.55
    keyLight.position.set(0, elevation + 40, -300)
  }

  let elapsed = 0

  function update(state: ConductorState, dt: number) {
    elapsed += dt
    const last = CHAPTERS.length - 1
    const t = Math.min(1, Math.max(0, state.smooth / last))

    curves.position.getPoint(t, scratchPosition)
    curves.target.getPoint(t, scratchTarget)
    camera.position.copy(scratchPosition)
    camera.lookAt(scratchTarget)

    const i = state.smoothIndex
    const j = state.smoothNext
    const local = state.localSmooth
    camera.fov = lerp(curves.fovs[i], curves.fovs[j], local)
    camera.updateProjectionMatrix()

    blendState(CHAPTERS[i].world, CHAPTERS[j].world, local)

    // Practicals follow the two lanterns nearest the camera.
    const ordered = lampPoints
      .map((p, index) => ({ index, d: p.distanceToSquared(camera.position) }))
      .sort((a, b) => a.d - b.d)
    practicals.forEach((light, k) => {
      const pick = ordered[k]
      if (pick) light.position.copy(lampPoints[pick.index])
    })

    // Embers rise and respawn ahead of the camera so density stays stable.
    const attribute = emberGeometry.attributes.position as THREE.BufferAttribute
    for (let k = 0; k < emberCount; k += 1) {
      let y = attribute.getY(k) + emberSpeeds[k] * dt * 1.6
      const x = attribute.getX(k) + Math.sin(elapsed * 0.6 + emberSeed[k]) * dt * 0.35
      if (y > terrainHeight(attribute.getX(k), attribute.getZ(k)) + 20) {
        seedEmber(k, false)
        y = attribute.getY(k)
        attribute.setXYZ(k, emberPositions[k * 3], emberPositions[k * 3 + 1], emberPositions[k * 3 + 2])
        continue
      }
      attribute.setXY(k, x, y)
    }
    attribute.needsUpdate = true

    sky.position.copy(camera.position)
    ridges.forEach((layer) => { layer.mesh.position.x = camera.position.x * 0.5 })
    renderer.render(scene, camera)
  }

  function resize(width: number, height: number, nextQuality?: Quality) {
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
    if (nextQuality) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, nextQuality.dprCap))
      if (nextQuality.tall !== quality.tall) curves = buildCurves(nextQuality.tall)
      quality = nextQuality
    }
  }

  function dispose() {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(material)) material.forEach((m) => m.dispose())
      else material?.dispose()
    })
    glowMaterial.dispose()
    sunGlowMaterial.dispose()
    glowMap.dispose()
    dotMap.dispose()
    renderer.dispose()
  }

  return { update, resize, dispose, camera, renderer, terrainHeightAt: terrainHeight }
}

export type DawnWorld = ReturnType<typeof createDawnWorld>
