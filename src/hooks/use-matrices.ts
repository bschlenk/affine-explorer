import { useMemo, useReducer } from 'react'
import * as mat from '@bschlenk/mat'

interface ActionUpdate {
  type: 'update'
  index: number
  value?: mat.Matrix
  visible?: boolean
}

interface ActionInsert {
  type: 'insert'
  value: mat.Matrix
  after?: WrappedMatrix
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

export interface WrappedMatrix {
  id: number
  visible: boolean
  value: mat.Matrix
}

export function useMatrices() {
  const [matrices, dispatch] = useReducer(reducer, [], () => [
    wrapMatrix(mat.IDENTITY),
  ])

  const matrix = useMemo(
    () =>
      clean(
        mat.mult(...matrices.map((m) => (m.visible ? m.value : mat.IDENTITY))),
      ),
    [matrices],
  )

  return { matrices, matrix, dispatch }
}

let nextId = 0

function wrapMatrix(value: mat.Matrix): WrappedMatrix {
  return { id: nextId++, visible: true, value }
}

function reducer(matrices: WrappedMatrix[], action: Action): WrappedMatrix[] {
  switch (action.type) {
    case 'update': {
      const current = matrices[action.index]
      const value = action.value ? clean(action.value) : current.value
      const visible = action.visible ?? current.visible

      return [
        ...matrices.slice(0, action.index),
        { ...current, visible, value },
        ...matrices.slice(action.index + 1),
      ]
    }

    case 'insert': {
      const copy = [...matrices]
      const value = wrapMatrix(clean(action.value))

      if (action.after) {
        const idx = copy.findIndex((m) => m.id === action.after!.id)
        copy.splice(idx, 0, value)
      } else {
        copy.push(value)
      }

      return copy
    }

    case 'delete': {
      const newMatrices = [
        ...matrices.slice(0, action.index),
        ...matrices.slice(action.index + 1),
      ]

      return newMatrices.length > 0 ? newMatrices : [wrapMatrix(mat.IDENTITY)]
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

function clean(m: mat.Matrix) {
  return mat.fixNegativeZeros(mat.round(m))
}
