export const vReveal = {
  mounted(el, binding) {
    const delay = binding.value?.delay || 0
    el.style.transitionDelay = `${delay}ms`
    el.classList.add('reveal-hidden')

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          el.classList.add('reveal-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    el._revealObserver = observer
  },
  unmounted(el) {
    el._revealObserver?.disconnect()
  },
}
