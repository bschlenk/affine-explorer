import { type RefObject, useEffect, useLayoutEffect, useState } from 'react'
import * as vec from '@bschlenk/vec'

import { listen } from '../lib/event'

const DEFAULT = { origin: { x: 0, y: 0 }, scale: 1 }

export function useOriginScale(ref: RefObject<HTMLElement>) {
  const [originScale, setOriginScale] = useState(DEFAULT)

  useLayoutEffect(() => {
    const box = ref.current!.getBoundingClientRect()

    setOriginScale({
      origin: vec.vec(box.width / 2, box.height / 2),
      scale: 1,
    })
  }, [ref])

  useEffect(
    () =>
      listen(
        ref.current!,
        'wheel',
        (e) => {
          e.preventDefault()

          const { deltaX, deltaY, ctrlKey } = e

          if (ctrlKey) {
            // zoom
            const mouse = relativeMouse(e, e.currentTarget! as HTMLElement)

            setOriginScale((value) => {
              const scaleBy = 1 - deltaY / 100

              const origin = vec.subtract(
                mouse,
                vec.scale(vec.subtract(mouse, value.origin), scaleBy),
              )
              const scale = value.scale * scaleBy

              return { origin, scale }
            })
          } else {
            // pan
            setOriginScale((value) => {
              return {
                ...value,
                origin: vec.add(value.origin, {
                  x: -deltaX,
                  y: -deltaY,
                }),
              }
            })
          }
        },
        { passive: false },
      ),
    [ref],
  )

  return originScale
}

function relativeMouse(
  e: { clientX: number; clientY: number },
  target: HTMLElement,
): vec.Vector {
  const rect = target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  return vec.vec(x, y)
}
