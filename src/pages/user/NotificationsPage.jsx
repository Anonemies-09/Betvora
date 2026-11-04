import { BellRing } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import { useNotifications } from '../../hooks/useNotifications'
import { cn } from '../../utils/cn'

const TYPE_STYLES = {
  bet: { label: 'Bet', className: 'text-gold' },
  win: { label: 'Win', className: 'text-success' },
  wallet: { label: 'Wallet', className: 'text-sky-300' },
  promo: { label: 'Promo', className: 'text-gold' },
  system: { label: 'System', className: 'text-white/50' },
}

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationsPage() {
  const { notifications, unreadCount, readAll, readOne } = useNotifications()

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Notifications</h1>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={readAll}>
            <BellRing className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="Nothing in your inbox yet"
          text="Bet confirmations, win alerts and promo updates will land here as they happen."
        />
      ) : (
        <Card className="divide-y divide-white/5">
          {notifications.map((notification) => {
            const meta = TYPE_STYLES[notification.type] || TYPE_STYLES.system
            return (
              <button
                key={notification.id}
                onClick={() => !notification.read && readOne(notification.id)}
                className={cn(
                  'flex w-full items-start gap-3 px-4 py-4 text-left transition-colors',
                  !notification.read && 'bg-gold/[0.04] hover:bg-gold/[0.08]',
                  notification.read && 'hover:bg-white/5',
                )}
              >
                <span
                  className={cn(
                    'mt-1 h-2 w-2 shrink-0 rounded-full',
                    notification.read ? 'bg-white/15' : 'bg-gold',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white">{notification.title}</p>
                    <span className="shrink-0 text-[11px] text-white/30">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                    {notification.text}
                  </p>
                </div>
                <span className={cn('shrink-0 text-[10px] font-black uppercase tracking-wide', meta.className)}>
                  {meta.label}
                </span>
              </button>
            )
          })}
        </Card>
      )}
    </div>
  )
}
