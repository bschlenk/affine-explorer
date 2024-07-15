import * as mat from '@bschlenk/mat'
import * as vec from '@bschlenk/vec'

interface MatrixPolar {
  xa: number
  xr: number
  ya: number
  yr: number
  tx: number
  ty: number
}

export function decomposeMatrixPolar(m: mat.Matrix): MatrixPolar {
  const { a: xa, r: xr } = vec.toPolar({ x: m.xx, y: m.xy })
  const { a: ya, r: yr } = vec.toPolar({ x: m.yx, y: m.yy })
  const tx = m.dx
  const ty = m.dy

  return { xa, xr, ya, yr, tx, ty }
}

export function composeMatrixPolar(p: MatrixPolar): mat.Matrix {
  const { x: xx, y: xy } = vec.fromPolar({ a: p.xa, r: p.xr })
  const { x: yx, y: yy } = vec.fromPolar({ a: p.ya, r: p.yr })
  const dx = p.tx
  const dy = p.ty

  return { xx, xy, yx, yy, dx, dy }
}

export function correctAngle(angle: number, target: number) {
  const diff = Math.abs(target - angle)
  return (
    diff <= Math.PI ? angle
    : angle > target ? angle - Math.PI * 2
    : angle + Math.PI * 2
  )
}
