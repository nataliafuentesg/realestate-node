<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)
let renderer, scene, camera, animationId, observer, resizeObserver
let particles, tower, glow, particlePhases
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
  gradient.addColorStop(0, 'rgba(240,217,168,0.95)')
  gradient.addColorStop(0.4, 'rgba(240,217,168,0.35)')
  gradient.addColorStop(1, 'rgba(240,217,168,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

function buildGrid(THREE) {
  const grid = new THREE.GridHelper(40, 40, 0xd4b483, 0x5a4a30)
  grid.position.y = -1.8
  grid.material.transparent = true
  grid.material.opacity = 0.55
  return grid
}

// Una torre residencial abstracta: plantas de vidrio apiladas que se van
// angostando y girando hacia arriba, como una maqueta de volumetria
// arquitectonica. Mismo material y paleta que antes (el "cristal" ya se
// veia bien) -- lo que cambia es la forma, para que de verdad hable de
// inmobiliaria y no de piedras preciosas flotando.
function buildTowerModel(THREE) {
  const group = new THREE.Group()

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xf0e6d2,
    metalness: 0.25,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 1,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [120, 420],
    transparent: true,
    opacity: 0.88,
  })

  const edgeMat = new THREE.LineBasicMaterial({ color: 0xf0d9a8, transparent: true, opacity: 0.55 })

  const floors = 10
  const baseWidth = 1.15
  const baseDepth = 0.82
  const floorHeight = 0.16
  const gap = 0.1
  const twistPerFloor = (14 * Math.PI) / 180
  const totalHeight = floors * (floorHeight + gap)

  for (let i = 0; i < floors; i++) {
    // Cada planta es un poco mas angosta que la anterior: la torre se
    // afina hacia arriba en vez de ser un bloque recto.
    const t = i / (floors - 1)
    const width = baseWidth * (1 - t * 0.42)
    const depth = baseDepth * (1 - t * 0.42)

    const geo = new THREE.BoxGeometry(width, floorHeight, depth)
    const floor = new THREE.Mesh(geo, material)

    floor.position.y = -totalHeight / 2 + i * (floorHeight + gap)
    floor.rotation.y = i * twistPerFloor

    group.add(floor)

    const edges = new THREE.EdgesGeometry(geo)
    floor.add(new THREE.LineSegments(edges, edgeMat))
  }

  return group
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

    // La torre gira lento sobre su eje y flota levemente -- nada de
    // pulso "latiendo": un edificio no respira, se asienta.
    tower.rotation.y += 0.0025
    tower.rotation.x = mouseY * 0.18
    tower.rotation.z = mouseX * -0.08
    tower.position.y = Math.sin(t * 0.5) * 0.05
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
  const point = new THREE.PointLight(0xf0d9a8, 3, 25)
  point.position.set(3, 4, 4)
  scene.add(point)
  const point2 = new THREE.PointLight(0xd4b483, 1.5, 20)
  point2.position.set(-4, -2, 3)
  scene.add(point2)

  tower = buildTowerModel(THREE)
  scene.add(tower)

  const glowMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(THREE),
    color: 0xf0d9a8,
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
    color: 0xf0d9a8,
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
