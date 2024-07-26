export type ResizeObserverCallback = (r: ResizeObserverEntry) => void

export function resizeObserver(el: HTMLElement, cb: ResizeObserverCallback) {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === el) {
        cb(entry)
      }
    }
  })

  observer.observe(el)

  return () => observer.disconnect()
}
