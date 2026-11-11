/* eslint-disable react/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const BetSlipContext = createContext(null)

export function BetSlipProvider({ children }) {
  const [selections, setSelections] = useState([])
  const [stake, setStake] = useState(0)
  const [open, setOpen] = useState(false)

  const addSelection = useCallback((selection) => {
    setSelections((prev) => {
      const exists = prev.some(
        (s) =>
          s.matchId === selection.matchId &&
          s.market === selection.market &&
          s.outcomeKey === selection.outcomeKey,
      )
      if (exists) return prev
      return [...prev, selection]
    })
    setOpen(true)
  }, [])

  const removeSelection = useCallback(({ matchId, market, outcomeKey }) => {
    setSelections((prev) =>
      prev.filter(
        (s) => !(s.matchId === matchId && s.market === market && s.outcomeKey === outcomeKey),
      ),
    )
  }, [])

  const clearSlip = useCallback(() => {
    setSelections([])
    setStake(0)
  }, [])

  // Replace the slip with a loaded booking-code slip. Stake is cleared on
  // purpose: the recipient must decide how much of their own money to risk.
  const loadSelections = useCallback((incoming) => {
    const seen = new Set()
    const next = []
    for (const selection of incoming || []) {
      if (!selection?.matchId || !selection?.outcomeKey) continue
      const key = `${selection.matchId}-${selection.market}-${selection.outcomeKey}`
      if (seen.has(key)) continue
      seen.add(key)
      next.push(selection)
    }
    setSelections(next)
    setStake(0)
    setOpen(true)
  }, [])

  const totalOdds = useMemo(
    () => selections.reduce((acc, s) => acc * Number(s.odds), 1),
    [selections],
  )

  const potentialWin = useMemo(() => stake * totalOdds, [stake, totalOdds])

  const value = useMemo(
    () => ({
      selections,
      stake,
      setStake,
      open,
      setOpen,
      totalOdds,
      potentialWin,
      addSelection,
      removeSelection,
      clearSlip,
      loadSelections,
    }),
    [
      selections,
      stake,
      open,
      totalOdds,
      potentialWin,
      addSelection,
      removeSelection,
      clearSlip,
      loadSelections,
    ],
  )

  return <BetSlipContext.Provider value={value}>{children}</BetSlipContext.Provider>
}

export function useBetSlip() {
  const ctx = useContext(BetSlipContext)
  if (!ctx) throw new Error('useBetSlip must be used within a BetSlipProvider')
  return ctx
}
