import { ChangeEvent } from 'react'

import styles from './input.module.css'

const formatter = new Intl.NumberFormat(undefined, {
  // change this dynamically so the input isn't longer than 5 characters?
  maximumFractionDigits: 2,
  useGrouping: false,
})

export interface NumberInputProps {
  name?: string
  value: number
  step?: number
  icon?: React.ReactNode
  readOnly?: boolean
  onChange(value: number, e: ChangeEvent<HTMLInputElement>): void
}

export function NumberInput({
  name,
  value,
  step = 1,
  icon,
  readOnly,
  onChange,
}: NumberInputProps) {
  return (
    <div className={styles.root}>
      {icon}
      <input
        className={styles.input}
        type="number"
        name={name}
        value={value}
        step={step}
        readOnly={readOnly}
        onChange={(e) => {
          const value = +e.target.value
          onChange(value, e)
        }}
      />
    </div>
  )
}
