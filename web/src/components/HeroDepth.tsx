import { useEffect, useRef, useState } from 'react'

// Interactive depth-parallax hero. Raw WebGL on purpose: one quad, two textures
// and a fragment shader, so the effect costs ~8KB instead of re-adding three.js.
//
// The photograph is displaced by its depth map, so scroll dollies the camera
// into the scene and the pointer shifts near things more than far ones. The
// screen glow breathes and dust drifts in the warm light. Nothing is a video -
// every frame is generated from the scroll position and the clock.

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `
precision highp float;

uniform sampler2D uPhoto;
uniform sampler2D uDepth;
uniform vec2  uRes;
uniform float uImageAspect;
uniform float uScroll;    // 0 at rest, 1 when the hero has scrolled away
uniform vec2  uPointer;   // -1..1, already damped
uniform float uTime;
uniform float uReduce;    // 1 = reduced motion: no dolly, no dust, no breath

varying vec2 vUv;

const vec2 GLOW = vec2(0.715, 0.444);   // the laptop screen, in image space
const vec3 AMBER = vec3(1.0, 0.60, 0.22);

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Cover-fit, then dolly. Near surfaces grow faster than far ones, which is what
// makes a flat photograph read as a space rather than a zooming picture.
vec2 frame(vec2 uv, float depth) {
  float ratio = (uRes.x / uRes.y) / uImageAspect;
  vec2 s = ratio > 1.0 ? vec2(1.0, 1.0 / ratio) : vec2(ratio, 1.0);
  float dolly = mix(0.0, 0.17, uScroll) * (1.0 - uReduce);
  s *= 1.0 - dolly * (0.55 + 0.85 * depth);
  return vec2(0.5) + (uv - 0.5) * s;
}

void main() {
  // One cheap refinement pass: frame with a flat guess, read depth there, then
  // reframe. Two samples is enough at this parallax strength.
  vec2 uv = frame(vUv, 0.5);
  float d = texture2D(uDepth, uv).r;
  uv = frame(vUv, d);
  d = texture2D(uDepth, uv).r;

  // Pointer parallax, strongest on the nearest surfaces.
  vec2 shift = uPointer * 0.018 * (1.0 - uReduce);
  uv += shift * (d - 0.58);

  vec3 col = texture2D(uPhoto, uv).rgb;

  // The screen breathes. Additive and masked, so it reads as the panel's own
  // light rather than a lamp floating over the photograph.
  float breath = mix(1.0, 0.88 + 0.12 * sin(uTime * 0.9), 1.0 - uReduce);
  float glow = exp(-pow(length((uv - GLOW) * vec2(1.6, 1.0)) * 3.1, 2.0));
  col += AMBER * glow * 0.30 * breath;

  // Dust, only in the lit half, drifting up and parallaxing as the nearest layer.
  if (uReduce < 0.5) {
    vec2 dustUv = uv * vec2(1.0, 1.0) + shift * 0.6;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float scale = 46.0 + fi * 31.0;
      vec2 gv = dustUv * scale;
      gv.y -= uTime * (0.14 + fi * 0.05);
      vec2 cell = floor(gv);
      vec2 f = fract(gv) - 0.5;
      float rnd = hash(cell + fi * 17.3);
      if (rnd > 0.982) {
        float mote = exp(-dot(f, f) * 150.0);
        col += AMBER * mote * 0.5 * smoothstep(0.15, 0.7, glow + 0.25);
      }
    }
  }

  // Vignette and a little grain, to sit with the page's own film grain.
  float vig = smoothstep(1.25, 0.35, length(vUv - 0.5));
  col *= mix(0.72, 1.0, vig);
  col += (hash(vUv * uRes.xy + uTime) - 0.5) * 0.018;

  gl_FragColor = vec4(col, 1.0);
}`

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('HeroDepth shader:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function loadTexture(gl: WebGLRenderingContext, url: string): Promise<WebGLTexture | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      const texture = gl.createTexture()
      if (!texture) return resolve(null)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      resolve(texture)
    }
    image.onerror = () => resolve(null)
    image.src = url
  })
}

const IMAGE_ASPECT = 1600 / 893

export default function HeroDepth() {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    const gl = (canvas.getContext('webgl', { antialias: false, alpha: false }) ??
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) {
      setFailed(true)
      return
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    const program = gl.createProgram()
    if (!vs || !fs || !program) {
      setFailed(true)
      return
    }
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('HeroDepth link:', gl.getProgramInfoLog(program))
      setFailed(true)
      return
    }
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const u = {
      photo: gl.getUniformLocation(program, 'uPhoto'),
      depth: gl.getUniformLocation(program, 'uDepth'),
      res: gl.getUniformLocation(program, 'uRes'),
      aspect: gl.getUniformLocation(program, 'uImageAspect'),
      scroll: gl.getUniformLocation(program, 'uScroll'),
      pointer: gl.getUniformLocation(program, 'uPointer'),
      time: gl.getUniformLocation(program, 'uTime'),
      reduce: gl.getUniformLocation(program, 'uReduce'),
    }

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(pointer: fine)')
    let reduce = motion.matches
    let ready = false
    let frame = 0
    let onScreen = true
    let width = 0
    let height = 0
    let start = 0

    let scrollTarget = 0
    let scroll = 0
    const pointerTarget = { x: 0, y: 0 }
    const pointer = { x: 0, y: 0 }

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, reduce ? 1 : 1.75)
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const readScroll = () => {
      const rect = host.getBoundingClientRect()
      // 0 while the hero fills the viewport, 1 once it has travelled one screen.
      scrollTarget = Math.min(1, Math.max(0, -rect.top / Math.max(1, window.innerHeight)))
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !fine.matches) return
      pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1
      pointerTarget.y = (event.clientY / window.innerHeight) * 2 - 1
    }

    const render = (now: number) => {
      if (!start) start = now
      const t = (now - start) / 1000

      scroll += (scrollTarget - scroll) * (reduce ? 1 : 0.09)
      pointer.x += (pointerTarget.x - pointer.x) * (reduce ? 1 : 0.06)
      pointer.y += (pointerTarget.y - pointer.y) * (reduce ? 1 : 0.06)

      gl.uniform2f(u.res, canvas.width, canvas.height)
      gl.uniform1f(u.aspect, IMAGE_ASPECT)
      gl.uniform1f(u.scroll, scroll)
      gl.uniform2f(u.pointer, pointer.x, pointer.y)
      gl.uniform1f(u.time, reduce ? 6 : t)
      gl.uniform1f(u.reduce, reduce ? 1 : 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      frame = onScreen && !document.hidden && ready ? requestAnimationFrame(render) : 0
    }

    const run = () => {
      if (!ready || !onScreen || document.hidden) return
      if (!frame) frame = requestAnimationFrame(render)
    }
    const stop = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }

    const resizeObserver = new ResizeObserver(() => {
      resize()
      if (!frame) run()
    })
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false
      if (onScreen) run()
      else stop()
    })
    const onVisibility = () => (document.hidden ? stop() : run())
    const onMotion = () => {
      reduce = motion.matches
      resize()
    }

    resize()
    readScroll()
    resizeObserver.observe(host)
    intersection.observe(host)
    window.addEventListener('scroll', readScroll, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    motion.addEventListener('change', onMotion)

    void Promise.all([
      loadTexture(gl, '/hero-studio.webp'),
      loadTexture(gl, '/hero-studio-depth.webp'),
    ]).then(([photo, depth]) => {
      if (!photo || !depth) {
        setFailed(true)
        return
      }
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, photo)
      gl.uniform1i(u.photo, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, depth)
      gl.uniform1i(u.depth, 1)
      ready = true
      host.dataset.state = 'ready'
      run()
    })

    return () => {
      stop()
      resizeObserver.disconnect()
      intersection.disconnect()
      window.removeEventListener('scroll', readScroll)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
      motion.removeEventListener('change', onMotion)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buffer)
    }
  }, [])

  if (failed) {
    return (
      <img
        src="/hero-studio.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
    )
  }

  return (
    <div
      ref={hostRef}
      data-state="loading"
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-[color:var(--ink)] transition-opacity duration-700 data-[state=loading]:opacity-0 data-[state=ready]:opacity-100"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}
