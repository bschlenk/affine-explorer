import { useCallback } from 'react'
import * as mat from '@bschlenk/mat'
import { DEG2RAD, RAD2DEG } from '@bschlenk/util'

import { IconRotate } from './icon-rotate'
import { IconScale } from './icon-scale'
import { NumberInput } from './input'

import styles from './matrix.module.css'

type MatrixElement = keyof mat.Matrix

export interface MatrixProps {
  matrix: mat.Matrix
  readonly?: boolean
  setMatrix?: (matrix: mat.Matrix | null) => void
  moveMatrix?: (dir: 1 | -1) => void
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void
}

export function Matrix({
  matrix,
  readonly,
  setMatrix,
  moveMatrix,
  onDragStart,
  onDragEnter,
}: MatrixProps) {
  const onChange = useCallback(
    (value: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.name as MatrixElement
      setMatrix?.({ ...matrix, [name]: value })
    },
    [matrix, setMatrix],
  )

  const rot = mat.getRotation(matrix)
  const rotDeg = rot * RAD2DEG
  const scale = Math.sqrt(matrix.xx ** 2 + matrix.xy ** 2)

  return (
    <div
      className={styles.root}
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
    >
      <div className={styles.values}>
        {(Object.keys(matrix) as MatrixElement[]).map((key) => (
          <NumberInput
            key={key}
            name={key}
            value={matrix[key]}
            readOnly={readonly}
            onChange={onChange}
          />
        ))}
      </div>
      <div className={styles.aux}>
        <NumberInput
          value={rotDeg}
          readOnly={readonly}
          icon={<IconRotate />}
          onChange={(value) => {
            const newRot = value * DEG2RAD
            setMatrix?.(mat.mult(matrix, mat.rotate(newRot - rot)))
          }}
        />
        <NumberInput
          step={0.1}
          value={scale}
          readOnly={readonly}
          icon={<IconScale />}
          onChange={(value) => {
            let m = mat.mult(
              matrix,
              mat.scale(value / matrix.xx, value / matrix.yy),
            )

            if (!mat.isValid(m)) {
              m = mat.scale(value)
            }

            setMatrix?.(m)
          }}
        />
      </div>
      {!readonly && (
        <div className={styles.above}>
          <button className={styles.button} onClick={() => moveMatrix?.(-1)}>
            ←
          </button>
          <button className={styles.button} onClick={() => moveMatrix?.(1)}>
            →
          </button>
          <button className={styles.button} onClick={() => setMatrix?.(null)}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
