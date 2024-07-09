import { useMemo, useReducer } from 'react'
import * as mat from '@bschlenk/mat'

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

export type UseMatricesDispatch = React.Dispatch<Action>

export function useMatrices() {
  const [matrices, dispatch] = useReducer(reducer, null, () => [mat.IDENTITY])
  const matrix = useMemo(() => mat.mult(...matrices), [matrices])
  return { matrices, matrix, dispatch }
}

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
