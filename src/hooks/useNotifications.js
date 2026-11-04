import { useEffect, useState } from 'react'
import { getNotifications, markAllRead, markRead } from '../services/notificationService'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = () =>
    getNotifications().then((data) => {
      setNotifications(data)
      setLoading(false)
    })

  useEffect(() => {
    let active = true
    getNotifications().then((data) => {
      if (active) {
        setNotifications(data)
        setLoading(false)
      }
    })
    const onNotify = () => {
      getNotifications().then((data) => {
        if (active) setNotifications(data)
      })
    }
    window.addEventListener('betvora:notify', onNotify)
    return () => {
      active = false
      window.removeEventListener('betvora:notify', onNotify)
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const readAll = async () => {
    await markAllRead()
    reload()
  }

  const readOne = async (id) => {
    await markRead(id)
    reload()
  }

  return { notifications, unreadCount, loading, reload, readAll, readOne }
}
