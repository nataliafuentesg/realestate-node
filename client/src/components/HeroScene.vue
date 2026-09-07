<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)
let renderer, scene, camera, animationId, observer, resizeObserver
let particles, glow, particlePhases
let mouseX = 0
let mouseY = 0
let targetX = 0
let targetY = 0
let paused = false
let clock

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function makeGlowTexture(THREE) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(248,113,113,0.95)')
  gradient.addColorStop(0.4, 'rgba(248,113,113,0.35)')
  gradient.addColorStop(1, 'rgba(248,113,113,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

function buildGrid(THREE) {
  const grid = new THREE.GridHelper(40, 40, 0xef4444, 0x5a1a1a)
  grid.position.y = -1.8
  grid.material.transparent = true
  grid.material.opacity = 0.55
  return grid
}

function onMouseMove(e) {
  targetX = e.clientX / window.innerWidth - 0.5
  targetY = e.clientY / window.innerHeight - 0.5
}

function handleResize(width, height) {
  if (!renderer || !camera || width === 0 || height === 0) return
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (paused) return

  const t = clock.getElapsedTime()

  if (!prefersReducedMotion) {
    mouseX += (targetX - mouseX) * 0.05
    mouseY += (targetY - mouseY) * 0.05

    glow.material.opacity = 0.5 + Math.sin(t * 1.1) * 0.1

    particles.rotation.y += 0.0009
    const posAttr = particles.geometry.attributes.position
    for (let i = 0; i < particlePhases.length; i++) {
      const phase = particlePhases[i]
      posAttr.array[i * 3 + 1] += Math.sin(t * phase.speed + phase.offset) * 0.0025
    }
    posAttr.needsUpdate = true

    camera.position.x = mouseX * 4
    camera.position.y = 1.1 - mouseY * 2
    camera.lookAt(0, 0.2, 0)
  }

  renderer.render(scene, camera)
}

async function initScene() {
  const THREE = await import('three')
  const canvas = canvasRef.value
  if (!canvas) return

  clock = new THREE.Clock()

  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x0d0b08, 0.045)

  camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100)
  camera.position.set(0, 1.1, 6.2)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  scene.add(new THREE.AmbientLight(0xffffff, 0.5))
  const point = new THREE.PointLight(0xf87171, 3, 25)
  point.position.set(3, 4, 4)
  scene.add(point)
  const point2 = new THREE.PointLight(0xef4444, 1.5, 20)
  point2.position.set(-4, -2, 3)
  scene.add(point2)

  const glowMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(THREE),
    color: 0xf87171,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  })
  glow = new THREE.Sprite(glowMat)
  glow.scale.set(9, 9, 1)
  glow.position.z = -0.5
  scene.add(glow)

  const particleCount = window.innerWidth < 768 ? 400 : 1000
  const positions = new Float32Array(particleCount * 3)
  particlePhases = []
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16
    positions[i * 3 + 1] = Math.random() * 7 - 1.5
    positions[i * 3 + 2] = (Math.random() - 0.5) * 16
    particlePhases.push({ speed: 0.3 + Math.random() * 0.6, offset: Math.random() * Math.PI * 2 })
  }
  const particleGeo = new THREE.BufferGeometry()
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: 0xf87171,
    size: 0.045,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  particles = new THREE.Points(particleGeo, particleMat)
  scene.add(particles)

  scene.add(buildGrid(THREE))

  resizeObserver = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect
    handleResize(width, height)
  })
  resizeObserver.observe(canvas)

  if (!prefersReducedMotion) {
    window.addEventListener('mousemove', onMouseMove)
  }

  observer = new IntersectionObserver(
    (entries) => {
      paused = !entries[0].isIntersecting
    },
    { threshold: 0.05 },
  )
  observer.observe(canvas.closest('section') || canvas)

  animate()
}

onMounted(() => {
  initScene()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('mousemove', onMouseMove)
  observer?.disconnect()
  resizeObserver?.disconnect()
  renderer?.dispose()
})
</script>

<template>
  <canvas ref="canvasRef" class="absolute inset-0 h-full w-full"></canvas>
</template>
