export function areClose(a: number, b: number, epsilon = Number.EPSILON) {
  return Math.abs(a - b) < epsilon
}
