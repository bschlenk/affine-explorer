import { Matrix } from './matrix'

export class Canvas {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private dirty = true

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!

    this.initBindings()
    this.renderLoop()
  }

  private initBindings() {
    const onResize = () => {
      this.canvas.width = window.innerWidth
      this.canvas.height = window.innerHeight
    }

    window.addEventListener('resize', onResize)
    onResize()
  }

  private renderLoop() {
    let lastTime = performance.now()

    const loop = (time: number) => {
      const delta = time - lastTime
      lastTime = time
      this.render(time, delta)
      requestAnimationFrame(loop)
    }

    loop(lastTime + 1)
  }

  private render(time: number, delta: number) {
    if (!this.dirty) return

    this.clear()

    const ctx = this.ctx
    ctx.reset()
    const { width, height } = this.canvas
    Matrix.withTranslation(width / 2, height / 2).apply(ctx)

    ctx.save()
    Matrix.withRotation(((time / 50) * Math.PI) / 180).apply(ctx)

    ctx.beginPath()

    let d = -width
    while (d < width) {
      ctx.moveTo(d, -height)
      ctx.lineTo(d, height)
      d += 10
    }

    // ctx.resetTransform()

    this.ctx.strokeStyle = '#141414'
    this.ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(-width, 0)
    ctx.lineTo(width, 0)
    ctx.moveTo(0, -height)
    ctx.lineTo(0, height)
    ctx.lineWidth = 2
    ctx.strokeStyle = 'black'
    ctx.stroke()
    ctx.restore()

    this.drawCircle(0, 0, 5, 'red')

    this.dirty = true
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  public drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
  ) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(x, y, width, height)
  }

  public drawCircle(x: number, y: number, radius: number, color: string) {
    this.ctx.save()
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI)
    this.ctx.stroke()
    this.ctx.restore()
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    color: string,
    fontSize: number = 20,
  ) {
    this.ctx.font = `${fontSize}px Arial`
    this.ctx.fillStyle = color
    this.ctx.fillText(text, x, y)
  }
}
