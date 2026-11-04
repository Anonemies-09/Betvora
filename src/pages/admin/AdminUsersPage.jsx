import { useEffect, useState } from 'react'
import { Search, ShieldCheck, ShieldOff, Ban, Trash2, Users as UsersIcon } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import EmptyState from '../../components/common/EmptyState'
import { getAllUsers, setUserVerified, setUserSuspended, deleteUser } from '../../services/userService'
import { formatDate } from '../../utils/format'

function RoleBadge({ role }) {
  return role === 'admin' ? <Badge tone="gold">Admin</Badge> : <Badge tone="blue">User</Badge>
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = (query = search) =>
    getAllUsers({ search: query }).then((data) => {
      setUsers(data)
      setLoading(false)
    })

  useEffect(() => {
    load('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => {
    setLoading(true)
    load(search)
  }

  const toggleVerify = async (user) => {
    await setUserVerified(user.id, !user.isVerified)
    load()
  }

  const toggleSuspend = async (user) => {
    await setUserSuspended(user.id, !user.isSuspended)
    load()
  }

  const removeUser = async (user) => {
    if (!window.confirm(`Delete ${user.fullName}? This cannot be undone.`)) return
    await deleteUser(user.id)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Users</h1>
          <p className="mt-1 text-sm text-white/40">{users.length} registered accounts</p>
        </div>
        <div className="flex w-full max-w-xs gap-2">
          <Input
            placeholder="Search name, email or phone"
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="secondary" onClick={handleSearch}>
            Go
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-white/40">Loading users…</p>
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" text="Try a different search." />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-white/5">
            {users.map((user) => (
              <div key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:flex-nowrap">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-sm font-black text-gold">
                  {user.fullName
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-white">{user.fullName}</p>
                    <RoleBadge role={user.role} />
                    {user.isSuspended && <Badge tone="red" dot>Suspended</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-white/40">
                    {user.email} • {user.phone} • joined {formatDate(user.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {user.role !== 'admin' && (
                    <>
                      <Button
                        size="sm"
                        variant={user.isVerified ? 'success' : 'secondary'}
                        onClick={() => toggleVerify(user)}
                      >
                        {user.isVerified ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                        {user.isVerified ? 'Verified' : 'Verify'}
                      </Button>
                      <Button
                        size="sm"
                        variant={user.isSuspended ? 'success' : 'danger'}
                        onClick={() => toggleSuspend(user)}
                      >
                        <Ban className="h-3.5 w-3.5" />
                        {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </Button>
                      <button
                        onClick={() => removeUser(user)}
                        aria-label="Delete user"
                        className="rounded-lg p-2 text-white/30 transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
