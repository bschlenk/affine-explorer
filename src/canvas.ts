import * as mat from '@bschlenk/mat'

import { composeMatrixPolar, decomposeMatrixPolar } from './lib/matrix-utils'
import { createSpring } from './lib/spring'
import { renderSprite } from './lib/sprite/sprite'

const spring = createSpring({ stiffness: 170, damping: 26 })

export class Canvas {
  private ctx: CanvasRenderingContext2D
  private dirty = true
  private matrix = spring.indirect(
    mat.IDENTITY,
    decomposeMatrixPolar as any,
    composeMatrixPolar as any,
  )
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
      },
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

  private resetScale() {
    const dpr = window.devicePixelRatio
    const t = this.ctx.getTransform()

    const scaleX = Math.sqrt(t.a ** 2 + t.b ** 2)
    const scaleY = Math.sqrt(t.c ** 2 + t.d ** 2)

    this.ctx.scale((1 / scaleX) * dpr, (1 / scaleY) * dpr)
  }

  private renderLoop() {
    let lastTime = performance.now()

    const loop = (time: number) => {
      const delta = time - lastTime
      lastTime = time

      if (this.dirty) {
        this.dirty = false

        this.update(time, delta)
        this.reset()
        this.render()
      }

      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)
  }

  private update(_time: number, delta: number) {
    this.dirty ||= this.matrix.update(delta)
  }

  private render() {
    const ctx = this.ctx
    ctx.translate(this.width / 2, this.height / 2)

    // drag the origin before updating the matrix so it stays in screen space
    this.drawOrigin()

    mat.toCanvas(this.matrix.value, ctx)

    this.drawLabels()
    this.drawGrid()
    this.drawRect(0, 0, 100, 100, '#2c2c2c')
    this.drawCircle(0, 0, 5, '#458588')
  }

  private drawOrigin() {
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

  private drawLabels() {
    // draw a number label at each grid intersection

    // need to figure out the relative viewport bounding box again
    // but for now let's just make sure we label a 16x16 square

    const ctx = this.ctx
    ctx.save()

    ctx.fillStyle = '#444'

    // draw horizontal labels
    for (let x = -8; x < 8; x++) {
      ctx.save()
      ctx.translate(x * 100, 0)
      this.resetScale()
      ctx.translate(2, -1)
      ctx.scale(2, 2)

      const label = '' + x * 100
      for (let i = 0; i < label.length; ++i) {
        const width = renderSprite(ctx, label.charCodeAt(i))

        // todo: variable letter spacing
        ctx.translate(width + 1, 0)
      }
      ctx.restore()
    }

    // draw vertical labels
    for (let y = -8; y < 8; y++) {
      ctx.save()
      ctx.translate(0 + 2, y * 100 - 1)
      this.resetScale()
      ctx.translate(2, -1)
      ctx.scale(2, 2)

      const label = '' + y * 100
      for (let i = 0; i < label.length; ++i) {
        const width = renderSprite(ctx, label.charCodeAt(i))

        // todo: variable letter spacing
        ctx.translate(width + 1, 0)
      }
      ctx.restore()
    }

    ctx.restore()
  }

  private drawGrid() {
    const ctx = this.ctx
    const { width, height } = this

    let left = -width / 2
    let right = width / 2
    let top = -height / 2
    let bottom = height / 2

    // TODO: extract this to some kind of viewport bounds helper
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

  private drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
  ) {
    const ctx = this.ctx

    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, width, height)

    ctx.save()
    this.resetTransform()
    ctx.fillStyle = fill
    ctx.strokeStyle = '#fff'
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    ctx.fillStyle = '#ccc'
    ctx.font = '72px Inter'
    const m = ctx.measureText('R')
    ctx.fillText(
      'R',
      x + width / 2 - m.width / 2,
      y + height / 2 + m.actualBoundingBoxAscent / 2,
    )

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
