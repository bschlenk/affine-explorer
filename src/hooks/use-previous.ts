import { useEffect, useRef } from 'react'

export function usePrevious<T>(value: T) {
  const previous = useRef<T | null>(null)

  useEffect(() => {
    previous.current = value
  }, [value])

  return previous.current
}
