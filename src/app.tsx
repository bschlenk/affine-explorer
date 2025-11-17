import { useCallback, useEffect, useRef } from 'react'
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
  const handleReorder = (fromIndex: number, toIndex: number) => {
    dispatch({ type: 'move', from: fromIndex, to: toIndex })
  }

  return (
    <div className={styles.controls}>
      <div className={styles.section}>
        {matrices.map(({ id, visible, value }, i) => (
          <Matrix
            key={id}
            index={i}
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
