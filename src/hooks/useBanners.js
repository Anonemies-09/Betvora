import { useState, useEffect, useCallback } from 'react'
import * as bannerService from '../services/bannerService'

export function useBanners({ activeOnly = false } = {}) {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await bannerService.getBanners({ activeOnly })
      setBanners(data)
    } catch {
      /* keep last state */
    }
    setLoading(false)
  }, [activeOnly])

  useEffect(() => {
    load()
  }, [load])

  return { banners, loading, reload: load }
}
