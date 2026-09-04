<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
  propertiesCount: { type: Number, default: 0 },
  citiesCount: { type: Number, default: 0 },
})

const sectionRef = ref(null)
const propertiesNumRef = ref(null)
const citiesNumRef = ref(null)
const curationNumRef = ref(null)
const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
let st
let dataReady = false
let scrolledIntoView = false
let animated = false

function animateCount(el, target) {
  if (!el) return
  const obj = { val: 0 }
  gsap.to(obj, {
    val: target,
    duration: 1.6,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = Math.round(obj.val)
    },
  })
}

function tryAnimate() {
  if (animated || !dataReady || !scrolledIntoView) return
  animated = true
  animateCount(propertiesNumRef.value, props.propertiesCount)
  animateCount(citiesNumRef.value, props.citiesCount)
  animateCount(curationNumRef.value, 100)
}

watch(
  () => props.propertiesCount,
  (val) => {
    if (val > 0) {
      dataReady = true
      tryAnimate()
    }
  },
)

onMounted(() => {
  if (prefersReducedMotion) {
    if (propertiesNumRef.value) propertiesNumRef.value.textContent = props.propertiesCount
    if (citiesNumRef.value) citiesNumRef.value.textContent = props.citiesCount
    if (curationNumRef.value) curationNumRef.value.textContent = 100
    return
  }

  if (props.propertiesCount > 0) dataReady = true

  st = ScrollTrigger.create({
    trigger: sectionRef.value,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      scrolledIntoView = true
      tryAnimate()
    },
  })
})

onBeforeUnmount(() => {
  st?.kill()
})
</script>

<template>
  <section ref="sectionRef" class="relative z-10 bg-charcoal px-6 py-16">
    <div v-reveal class="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-cream/10 text-center">
      <div class="px-4">
        <p class="font-serif text-4xl text-gold-light sm:text-5xl"><span ref="propertiesNumRef">0</span></p>
        <p class="mt-3 font-sans text-xs tracking-widest text-cream/50">PROPIEDADES</p>
      </div>
      <div class="px-4">
        <p class="font-serif text-4xl text-gold-light sm:text-5xl"><span ref="citiesNumRef">0</span></p>
        <p class="mt-3 font-sans text-xs tracking-widest text-cream/50">CIUDADES</p>
      </div>
      <div class="px-4">
        <p class="font-serif text-4xl text-gold-light sm:text-5xl"><span ref="curationNumRef">0</span>%</p>
        <p class="mt-3 font-sans text-xs tracking-widest text-cream/50">CURADURÍA</p>
      </div>
    </div>
  </section>
</template>
