<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const dotRef = ref(null)
const ringRef = ref(null)
const hovering = ref(false)
const visible = ref(false)

let dotX = 0
let dotY = 0
let ringX = 0
let ringY = 0
let targetX = 0
let targetY = 0
let rafId

const isTouchDevice =
  typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches

function onMouseMove(e) {
  targetX = e.clientX
  targetY = e.clientY
  if (!visible.value) visible.value = true
}

function onPointerOver(e) {
  hovering.value = !!e.target.closest('a, button, select, [data-cursor-hover]')
}

function tick() {
  dotX = targetX
  dotY = targetY
  ringX += (targetX - ringX) * 0.18
  ringY += (targetY - ringY) * 0.18

  if (dotRef.value) {
    dotRef.value.style.transform = `translate(${dotX}px, ${dotY}px)`
  }
  if (ringRef.value) {
    ringRef.value.style.transform = `translate(${ringX}px, ${ringY}px)`
  }
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  if (isTouchDevice) return
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('pointerover', onPointerOver)
  tick()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('pointerover', onPointerOver)
})
</script>

<template>
  <div v-if="!isTouchDevice" class="pointer-events-none fixed inset-0 z-[300] hidden md:block" :class="{ 'opacity-0': !visible }">
    <div
      ref="dotRef"
      class="fixed left-0 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-light transition-opacity duration-300"
    ></div>
    <div
      ref="ringRef"
      class="fixed left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-[width,height,border-color] duration-200 ease-out"
      :class="hovering ? 'h-12 w-12 border-gold-light bg-gold-light/10' : 'h-8 w-8 border-gold-light/50'"
    ></div>
  </div>
</template>
