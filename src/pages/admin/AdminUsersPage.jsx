import { useEffect, useState } from 'react'
import { Search, ShieldCheck, ShieldOff, Ban, Trash2, Users as UsersIcon } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import EmptyState from '../../components/common/EmptyState'
import { getAllUsers, setUserVerified, setUserSuspended, setUserRole, deleteUser, createUser, updateUser } from '../../services/userService'
import * as authService from '../../services/authService'
import * as walletService from '../../services/walletService'
import { pullStaffData } from '../../services/cloudSync'
import Modal from '../../components/common/Modal'
import { formatDate } from '../../utils/format'

function RoleBadge({ role }) {
  if (role === 'admin') return <Badge tone="gold">Admin</Badge>
  if (role === 'agent') return <Badge tone="purple">Agent</Badge>
  return <Badge tone="blue">User</Badge>
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', phone: '', password: '', role: 'user' })
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', role: 'user', isVerified: true, isSuspended: false })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(null)
  const [creditModal, setCreditModal] = useState(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditLoading, setCreditLoading] = useState(false)

  const load = async (query = search) => {
    await pullStaffData()
    const data = await getAllUsers({ search: query })
    setUsers(data)
    setLoading(false)
  }

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

  const toggleAgent = async (user) => {
    await setUserRole(user.id, user.role === 'agent' ? 'user' : 'agent')
    load()
  }

  const removeUser = async (user) => {
    if (!window.confirm(`Delete ${user.fullName}? This cannot be undone.`)) return
    await deleteUser(user.id)
    load()
  }

  const createUserAccount = async (e) => {
    e.preventDefault()
    setCreateError('')
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError('Name, email and password are required.')
      return
    }
    setCreateLoading(true)
    try {
      await createUser({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password,
        role: createForm.role,
      })
      setCreateModal(false)
      setCreateForm({ fullName: '', email: '', phone: '', password: '', role: 'user' })
      load()
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreateLoading(false)
    }
  }

  const openEdit = (user) => {
    setEditModal(user)
    setEditForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
      role: user.role || 'user',
      isVerified: Boolean(user.isVerified),
      isSuspended: Boolean(user.isSuspended),
    })
    setEditError('')
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editModal) return
    setEditError('')
    setEditLoading(true)
    try {
      await updateUser(editModal.id, {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role,
        isVerified: editForm.isVerified,
        isSuspended: editForm.isSuspended,
      })
      setEditModal(null)
      load()
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  const resetPassword = async (user) => {
    if (!window.confirm(`Send a password reset email to ${user.email}?`)) return
    setResetLoading(user.id)
    try {
      await authService.sendPasswordReset(user.email)
      window.alert(`Password reset email sent to ${user.email}.`)
    } catch (err) {
      window.alert(err.message)
    } finally {
      setResetLoading(null)
    }
  }

  const creditWallet = async (e) => {
    e.preventDefault()
    if (!creditModal) return
    const amount = Number(creditAmount)
    if (!amount || amount <= 0) return
    setCreditLoading(true)
    try {
      await walletService.deposit(amount, { method: 'Admin credit', userId: creditModal.id })
      setCreditModal(null)
      setCreditAmount('')
    } finally {
      setCreditLoading(false)
    }
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
          <Button onClick={() => setCreateModal(true)}>Create User</Button>
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
                  {(user.fullName || user.email || 'BV')
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-white">{user.fullName || user.email}</p>
                    <RoleBadge role={user.role} />
                    {user.isSuspended && <Badge tone="red" dot>Suspended</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-white/40">
                    {[user.email, user.phone, `joined ${formatDate(user.createdAt)}`]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(user)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={resetLoading === user.id}
                    onClick={() => resetPassword(user)}
                  >
                    Reset password
                  </Button>
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
                      <Button size="sm" variant="secondary" onClick={() => setCreditModal(user)}>
                        Credit
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => toggleAgent(user)}>
                        {user.role === 'agent' ? 'Remove agent' : 'Make agent'}
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

      <Modal open={Boolean(creditModal)} onClose={() => setCreditModal(null)} title="Credit Wallet">
        <form onSubmit={creditWallet} className="space-y-4">
          <p className="text-sm text-white/60">
            Credit {creditModal?.fullName}'s wallet.
          </p>
          <Input
            label="Amount"
            type="number"
            min="0"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
          />
          <Button type="submit" fullWidth loading={creditLoading}>
            Credit
          </Button>
        </form>
      </Modal>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create User Account">
        <form onSubmit={createUserAccount} className="space-y-4">
          <Input label="Full Name" value={createForm.fullName} onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))} />
          <Input label="Email" type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Phone" value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input label="Password" type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} />
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">Role</p>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-navy-800 px-4 py-3 text-sm text-white outline-none focus:border-gold"
            >
              <option value="user">User</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {createError && <p className="text-sm text-danger">{createError}</p>}
          <Button type="submit" fullWidth loading={createLoading}>
            Create User
          </Button>
        </form>
      </Modal>

      <Modal open={Boolean(editModal)} onClose={() => setEditModal(null)} title="Edit User">
        <form onSubmit={saveEdit} className="space-y-4">
          <p className="text-sm text-white/60">{editModal?.email}</p>
          <Input label="Full Name" value={editForm.fullName} onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} />
          <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">Role</p>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-navy-800 px-4 py-3 text-sm text-white outline-none focus:border-gold"
              disabled={editModal?.role === 'admin'}
            >
              <option value="user">User</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={editForm.isVerified}
              onChange={(e) => setEditForm((f) => ({ ...f, isVerified: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-navy-800 text-gold"
            />
            <span className="text-sm font-bold text-white">Verified</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={editForm.isSuspended}
              onChange={(e) => setEditForm((f) => ({ ...f, isSuspended: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-navy-800 text-gold"
            />
            <span className="text-sm font-bold text-white">Suspended</span>
          </label>
          {editError && <p className="text-sm text-danger">{editError}</p>}
          <Button type="submit" fullWidth loading={editLoading}>
            Save changes
          </Button>
        </form>
      </Modal>
    </div>
  )
}
