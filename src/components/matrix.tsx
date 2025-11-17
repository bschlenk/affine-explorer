import { useCallback } from 'react'
import * as mat from '@bschlenk/mat'
import { DEG2RAD, RAD2DEG } from '@bschlenk/util'

import { IconClone } from './icon-clone'
import { IconInvert } from './icon-invert'
import { IconRotate } from './icon-rotate'
import { IconScale } from './icon-scale'
import { IconVisibility } from './icon-visibility'
import { InputChangeEvent, NumberInput } from './input'

import styles from './matrix.module.css'

type MatrixElement = keyof mat.Matrix

export interface MatrixProps {
  matrix: mat.Matrix
  visible?: boolean
  readonly?: boolean
  setMatrix?: (matrix: mat.Matrix | null) => void
  moveMatrix?: (dir: 1 | -1) => void
  cloneMatrix?: () => void
  toggleMatrix?: () => void
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void
}

export function Matrix({
  matrix,
  visible,
  readonly,
  setMatrix,
  moveMatrix,
  cloneMatrix,
  toggleMatrix,
  onDragStart,
  onDragEnter,
}: MatrixProps) {
  const onChange = useCallback(
    (value: number, e: InputChangeEvent) => {
      const name = e.currentTarget.name as MatrixElement
      setMatrix?.({ ...matrix, [name]: value })
    },
    [matrix, setMatrix],
  )

  const rot = mat.getRotation(matrix)
  const rotDeg = rot * RAD2DEG
  const scale = Math.hypot(matrix.xx, matrix.xy)

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
          <button
            className={styles.button}
            onClick={toggleMatrix}
            title={visible ? 'Hide matrix' : 'Show matrix'}
          >
            <IconVisibility />
          </button>
          <button
            className={styles.button}
            onClick={cloneMatrix}
            title="Clone matrix"
          >
            <IconClone />
          </button>
          <button
            className={styles.button}
            onClick={() => {
              const mi = mat.invert(matrix)
              if (mi) setMatrix?.(mi)
            }}
            title="Invert matrix"
          >
            <IconInvert />
          </button>
          <button
            className={styles.button}
            onClick={() => moveMatrix?.(-1)}
            title="Move matrix left"
          >
            ←
          </button>
          <button
            className={styles.button}
            onClick={() => moveMatrix?.(1)}
            title="Move matrix right"
          >
            →
          </button>
          <button
            className={styles.button}
            onClick={() => setMatrix?.(null)}
            title="Delete matrix"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
