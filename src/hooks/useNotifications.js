import { useEffect, useState } from 'react'
import { getNotifications, markAllRead, markRead } from '../services/notificationService'
import { subscribeNotifications } from '../services/cloudSync'
import { getSession } from '../services/authService'

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
    const load = () =>
      getNotifications().then((data) => {
        if (active) {
          setNotifications(data)
          setLoading(false)
        }
      })

    load()

    const onNotify = () => load()
    window.addEventListener('betvora:notify', onNotify)

    const uid = getSession()?.id
    const unsubscribe = subscribeNotifications(uid, onNotify)

    return () => {
      active = false
      window.removeEventListener('betvora:notify', onNotify)
      unsubscribe()
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
