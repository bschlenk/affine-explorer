type CleanupFn = () => void
type EventListenerOptions = boolean | AddEventListenerOptions

export function listen<K extends keyof WindowEventMap>(
  el: Window,
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: EventListenerOptions,
): CleanupFn
export function listen<K extends keyof DocumentEventMap>(
  el: Document,
  type: K,
  cb: (this: Document, ev: DocumentEventMap[K]) => any,
  options?: EventListenerOptions,
): CleanupFn
export function listen<K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  type: K,
  cb: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  options?: EventListenerOptions,
): CleanupFn
export function listen(
  el: Window | Document | HTMLElement,
  type: string,
  cb: (e: any) => void,
  options?: EventListenerOptions,
) {
  el.addEventListener(type, cb, options)
  return () => el.removeEventListener(type, cb, options)
}
