import { areClose } from './util'

export interface SpringOptions {
  stiffness?: number
  damping?: number
  mass?: number
}

export function createSpring({
  stiffness = 100,
  damping = 10,
  mass = 1,
}: SpringOptions = {}) {
  const opts = { stiffness, damping, mass }

  return <T extends Record<string, number>>(target: T) => {
    // create an updater that goes over all the values and updates them
    // values can be a single number, an array of numbers, or an object of numbers

    // keys, for each key we need to store the current value, the target value, and the velocity
    const keys = Object.keys(target) as (keyof T)[]

    const velocities = keys.map(() => 0)

    return {
      value: { ...target },
      set(value: T) {
        target = value
      },
      update(delta: number) {
        let anyChanged = false

        for (let i = 0; i < keys.length; ++i) {
          const key = keys[i]
          const targetValue = target[key]
          const currentValue = this.value[key]
          const velocity = velocities[i]

          if (areClose(currentValue, targetValue, 0.001) && velocity < 0.001) {
            this.value[key] = targetValue
            velocities[i] = 0
            continue
          }

          anyChanged = true

          const next = step(
            delta / 1000,
            currentValue - targetValue,
            velocity,
            opts
          )

          this.value[key] = (targetValue + next[0]) as any
          velocities[i] = next[1]
        }

        return anyChanged
      },
    }
  }
}

function step(
  delta: number,
  displacement: number,
  velocity: number,
  opts: Required<SpringOptions>
) {
  /* Spring Length, set to 1 for simplicity */
  const springLength = 0

  /* Spring stiffness, in kg / s^2 */
  const k = -opts.stiffness

  /* Damping constant, in kg / s */
  const d = -opts.damping

  const Fspring = k * (displacement - springLength)
  const Fdamping = d * velocity

  const a = (Fspring + Fdamping) / opts.mass
  velocity += a * delta
  displacement += velocity * delta

  console.log(velocity)

  return [displacement, velocity]
}