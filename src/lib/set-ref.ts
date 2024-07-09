import { MutableRefObject } from 'react'

export function setRef<T>(ref: React.Ref<T> | null | undefined, value: T) {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref) {
    ;(ref as MutableRefObject<T>).current = value
  }
}
