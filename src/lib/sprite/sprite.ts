import { Sprite } from './sprite-impl'

// - 45
const dash = sprite`


xx

`

// . 46
const dot = sprite`



x
`

// / 47
const slash = sprite`
  x
  x
 x
x
`

// 0 48
const zero = sprite`
 x
x x
x x
xx
`

// 1 49
const one = sprite`
x
x
x
x
`

// 2 50
const two = sprite`
xxx
  x
xx
xxx
`

// 3 51
const three = sprite`
xxx
 x
  x
xx
`

// 4 52
const four = sprite`
x x
x x
xxx
  x
`

// 5 53
const five = sprite`
xxx
xx
  x
xx
`

// 6 54
const six = sprite`
xxx
xx
x x
xx
`

// 7 55
const seven = sprite`
xxx
  x
 x
 x
`

// 8 56
const eight = sprite`
xxx
x x
 x
x x
`

// 9 57
const nine = sprite`
xxx
x x
 xx
  x
`

const sprites = [
  dash,
  dot,
  slash,
  zero,
  one,
  two,
  three,
  four,
  five,
  six,
  seven,
  eight,
  nine,
]

export function renderSprite(ctx: CanvasRenderingContext2D, charCode: number) {
  const num = sprites[charCode - 45]
  num.render(ctx)
  return num.width
}

export function renderString(
  ctx: CanvasRenderingContext2D,
  str: string,
  spacing = 1,
) {
  for (let i = 0; i < str.length; ++i) {
    const width = renderSprite(ctx, str.charCodeAt(i))
    ctx.translate(width + spacing, 0)
  }
}

function sprite(template: TemplateStringsArray) {
  return new Sprite(template[0])
}
