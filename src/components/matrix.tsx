import * as mat from '@bschlenk/mat'
import { useCallback } from 'react'

import styles from './matrix.module.css'
import { RAD2DEG } from '@bschlenk/util'
import { IconRotate } from './icon-rotate'
import { IconScale } from './icon-scale'

type MatrixElement = keyof mat.Matrix

export interface MatrixProps {
  matrix: mat.Matrix
  readonly?: boolean
  setMatrix?: (matrix: mat.Matrix | null) => void
  moveMatrix?: (dir: 1 | -1) => void
}

export function Matrix({
  matrix,
  readonly,
  setMatrix,
  moveMatrix,
}: MatrixProps) {
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value)
      const name = e.target.name as MatrixElement

      setMatrix?.({ ...matrix, [name]: value })
    },
    [matrix, setMatrix]
  )

  const rot = mat.getRotation(matrix)
  const rotDeg = rot * RAD2DEG
  const scale = Math.sqrt(matrix.xx ** 2 + matrix.xy ** 2)

  return (
    <div className={styles.root}>
      <div className={styles.values}>
        {(Object.keys(matrix) as MatrixElement[]).map((key) => (
          <input
            key={key}
            className={styles.input}
            type="number"
            name={key}
            value={matrix[key]}
            readOnly={readonly}
            onChange={onChange}
          />
        ))}
      </div>
      <div className={styles.aux}>
        <div className={styles.inputWrapper}>
          <IconRotate />
          <input
            className={styles.input}
            type="number"
            value={rotDeg}
            readOnly={readonly}
            onChange={(e) => {
              const rotDeg = parseFloat(e.target.value)
              const newRot = (rotDeg * Math.PI) / 180

              setMatrix?.(mat.mult(matrix, mat.rotate(newRot - rot)))
            }}
          />
        </div>
        <div className={styles.inputWrapper}>
          <IconScale />
          <input
            className={styles.input}
            type="number"
            step="0.1"
            value={scale}
            readOnly={readonly}
            onChange={(e) => {
              const scale = parseFloat(e.target.value)
              let m = mat.mult(
                matrix,
                mat.scale(scale / matrix.xx, scale / matrix.yy)
              )

              if (!mat.isValid(m)) {
                m = mat.scale(scale)
              }

              setMatrix?.(m)
            }}
          />
        </div>
      </div>
      <div className={styles.footer}></div>
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
