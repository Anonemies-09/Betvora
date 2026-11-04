import { useEffect, useState } from 'react'
import { getPromotions } from '../services/promotionService'

export function usePromotions({ activeOnly = false } = {}) {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () =>
    getPromotions({ activeOnly }).then((data) => {
      setPromotions(data)
      setLoading(false)
    })

  useEffect(() => {
    let active = true
    getPromotions({ activeOnly }).then((data) => {
      if (active) {
        setPromotions(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly])

  return { promotions, loading, reload: load }
}
