import { useCallback, useEffect, useRef, useState } from 'react'
import * as mat from '@bschlenk/mat'

import { Canvas } from './canvas'
import { Matrix } from './components/matrix'
import {
  useMatrices,
  UseMatricesDispatch,
  WrappedMatrix,
} from './hooks/use-matrices'
import { setRef } from './lib/set-ref'

import styles from './app.module.css'

export function App() {
  const values = useMatrices()

  return (
    <>
      <Display matrix={values.matrix} />
      <MatrixControls {...values} />
    </>
  )
}

interface DisplayProps {
  matrix: mat.Matrix
}

function Display({ matrix }: DisplayProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  const canvasRef = useRef<Canvas | null>(null)
  const refCb = useCallback((el: HTMLCanvasElement | null) => {
    setRef(ref, el)

    if (el) {
      canvasRef.current = new Canvas(el)
    }
  }, [])

  useEffect(() => {
    if (canvasRef.current && mat.isValid(matrix)) {
      canvasRef.current.updateMatrix(matrix)
    }
  }, [matrix])

  return <canvas ref={refCb} className={styles.canvas} />
}

interface MatrixControlsProps {
  matrices: WrappedMatrix[]
  matrix: mat.Matrix
  dispatch: UseMatricesDispatch
}

function MatrixControls({ matrices, matrix, dispatch }: MatrixControlsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return

      // Capture positions before reorder
      const container = containerRef.current
      if (!container) return

      const matrixElements = Array.from(
        container.querySelectorAll('[data-matrix-id]'),
      )
      const oldPositions = new Map<string, DOMRect>()

      matrixElements.forEach((el) => {
        const id = el.getAttribute('data-matrix-id')
        if (id) {
          oldPositions.set(id, el.getBoundingClientRect())
        }
      })

      // Perform the reorder
      dispatch({ type: 'move', from: fromIndex, to: toIndex })

      // Wait for React to update the DOM
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const newMatrixElements = Array.from(
            container.querySelectorAll('[data-matrix-id]'),
          )

          setIsAnimating(true)

          newMatrixElements.forEach((el) => {
            const id = el.getAttribute('data-matrix-id')
            if (!id) return

            const oldPos = oldPositions.get(id)
            const newPos = el.getBoundingClientRect()

            if (oldPos && newPos) {
              const deltaX = oldPos.left - newPos.left
              const deltaY = oldPos.top - newPos.top

              if (deltaX !== 0 || deltaY !== 0) {
                const element = el as HTMLElement
                // Set initial position (where it was)
                element.style.transform = `translate(${deltaX}px, ${deltaY}px)`
                element.style.transition = 'none'

                // Force a reflow
                void element.offsetHeight

                // Animate to final position
                element.style.transition = 'transform 0.3s ease-out'
                element.style.transform = 'translate(0, 0)'
              }
            }
          })

          // Clean up after animation
          setTimeout(() => {
            newMatrixElements.forEach((el) => {
              const element = el as HTMLElement
              element.style.transform = ''
              element.style.transition = ''
            })
            setIsAnimating(false)
          }, 300)
        })
      })
    },
    [dispatch],
  )

  return (
    <div className={styles.controls}>
      <div ref={containerRef} className={styles.section}>
        {matrices.map(({ id, visible, value }, i) => (
          <Matrix
            key={id}
            index={i}
            matrixId={id}
            matrix={value}
            visible={visible}
            isAnimating={isAnimating}
            toggleMatrix={() => {
              dispatch({ type: 'update', index: i, visible: !visible })
            }}
            setMatrix={(value) => {
              if (value) {
                dispatch({ type: 'update', index: i, value })
              } else {
                dispatch({ type: 'delete', index: i })
              }
            }}
            moveMatrix={(dir) => {
              dispatch({ type: 'move', from: i, to: i + dir })
            }}
            cloneMatrix={() => {
              dispatch({ type: 'insert', value, after: matrices[i] })
            }}
            onReorder={handleReorder}
          />
        ))}
        <button
          className={styles.button}
          onClick={() => dispatch({ type: 'insert', value: mat.IDENTITY })}
        >
          +
        </button>
      </div>
      <div className={styles.section}>
        <div className={styles.equals}>=</div>
        <Matrix readonly matrix={matrix} />
      </div>
    </div>
  )
}
