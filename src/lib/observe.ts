export function observe(el: HTMLElement, cb: (r: DOMRectReadOnly) => void) {
  const observer = new ResizeObserver(
    (entries: { target: Element; contentRect: DOMRectReadOnly }[]) => {
      for (const entry of entries) {
        if (entry.target === el) {
          cb(entry.contentRect)
        }
      }
    }
  )

  observer.observe(el)

  return () => observer.disconnect()
}
