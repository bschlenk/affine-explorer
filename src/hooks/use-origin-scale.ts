import * as mat from '@bschlenk/mat'
import * as vec from '@bschlenk/vec'

import { listen } from '../lib/event'

export interface OriginScale {
  origin: vec.Vector
  scale: number
}

export const DEFAULT_ORIGIN_SCALE: OriginScale = {
  origin: { x: 0, y: 0 },
  scale: 1,
}

export function originScaleToCanvas(
  { origin: { x, y }, scale }: OriginScale,
  ctx: CanvasRenderingContext2D,
) {
  ctx.transform(scale, 0, 0, scale, x, y)
}

export function originScaletoMat({
  origin: { x, y },
  scale,
}: OriginScale): mat.Matrix {
  return mat.mat(scale, 0, 0, scale, x, y)
}

export function setupOriginScaleListener(
  el: HTMLElement,
  cb: (update: (e: OriginScale) => OriginScale) => void,
) {
  return listen(
    el,
    'wheel',
    (e) => {
      e.preventDefault()

      const { deltaX, deltaY, ctrlKey } = e

      if (ctrlKey) {
        // zoom
        const mouse = relativeMouse(e, e.currentTarget! as HTMLElement)

        cb((value) => {
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
        cb((value) => {
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
  )
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
