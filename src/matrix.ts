import { areClose } from './util'

interface Vector {
  x: number
  y: number
}

interface MatrixMut {
  xx: number
  xy: number
  yx: number
  yy: number
  dx: number
  dy: number
}

export type MatrixElement = keyof MatrixMut

/**
 * A 2D affine transformation matrix.
 */
export type Matrix = Readonly<MatrixMut>

export const IDENTITY: Matrix = mat(1, 0, 0, 1, 0, 0)

/**
 * Create a new Matrix, passing values in column-major order.
 */
export function mat(
  xx: number,
  xy: number,
  yx: number,
  yy: number,
  dx: number,
  dy: number
): Matrix {
  return { xx, xy, yx, yy, dx, dy }
}

export function translate(x: number, y: number): Matrix {
  return mat(1, 0, 0, 1, x, y)
}

export function rotate(angle: number): Matrix {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return mat(cos, sin, -sin, cos, 0, 0)
}

export function rotateAt(angle: number, cx: number, cy: number): Matrix {
  return transformFrom(rotate(angle), cx, cy)
}

export function scale(x: number, y = x): Matrix {
  return mat(x, 0, 0, y, 0, 0)
}

export function scaleAt(x: number, y: number, cx: number, cy: number): Matrix {
  return transformFrom(scale(x, y), cx, cy)
}

export function mult(...matrices: Matrix[]): Matrix {
  if (matrices.length === 0) return IDENTITY

  let m = matrices[0]
  for (let i = 1; i < matrices.length; ++i) {
    m = mult2(m, matrices[i])
  }

  return m
}

export function determinant(m: Matrix) {
  return m.xx * m.yy - m.xy * m.yx
}

export function invert(m: Matrix) {
  const det = determinant(m)
  if (det === 0) return null

  return mat(
    m.yy / det,
    -m.xy / det,
    -m.yx / det,
    m.xx / det,
    (m.yx * m.dy - m.yy * m.dx) / det,
    (m.xy * m.dx - m.xx * m.dy) / det
  )
}

export function transformPoint(v: Vector, m: Matrix) {
  return {
    x: m.xx * v.x + m.yx * v.y + m.dx,
    y: m.xy * v.x + m.yy * v.y + m.dy,
  }
}

export function inverseTransformPoint(v: Vector, m: Matrix) {
  const mi = invert(m)
  return mi ? transformPoint(v, mi) : null
}

export function equals(a: Matrix, b: Matrix) {
  return (
    areClose(a.xx, b.xx) &&
    areClose(a.xy, b.xy) &&
    areClose(a.yx, b.yx) &&
    areClose(a.yy, b.yy) &&
    areClose(a.dx, b.dx) &&
    areClose(a.dy, b.dy)
  )
}

export function isIdentity(m: Matrix) {
  return equals(m, IDENTITY)
}

/**
 * Generate a css transform property value from a Matrix.
 *
 * The only difference between this and `toSvg` is that the values
 * are separated by commas instead of spaces.
 */
export function toCss(m: Matrix) {
  return `matrix(${m.xx}, ${m.xy}, ${m.yx}, ${m.yy}, ${m.dx}, ${m.dy})`
}

/**
 * Generate an SVG transform attribute from a Matrix.
 *
 * The only difference between this and `toCss` is that the values
 * are separated by spaces instead of commas.
 */
export function toSvg(m: Matrix) {
  return `matrix(${m.xx} ${m.xy} ${m.yx} ${m.yy} ${m.dx} ${m.dy})`
}

export function apply(m: Matrix, ctx: CanvasRenderingContext2D) {
  ctx.transform(m.xx, m.xy, m.yx, m.yy, m.dx, m.dy)
}

function mult2(a: Matrix, b: Matrix): Matrix {
  return mat(
    a.xx * b.xx + a.xy * b.yx,
    a.xx * b.xy + a.xy * b.yy,
    a.yx * b.xx + a.yy * b.yx,
    a.yx * b.xy + a.yy * b.yy,
    a.dx * b.xx + a.dy * b.yx + b.dx,
    a.dx * b.xy + a.dy * b.yy + b.dy
  )
}

function transformFrom(m: Matrix, centerX: number, centerY: number): Matrix {
  return mult(translate(centerX, centerY), m, translate(-centerX, -centerY))
}
