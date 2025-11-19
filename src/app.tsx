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
import { createSpring } from './lib/spring'

import styles from './app.module.css'

const spring = createSpring({ stiffness: 300, damping: 30 })

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
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null)
  const [_previewFromIndex, setPreviewFromIndex] = useState<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Handle drag enter - update canvas preview immediately
  const handleDragEnter = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return
      setInsertionIndex(toIndex)
      setPreviewFromIndex(fromIndex)
      // Immediately dispatch for canvas preview
      dispatch({ type: 'move', from: fromIndex, to: toIndex })
    },
    [dispatch],
  )

  const handleDragLeave = useCallback(() => {
    setInsertionIndex(null)
  }, [])

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) {
        setPreviewFromIndex(null)
        setInsertionIndex(null)
        return
      }

      // If we were previewing, the state is already updated
      // Just animate the UI without dispatching again
      const container = containerRef.current
      if (!container) return

      const matrixElements = Array.from(
        container.querySelectorAll('[data-matrix-id]'),
      )
      
      // Capture current positions (already in final state from preview)
      const currentPositions = new Map<string, DOMRect>()
      matrixElements.forEach((el) => {
        const id = el.getAttribute('data-matrix-id')
        if (id) {
          currentPositions.set(id, el.getBoundingClientRect())
        }
      })

      // Calculate where elements should have been before the swap
      const elementWidth = 240 + 8 // matrix width + gap
      const startPositions = new Map<string, { left: number; top: number }>()
      
      matrixElements.forEach((el) => {
        const id = el.getAttribute('data-matrix-id')
        if (!id) return
        
        const current = currentPositions.get(id)
        if (!current) return
        
        // Determine the visual offset based on the swap
        let offset = 0
        const currentIndex = Array.from(matrixElements).indexOf(el)
        
        if (currentIndex === toIndex) {
          // This element moved TO the target position
          offset = fromIndex < toIndex ? elementWidth : -elementWidth
        } else if (fromIndex < toIndex && currentIndex > fromIndex && currentIndex <= toIndex) {
          // Elements between from and to shift left
          offset = -elementWidth
        } else if (fromIndex > toIndex && currentIndex >= toIndex && currentIndex < fromIndex) {
          // Elements between to and from shift right
          offset = elementWidth
        }
        
        startPositions.set(id, {
          left: current.left + offset,
          top: current.top,
        })
      })

      setIsAnimating(true)
      setPreviewFromIndex(null)
      setInsertionIndex(null)

      // Set up spring animations for each element
      const springs = new Map<
        Element,
        ReturnType<typeof spring<{ x: number; y: number }>>
      >()

      matrixElements.forEach((el) => {
        const id = el.getAttribute('data-matrix-id')
        if (!id) return

        const startPos = startPositions.get(id)
        const currentPos = currentPositions.get(id)

        if (startPos && currentPos) {
          const deltaX = startPos.left - currentPos.left
          const deltaY = startPos.top - currentPos.top

          if (deltaX !== 0 || deltaY !== 0) {
            const s = spring({ x: deltaX, y: deltaY })
            springs.set(el, s)
            s.set({ x: 0, y: 0 })
          }
        }
      })

      // Animate using spring physics
      let lastTime = performance.now()
      const animate = (currentTime: number) => {
        const delta = currentTime - lastTime
        lastTime = currentTime

        let anyActive = false

        springs.forEach((s, el) => {
          const active = s.update(delta)
          if (active) {
            anyActive = true
            const element = el as HTMLElement
            element.style.transform = `translate(${s.value.x}px, ${s.value.y}px)`
          }
        })

        if (anyActive) {
          animationFrameRef.current = requestAnimationFrame(animate)
        } else {
          // Clean up after animation
          springs.forEach((_, el) => {
            const element = el as HTMLElement
            element.style.transform = ''
          })
          setIsAnimating(false)
          animationFrameRef.current = null
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    },
    [dispatch],
  )

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

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
            onDragEnter={(fromIndex) => handleDragEnter(fromIndex, i)}
            onDragLeave={handleDragLeave}
          />
        ))}
        {insertionIndex !== null && (
          <div
            className={styles.insertionIndicator}
            style={{
              left: `${insertionIndex * (240 + 8)}px`,
            }}
          />
        )}
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
