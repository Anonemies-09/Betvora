import { CLOUD, LOCAL, cloudEnabled, cloudSet, readLocal, writeLocal } from './cloudSync'
import * as authService from './authService'

const CACHE_KEY = LOCAL.auditLogs || 'betvora_audit_logs'

export async function logAction(action, details = {}) {
  const session = authService.getSession()
  const entry = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    details,
    userId: session?.id || '',
    userName: session?.fullName || session?.email || 'system',
    role: session?.role || 'system',
    createdAt: new Date().toISOString(),
  }
  const cache = readLocal(CACHE_KEY, [])
  cache.unshift(entry)
  if (cache.length > 200) cache.length = 200
  writeLocal(CACHE_KEY, cache)
  if (cloudEnabled()) {
    void cloudSet(CLOUD.auditLogs || 'auditLogs', entry.id, entry)
  }
  return entry
}

export async function listAuditLogs() {
  if (cloudEnabled()) {
    const { cloudList } = await import('./cloudSync')
    const remote = await cloudList(CLOUD.auditLogs || 'auditLogs')
    if (remote) {
      writeLocal(CACHE_KEY, remote.slice(0, 200))
      return remote
    }
  }
  return readLocal(CACHE_KEY, [])
}
