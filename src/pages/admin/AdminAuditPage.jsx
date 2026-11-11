import { useEffect, useState } from 'react'
import Card from '../../components/common/Card'
import EmptyState from '../../components/common/EmptyState'
import { listAuditLogs } from '../../services/auditService'
import { formatDate } from '../../utils/format'

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    listAuditLogs().then((data) => {
      if (active) {
        setLogs(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Audit Log</h1>
        <p className="mt-1 text-sm text-white/40">Recent staff actions.</p>
      </div>
      {loading ? (
        <p className="py-10 text-center text-sm text-white/40">Loading…</p>
      ) : logs.length === 0 ? (
        <EmptyState title="No audit entries" text="Staff actions will appear here." />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-white">{log.action}</span>
                <span className="text-xs text-white/35">{formatDate(log.createdAt, { withYear: true })}</span>
              </div>
              <p className="mt-1 text-xs text-white/50">
                {log.userName} ({log.role}) • {JSON.stringify(log.details)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
