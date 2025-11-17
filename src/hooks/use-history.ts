import { useCallback, useRef, useState } from 'react'

export interface UseHistoryOptions<T> {
  initialState: T
  maxHistory?: number
}

export interface UseHistoryReturn<T> {
  state: T
  setState: (state: T) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

export function useHistory<T>({
  initialState,
  maxHistory = 100,
}: UseHistoryOptions<T>): UseHistoryReturn<T> {
  const [state, setStateInternal] = useState<T>(initialState)
  const [historyIndex, setHistoryIndex] = useState(0)
  const history = useRef<T[]>([initialState])

  const setState = useCallback(
    (newState: T) => {
      // Don't add to history if state hasn't changed (deep comparison)
      if (JSON.stringify(newState) === JSON.stringify(state)) {
        return
      }

      // Remove any future history when making a new change
      const newHistory = history.current.slice(0, historyIndex + 1)
      newHistory.push(newState)

      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift()
      } else {
        setHistoryIndex(historyIndex + 1)
      }

      history.current = newHistory
      setStateInternal(newState)
    },
    [state, historyIndex, maxHistory],
  )

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setStateInternal(history.current[newIndex])
    }
  }, [historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.current.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setStateInternal(history.current[newIndex])
    }
  }, [historyIndex])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.current.length - 1

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
