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
  from: number
  to: number
}

type Action = ActionUpdate | ActionInsert | ActionDelete | ActionMove

export type UseMatricesDispatch = React.Dispatch<Action>

export interface MatrixWithId {
  id: number
  value: mat.Matrix
}

export function useMatrices() {
  const [matrices, dispatch] = useReducer(reducer, [], () => [
    { id: nextId++, value: mat.IDENTITY },
  ])

  const matrix = useMemo(
    () => mat.mult(...matrices.map((m) => m.value)),
    [matrices]
  )

  return { matrices, matrix, dispatch }
}

let nextId = 0

function reducer(matrices: MatrixWithId[], action: Action): MatrixWithId[] {
  switch (action.type) {
    case 'update':
      return [
        ...matrices.slice(0, action.index),
        { id: matrices[action.index].id, value: mat.round(action.value) },
        ...matrices.slice(action.index + 1),
      ]

    case 'insert':
      return [...matrices, { id: nextId++, value: mat.round(action.value) }]

    case 'delete': {
      const newMatrices = [
        ...matrices.slice(0, action.index),
        ...matrices.slice(action.index + 1),
      ]

      return newMatrices.length > 0
        ? newMatrices
        : [{ id: nextId++, value: mat.IDENTITY }]
    }

    case 'move': {
      const { from, to } = action
      if (from === to || to < 0 || to >= matrices.length) return matrices

      const newMatrices = [...matrices]
      const temp = newMatrices[from]
      newMatrices[from] = newMatrices[to]
      newMatrices[to] = temp
      return newMatrices
    }
  }
}
