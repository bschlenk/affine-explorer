import { useCallback, useEffect, useRef, useState } from 'react'
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import * as mat from '@bschlenk/mat'
import { DEG2RAD, RAD2DEG } from '@bschlenk/util'

import { IconRotate } from './icon-rotate'
import { IconScale } from './icon-scale'
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
  index?: number
  matrixId?: number
  isAnimating?: boolean
  onReorder?: (fromIndex: number, toIndex: number) => void
}

export function Matrix({
  matrix,
  visible,
  readonly,
  setMatrix,
  moveMatrix,
  cloneMatrix,
  toggleMatrix,
  index,
  matrixId,
  isAnimating,
  onReorder,
}: MatrixProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggedOver, setIsDraggedOver] = useState(false)

  const onChange = useCallback(
    (value: number, e: InputChangeEvent) => {
      const name = e.currentTarget.name as MatrixElement
      setMatrix?.({ ...matrix, [name]: value })
    },
    [matrix, setMatrix],
  )

  // Set up draggable behavior
  useEffect(() => {
    const element = ref.current
    if (!element || readonly) return

    return draggable({
      element,
      getInitialData: () => ({ index }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    })
  }, [index, readonly])

  // Set up drop target behavior
  useEffect(() => {
    const element = ref.current
    if (!element || readonly) return

    return dropTargetForElements({
      element,
      onDragEnter: ({ source }) => {
        const sourceIndex = source.data.index
        if (typeof sourceIndex === 'number' && sourceIndex !== index) {
          setIsDraggedOver(true)
        }
      },
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: ({ source }) => {
        setIsDraggedOver(false)
        const sourceIndex = source.data.index
        if (typeof sourceIndex === 'number' && typeof index === 'number') {
          onReorder?.(sourceIndex, index)
        }
      },
    })
  }, [index, readonly, onReorder])

  const rot = mat.getRotation(matrix)
  const rotDeg = rot * RAD2DEG
  const scale = Math.hypot(matrix.xx, matrix.xy)

  return (
    <div
      ref={ref}
      data-matrix-id={matrixId}
      className={`${styles.root} ${isDragging ? styles.dragging : ''} ${isDraggedOver ? styles.draggedOver : ''} ${isAnimating ? styles.animating : ''}`}
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
          <button className={styles.button} onClick={toggleMatrix}>
            {visible ? 'T' : 't'}
          </button>
          <button className={styles.button} onClick={cloneMatrix}>
            c
          </button>
          <button
            className={styles.button}
            onClick={() => {
              const mi = mat.invert(matrix)
              if (mi) setMatrix?.(mi)
            }}
          >
            i
          </button>
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
