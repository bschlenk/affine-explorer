import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

type Action = ActionUpdate | ActionInsert | ActionDelete | ActionMove

export type UseMatricesDispatch = React.Dispatch<Action>

export interface WrappedMatrix {
  id: number
  visible: boolean
  value: mat.Matrix
}

export function useMatrices() {
  // Create initial state once
  const initialMatrices = useRef<WrappedMatrix[]>([wrapMatrix(mat.IDENTITY)])

  const {
    state: historyState,
    setState: setHistoryState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory({
    initialState: initialMatrices.current,
  })

  // Use a separate display state for immediate feedback during skipHistory updates
  const [displayState, setDisplayState] = useState<WrappedMatrix[]>(
    initialMatrices.current,
  )

  // Track pending input changes to batch them
  const pendingInputChangeRef = useRef<WrappedMatrix[] | null>(null)

  // Sync display state with history state when history changes (undo/redo)
  useEffect(() => {
    if (!pendingInputChangeRef.current) {
      setDisplayState(historyState)
    }
  }, [historyState])

  const dispatch = useCallback(
    (action: Action) => {
      const newState = reducer(displayState, action)

      // Always update display state for immediate visual feedback
      setDisplayState(newState)

      // For input updates, we batch changes and only commit to history on blur
      if (action.type === 'update' && action.skipHistory) {
        pendingInputChangeRef.current = newState
      } else {
        // Clear any pending changes and commit to history
        pendingInputChangeRef.current = null
        setHistoryState(newState)
      }
    },
    [displayState, setHistoryState],
  )

  const undoCallback = useCallback(() => {
    // Clear any pending input changes when undoing
    pendingInputChangeRef.current = null
    undo()
  }, [undo])

  const redoCallback = useCallback(() => {
    // Clear any pending input changes when redoing
    pendingInputChangeRef.current = null
    redo()
  }, [redo])

  const matrix = useMemo(
    () =>
      clean(
        mat.mult(
          ...displayState.map((m) => (m.visible ? m.value : mat.IDENTITY)),
        ),
      ),
    [displayState],
  )

  return {
    matrices: displayState,
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
  }
}

function clean(m: mat.Matrix) {
  return mat.fixNegativeZeros(mat.round(m))
}
