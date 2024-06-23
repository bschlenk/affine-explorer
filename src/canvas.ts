import * as mat from './matrix'

export class Canvas {
  private ctx: CanvasRenderingContext2D
  private dirty = true
  private matrix = mat.IDENTITY
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
    this.matrix = matrix
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

  private render(_time: number, _delta: number) {
    if (!this.dirty) return
    this.dirty = false

    this.reset()

    const ctx = this.ctx

    const { width, height } = this
    mat.apply(mat.translate(width / 2, height / 2), ctx)
    mat.apply(this.matrix, ctx)

    this.drawGrid()

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, 100, 100)
    ctx.fillStyle = 'red'
    ctx.strokeStyle = 'blue'
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    this.drawCircle(0, 0, 5, 'rgb(69, 133, 136)')
  }

  private drawGrid() {
    const ctx = this.ctx
    const { width, height } = this

    ctx.save()
    ctx.beginPath()

    // TODO: get a viewport rect in canvas space and draw lines out to it
    // instead of using width & height

    // Draw vertical grid lines

    for (let d = 0; d < width; d += 100) {
      ctx.moveTo(d, -height)
      ctx.lineTo(d, height)
    }

    for (let d = -100; d > -width; d -= 100) {
      ctx.moveTo(d, -height)
      ctx.lineTo(d, height)
    }

    // Draw horizontal grid lines

    for (let d = 0; d < height; d += 100) {
      ctx.moveTo(-width, d)
      ctx.lineTo(width, d)
    }

    for (let d = -100; d > -height; d -= 100) {
      ctx.moveTo(-width, d)
      ctx.lineTo(width, d)
    }

    this.resetTransform()
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 0.5
    this.ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(-width, 0)
    ctx.lineTo(width, 0)
    ctx.moveTo(0, -height)
    ctx.lineTo(0, height)

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
