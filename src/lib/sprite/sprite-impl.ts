export class Sprite {
  width!: number
  height!: number

  constructor(private readonly sprite: string) {
    this.computeSize()
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.beginPath()

    const s = this.sprite
    const n = s.length - 1
    let x = 0
    let y = -this.height

    for (let i = 1; i < n; ++i) {
      switch (s.charCodeAt(i)) {
        // @ts-expect-error intentional fallthrough
        case 120 /* x */: {
          ctx.rect(x, y, 1, 1)
        }

        // eslint-disable-next-line no-fallthrough
        case 32 /*   */: {
          ++x
          break
        }

        case 10 /* \n */: {
          x = 0
          ++y
          break
        }
      }
    }

    ctx.fill()
    ctx.restore()
  }

  private computeSize() {
    const s = this.sprite
    const n = s.length - 1
    let height = 0
    let width = 0

    let runningWidth = 0

    for (let i = 0; i < n; ++i) {
      switch (s.charCodeAt(i)) {
        case 10 /* \n */:
          ++height
          width = Math.max(width, runningWidth)
          runningWidth = 0
          break

        default:
          ++runningWidth
          break
      }
    }

    this.width = width
    this.height = height
  }
}
