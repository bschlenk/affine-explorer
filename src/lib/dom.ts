export function childIndex(el: HTMLElement) {
  const p = el.parentElement!
  return Array.from(p.children).findIndex((child) => child === el)
}
