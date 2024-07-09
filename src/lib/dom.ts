export function childIndex(el: HTMLElement) {
  const p = el.parentElement as HTMLElement
  return Array.from(p!.children).findIndex((child) => child === el)
}
