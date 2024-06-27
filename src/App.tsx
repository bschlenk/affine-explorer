import { Canvas } from './canvas'
import { useCallback, useEffect, useReducer, useRef } from 'react'
import * as mat from '@bschlenk/mat'

import styles from './app.module.css'
import { Matrix } from './components/matrix'

interface ActionUpdate {
  type: 'update'
  index: number
  value: mat.Matrix
}

interface ActionInsert {
  type: 'insert'
  value: mat.Matrix
}

interface ActionDelete {
  type: 'delete'
  index: number
}

interface ActionMove {
  type: 'move'
  index: number
  dir: 1 | -1
}

type Action = ActionUpdate | ActionInsert | ActionDelete | ActionMove

function reducer(matrices: mat.Matrix[], action: Action): mat.Matrix[] {
  switch (action.type) {
    case 'update':
      return [
        ...matrices.slice(0, action.index),
        mat.round(action.value),
        ...matrices.slice(action.index + 1),
      ]

    case 'insert':
      return [...matrices, mat.round(action.value)]

    case 'delete': {
      const newMatrices = [
        ...matrices.slice(0, action.index),
        ...matrices.slice(action.index + 1),
      ]

      return newMatrices.length > 0 ? newMatrices : [mat.IDENTITY]
    }

    case 'move': {
      const { index: i, dir } = action
      if (i + dir < 0 || i + dir >= matrices.length) return matrices

      const newMatrices = [...matrices]
      const temp = newMatrices[i]
      newMatrices[i] = newMatrices[i + dir]
      newMatrices[i + dir] = temp
      return newMatrices
    }
  }
}

export function App() {
  const [matrices, dispatch] = useReducer(reducer, null, () => [mat.IDENTITY])
  const matrix = mat.mult(...matrices)

  return (
    <>
      <MatrixControls matrices={matrices} dispatch={dispatch} />
      <Display matrix={matrix} />
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

function MatrixControls({
  matrices,
  dispatch,
}: {
  matrices: mat.Matrix[]
  dispatch: React.Dispatch<Action>
}) {
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
        <Matrix readonly matrix={mat.mult(...matrices)} />
      </div>
    </div>
  )
}
