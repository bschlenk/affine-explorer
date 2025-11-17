import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import * as mat from '@bschlenk/mat'

import { useHistory } from './use-history'

interface ActionUpdate {
  type: 'update'
  index: number
  value?: mat.Matrix
  visible?: boolean
  skipHistory?: boolean
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

interface ActionSetState {
  type: 'set-state'
  matrices: WrappedMatrix[]
}

type Action =
  | ActionUpdate
  | ActionInsert
  | ActionDelete
  | ActionMove
  | ActionSetState

export type UseMatricesDispatch = React.Dispatch<Action>

export interface WrappedMatrix {
  id: number
  visible: boolean
  value: mat.Matrix
}

export function useMatrices() {
  const [matrices, dispatchInternal] = useReducer(reducer, [], () => [
    wrapMatrix(mat.IDENTITY),
  ])

  const {
    state: historyState,
    setState: setHistoryState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory({
    initialState: [wrapMatrix(mat.IDENTITY)],
  })

  // Track pending input changes to batch them
  const pendingInputChangeRef = useRef<WrappedMatrix[] | null>(null)

  // Sync history state back to local state when undo/redo happens
  useEffect(() => {
    dispatchInternal({ type: 'set-state', matrices: historyState })
  }, [historyState])

  const dispatch = useCallback(
    (action: Action) => {
      const newState = reducer(matrices, action)
      dispatchInternal(action)

      // For input updates, we batch changes and only commit to history on blur
      if (action.type === 'update' && action.skipHistory) {
        pendingInputChangeRef.current = newState
      } else {
        // If there was a pending input change, commit it first
        if (pendingInputChangeRef.current) {
          setHistoryState(pendingInputChangeRef.current)
          pendingInputChangeRef.current = null
        }
        // Commit this action to history
        setHistoryState(newState)
      }
    },
    [matrices, setHistoryState],
  )

  const undoCallback = useCallback(() => {
    // Commit any pending input changes before undoing
    if (pendingInputChangeRef.current) {
      setHistoryState(pendingInputChangeRef.current)
      pendingInputChangeRef.current = null
    }
    undo()
  }, [undo, setHistoryState])

  const redoCallback = useCallback(() => {
    // Commit any pending input changes before redoing
    if (pendingInputChangeRef.current) {
      setHistoryState(pendingInputChangeRef.current)
      pendingInputChangeRef.current = null
    }
    redo()
  }, [redo, setHistoryState])

  const matrix = useMemo(
    () =>
      clean(
        mat.mult(...matrices.map((m) => (m.visible ? m.value : mat.IDENTITY))),
      ),
    [matrices],
  )

  return {
    matrices,
    matrix,
    dispatch,
    undo: undoCallback,
    redo: redoCallback,
    canUndo,
    canRedo,
  }
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

    case 'set-state': {
      return action.matrices
    }
  }
}

function clean(m: mat.Matrix) {
  return mat.fixNegativeZeros(mat.round(m))
}
