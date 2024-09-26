import { useLayoutEffect, useRef } from 'react'

import styles from './input.module.css'

export type InputChangeEvent =
  | React.ChangeEvent<HTMLInputElement>
  | React.KeyboardEvent<HTMLInputElement>

export interface NumberInputProps {
  name?: string
  value: number
  step?: number
  icon?: React.ReactNode
  readOnly?: boolean
  onChange: (value: number, e: InputChangeEvent) => void
}

export function NumberInput({
  name,
  value,
  step = 1,
  icon,
  readOnly,
  onChange,
}: NumberInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.value = format(value)
    }
  }, [value])

  return (
    <div className={styles.root}>
      {icon}
      <input
        ref={ref}
        className={styles.input}
        type="number"
        name={name}
        step={step}
        readOnly={readOnly}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => {
          const value = +e.target.value
          onChange(value, e)
        }}
        onKeyDown={(e) => {
          const t = e.target as HTMLInputElement
          const s = step * (e.shiftKey ? 10 : 1)

          switch (e.key) {
            case 'ArrowUp':
              onChange(value + s, e)
              break

            case 'ArrowDown':
              onChange(value - s, e)
              break

            case 'Enter': {
              const value = +t.value
              onChange(value, e)
              t.select()
              break
            }

            case 'Escape': {
              t.value = format(value)
              t.blur()
              break
            }

            default:
              return
          }

          e.preventDefault()
        }}
      />
    </div>
  )
}

function createFormatter(maximumFractionDigits: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
    useGrouping: false,
  })
}

const f4 = createFormatter(4)
const f3 = createFormatter(3)
const f2 = createFormatter(2)
const f1 = createFormatter(1)

const fs = [f4, f3, f2]

function format(value: number) {
  const ideal = fs.length + 3

  for (const f of fs) {
    const vi = f.format(value)
    if (vi.length <= ideal) return vi
  }

  return f1.format(value)
}
