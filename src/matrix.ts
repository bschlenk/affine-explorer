type MatrixArray = [number, number, number, number, number, number]

const IDENTITY = [1, 0, 0, 1, 0, 0] as MatrixArray

/**
 * An affine transform matrix, storing values in column-major order.
 */
export class Matrix {
  public readonly values: MatrixArray

  /** Construct an identity matrix. */
  constructor()

  /** Construct a matrix given each value as separate args. */
  constructor(
    xx: number,
    xy: number,
    yx: number,
    yy: number,
    dx: number,
    dy: number,
  )

  /** Construct a matrix from a MatrixArray. */
  constructor(values: MatrixArray)

  constructor(...args: any[]) {
    if (args.length === 6) {
      this.values = args as MatrixArray
    } else if (args.length === 1 && Array.isArray(args[0])) {
      this.values = args[0] as MatrixArray
    } else {
      // args must be 0 length
      this.values = IDENTITY
    }
  }

  static withTranslation(x: number, y: number): Matrix {
    return new Matrix(1, 0, 0, 1, x, y)
  }

  static withRotation(angle: number): Matrix {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return new Matrix(cos, sin, -sin, cos, 0, 0)
  }

  static withScale(x: number, y = x): Matrix {
    return new Matrix(x, 0, 0, y, 0, 0)
  }

  mult(other: Matrix) {
    const [xx, xy, yx, yy, dx, dy] = this.values
    const [oxx, oxy, oyx, oyy, odx, ody] = other.values

    return new Matrix(
      xx * oxx + xy * oyx,
      xx * oxy + xy * oyy,
      yx * oxx + yy * oyx,
      yx * oxy + yy * oyy,
      dx * oxx + dy * oyx + odx,
      dx * oxy + dy * oyy + ody,
    )
  }

  preMult(other: Matrix) {
    return other.mult(this)
  }

  translate(x: number, y: number) {
    return this.mult(Matrix.withTranslation(x, y))
  }

  preTranslate(x: number, y: number) {
    return Matrix.withTranslation(x, y).mult(this)
  }

  rotate(angle: number) {
    return this.mult(Matrix.withRotation(angle))
  }

  preRotate(angle: number) {
    return Matrix.withRotation(angle).mult(this)
  }

  scale(x: number, y = x): Matrix {
    return this.mult(Matrix.withScale(x, y))
  }

  preScale(x: number, y = x): Matrix {
    return Matrix.withScale(x, y).mult(this)
  }

  determinant() {
    const [xx, xy, yx, yy] = this.values
    return xx * yy - xy * yx
  }

  invert() {
    const det = this.determinant()
    if (det === 0) return null

    const invDet = 1 / det
    const [xx, xy, yx, yy, dx, dy] = this.values

    return new Matrix(
      yy * invDet,
      -xy * invDet,
      -yx * invDet,
      xx * invDet,
      (yx * dy - yy * dx) * invDet,
      (xy * dx - xx * dy) * invDet,
    )
  }

  transformPoint({ x, y }: IPoint) {
    const [xx, xy, yx, yy, dx, dy] = this.values
    return {
      x: xx * x + yx * y + dx,
      y: xy * x + yy * y + dy,
    }
  }

  apply(ctx: CanvasRenderingContext2D) {
    ctx.transform(...this.values)
  }

  toCss() {
    const [xx, xy, yx, yy, dx, dy] = this.values
    return `matrix(${xx}, ${xy}, ${yx}, ${yy}, ${dx}, ${dy})`
  }
}

interface IPoint {
  x: number
  y: number
}
