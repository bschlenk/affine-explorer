import * as mat from '@bschlenk/mat'

import { createSpring } from './lib/spring'

const spring = createSpring({ stiffness: 170, damping: 26 })

export class Canvas {
  private ctx: CanvasRenderingContext2D
  private dirty = true
  private matrix = spring(mat.IDENTITY)
  private width = 0
  private height = 0

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!

    const rect = this.canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio
    this.width = rect.width
    this.height = rect.height
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr

    this.initBindings()
    this.reset()
    this.renderLoop()
  }

  public updateMatrix(matrix: mat.Matrix) {
    this.dirty = true
    this.matrix.set(matrix)
  }

  private initBindings() {
    const observer = new ResizeObserver(
      (entries: { target: Element; contentRect: DOMRectReadOnly }[]) => {
        const dpr = window.devicePixelRatio
        for (const entry of entries) {
          if (entry.target === this.canvas) {
            const { width, height } = entry.contentRect
            this.canvas.width = width * dpr
            this.canvas.height = height * dpr

            this.width = width
            this.height = height

            this.dirty = true
            break
          }
        }
      }
    )

    observer.observe(this.canvas)
  }

  private reset() {
    this.ctx.reset()
    this.resetTransform()
  }

  private resetTransform() {
    const dpr = window.devicePixelRatio
    this.ctx.resetTransform()
    this.ctx.scale(dpr, dpr)
  }

  private renderLoop() {
    let lastTime = performance.now()

    const loop = (time: number) => {
      const delta = time - lastTime
      lastTime = time
      this.render(time, delta)
      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)
  }

  private render(_time: number, delta: number) {
    if (!this.dirty) return

    if (!this.matrix.update(delta)) {
      this.dirty = false
    }

    this.reset()

    const ctx = this.ctx

    const { width, height } = this
    mat.toCanvas(mat.translate(width / 2, height / 2), ctx)

    if (!mat.isIdentity(this.matrix.value)) {
      this.drawGhostOrigin()
    }

    mat.toCanvas(this.matrix.value, ctx)

    this.drawGrid()

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, 100, 100)
    this.resetTransform()
    ctx.fillStyle = '#2c2c2c'
    ctx.strokeStyle = '#fff'
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    this.drawCircle(0, 0, 5, 'rgb(69, 133, 136)')
  }

  private drawGhostOrigin() {
    const ctx = this.ctx
    const { width, height } = this

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(-width, 0)
    ctx.lineTo(width, 0)
    ctx.moveTo(0, -height)
    ctx.lineTo(0, height)

    ctx.strokeStyle = '#444'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.restore()
  }

  private drawGrid() {
    const ctx = this.ctx
    const { width, height } = this

    let left = -width / 2
    let right = width / 2
    let top = -height / 2
    let bottom = height / 2

    const mi = mat.invert(this.matrix.value)
    if (!mi) return

    const tl = mat.transformPoint(mi, { x: left, y: top })
    const tr = mat.transformPoint(mi, { x: right, y: top })
    const br = mat.transformPoint(mi, { x: right, y: bottom })
    const bl = mat.transformPoint(mi, { x: left, y: bottom })

    left = Math.min(tl.x, tr.x, br.x, bl.x)
    right = Math.max(tl.x, tr.x, br.x, bl.x)
    top = Math.min(tl.y, tr.y, br.y, bl.y)
    bottom = Math.max(tl.y, tr.y, br.y, bl.y)

    ctx.save()
    ctx.beginPath()

    // Draw vertical grid lines

    for (let d = 0; d < right; d += 100) {
      ctx.moveTo(d, top)
      ctx.lineTo(d, bottom)
    }

    for (let d = -100; d > left; d -= 100) {
      ctx.moveTo(d, top)
      ctx.lineTo(d, bottom)
    }

    // Draw horizontal grid lines

    for (let d = 0; d < bottom; d += 100) {
      ctx.moveTo(left, d)
      ctx.lineTo(right, d)
    }

    for (let d = -100; d > top; d -= 100) {
      ctx.moveTo(left, d)
      ctx.lineTo(right, d)
    }

    this.resetTransform()
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 0.5
    this.ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(left, 0)
    ctx.lineTo(right, 0)
    ctx.moveTo(0, top)
    ctx.lineTo(0, bottom)

    this.resetTransform()
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
  }

  private drawCircle(x: number, y: number, radius: number, color: string) {
    const ctx = this.ctx

    ctx.save()

    // We reset the transform but then use the old transform to calculate the
    // offset. This lets us draw a perfect circle at the given x, y position
    // without any distortion.

    const tOld = ctx.getTransform()
    this.resetTransform()
    const tNew = ctx.getTransform()

    const offsetX = tOld.e / tNew.a
    const offsetY = tOld.f / tNew.d

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x + offsetX, y + offsetY, radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
  }
}
