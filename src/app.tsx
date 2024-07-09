import { useCallback, useEffect, useRef } from 'react'
import * as mat from '@bschlenk/mat'

import { Canvas } from './canvas'
import { Matrix } from './components/matrix'
import { useMatrices, UseMatricesDispatch } from './hooks/use-matrices'

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

function Display({ matrix }: { matrix: mat.Matrix }) {
  const canvasRef = useRef<Canvas | null>(null)
  const ref = useCallback((el: HTMLCanvasElement | null) => {
    if (el) {
      canvasRef.current = new Canvas(el)
    }
  }, [])

  useEffect(() => {
    if (canvasRef.current && mat.isValid(matrix)) {
      canvasRef.current.updateMatrix(matrix)
    }
  }, [matrix])

  return <canvas className={styles.canvas} ref={ref} />
}

interface MatrixControlsProps {
  matrices: mat.Matrix[]
  matrix: mat.Matrix
  dispatch: UseMatricesDispatch
}

function MatrixControls({ matrices, matrix, dispatch }: MatrixControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.section}>
        {matrices.map((matrix, i) => (
          <Matrix
            key={i}
            matrix={matrix}
            setMatrix={(matrix) => {
              if (matrix) {
                dispatch({ type: 'update', index: i, value: matrix })
              } else {
                dispatch({ type: 'delete', index: i })
              }
            }}
            moveMatrix={(dir) => {
              dispatch({ type: 'move', index: i, dir })
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
