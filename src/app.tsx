import { useCallback, useEffect, useRef, useState } from 'react'
import * as mat from '@bschlenk/mat'

import { Canvas } from './canvas'
import { Matrix } from './components/matrix'
import {
  useMatrices,
  UseMatricesDispatch,
  WrappedMatrix,
} from './hooks/use-matrices'
import { childIndex } from './lib/dom'
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
  const [dragging, setDragging] = useState<HTMLElement | null>(null)

  return (
    <div className={styles.controls}>
      <div className={styles.section}>
        {matrices.map(({ id, visible, value }, i) => (
          <Matrix
            key={id}
            matrix={value}
            visible={visible}
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
            onDragStart={(e) => {
              setDragging(e.target as HTMLElement)
            }}
            onDragEnter={(e) => {
              if (e.target !== e.currentTarget) return

              const from = childIndex(dragging!)
              const to = childIndex(e.target as HTMLElement)

              dispatch({ type: 'move', from: from, to: to })
            }}
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
