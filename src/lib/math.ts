export function snap(val: number, step: number) {
  return Math.round(val / step) * step
}

export function snapUp(val: number, step: number) {
  return Math.ceil(val / step) * step
}

export function snapDown(val: number, step: number) {
  return Math.floor(val / step) * step
}
