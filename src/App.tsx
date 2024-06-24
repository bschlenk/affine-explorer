import { Canvas } from './canvas'
import { useCallback, useEffect, useReducer, useRef } from 'react'
import * as mat from './matrix'

import styles from './app.module.css'

interface ActionUpdate {
  type: 'update'
  index: number
  value: mat.Matrix
}

interface ActionInsert {
  type: 'insert'
  value: mat.Matrix
}

type Action = ActionUpdate | ActionInsert

function reducer(matrices: mat.Matrix[], action: Action): mat.Matrix[] {
  switch (action.type) {
    case 'update':
      return [
        ...matrices.slice(0, action.index),
        action.value,
        ...matrices.slice(action.index + 1),
      ]

    case 'insert':
      return [...matrices, action.value]
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
      {matrices.map((matrix, i) => (
        <MatrixControl
          key={i}
          matrix={matrix}
          setMatrix={(matrix) =>
            dispatch({ type: 'update', index: i, value: matrix })
          }
        />
      ))}
      <button onClick={() => dispatch({ type: 'insert', value: mat.IDENTITY })}>
        Add Matrix
      </button>
    </div>
  )
}

function MatrixControl({
  matrix,
  setMatrix,
}: {
  matrix: mat.Matrix
  setMatrix: (matrix: mat.Matrix) => void
}) {
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value)
      const name = e.target.name as mat.MatrixElement

      setMatrix({ ...matrix, [name]: value })
    },
    [matrix, setMatrix]
  )

  return (
    <div className={styles.matrix}>
      {(Object.keys(matrix) as mat.MatrixElement[]).map((key) => (
        <input
          key={key}
          className={styles.matrixInput}
          type="number"
          name={key}
          value={matrix[key]}
          onChange={onChange}
        />
      ))}
    </div>
  )
}
