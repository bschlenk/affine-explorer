import { areClose } from '@bschlenk/util'

export interface SpringOptions {
  stiffness?: number
  damping?: number
  mass?: number
}

export interface SpringValue<T, U = T> {
  value: T
  target: U
  set(value: T): void
  update(delta: number): boolean
}

const REST_DELTA = 0.01

export interface SpringMaker {
  <T extends Record<string, number>>(target: T): SpringValue<T>

  indirect<T, U extends Record<string, any>>(
    target: T,
    decompose: (value: T) => U,
    compose: (value: U) => T,
  ): SpringValue<T, U> & { internalValue: U }
}

export function createSpring({
  stiffness = 100,
  damping = 10,
  mass = 1,
}: SpringOptions = {}): SpringMaker {
  const opts = { stiffness, damping, mass }

  function spring<T extends Record<string, number>>(target: T) {
    const keys = Object.keys(target) as (keyof T)[]
    const velocities = keys.map(() => 0)

    return {
      value: structuredClone(target),
      get target() {
        return target
      },
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

          if (
            areClose(currentValue, targetValue, REST_DELTA) &&
            velocity < REST_DELTA
          ) {
            this.value[key] = targetValue
            velocities[i] = 0
            continue
          }

          anyChanged = true

          const next = step(
            delta / 1000,
            currentValue - targetValue,
            velocity,
            opts,
          )

          this.value[key] = (targetValue + next[0]) as T[keyof T]
          velocities[i] = next[1]
        }

        return anyChanged
      },
    }
  }

  function indirect<T, U extends Record<string, number>>(
    target: T,
    decompose: (value: T) => U,
    compose: (value: U) => T,
  ) {
    const s = spring(decompose(target))

    return {
      get value() {
        return compose(s.value)
      },
      get target() {
        return s.target
      },
      set(value: T) {
        s.set(decompose(value))
      },
      get internalValue(): U {
        return s.value
      },
      update(delta: number) {
        return s.update(delta)
      },
    }
  }

  spring.indirect = indirect

  return spring
}

function step(
  delta: number,
  displacement: number,
  velocity: number,
  opts: Required<SpringOptions>,
) {
  // Spring stiffness, in kg / s^2
  const k = -opts.stiffness

  // Damping constant, in kg / s
  const d = -opts.damping

  const fSpring = k * displacement
  const fDamping = d * velocity

  const a = (fSpring + fDamping) / opts.mass
  velocity += a * delta
  displacement += velocity * delta

  return [displacement, velocity]
}
