import { useEffect, useState } from 'react'
import { Landmark, Plus, Trash2, CreditCard } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import EmptyState from '../../components/common/EmptyState'
import Badge from '../../components/common/Badge'
import { useAuth } from '../../context/AuthContext'

const BANK_NAMES = [
  'GCB Bank',
  'Ecobank Ghana',
  'Absa Bank',
  'Access Bank',
  'Stanbic Bank',
]

const ACCOUNTS_KEY = 'betvora_bank_accounts'

function readAccounts(userId) {
  try {
    const all = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}')
    return all[userId] || []
  } catch {
    return []
  }
}

function persistAccounts(userId, accounts) {
  const all = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}')
  all[userId] = accounts
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(all))
}

export default function BankAccountsPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ bank: BANK_NAMES[0], accountName: '', accountNumber: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) setAccounts(readAccounts(user.id))
  }, [user])

  const addAccount = (e) => {
    e.preventDefault()
    setError('')
    if (!form.accountName.trim() || form.accountNumber.trim().length < 6) {
      setError('Enter an account name and a valid account number.')
      return
    }
    const account = {
      id: Date.now().toString(),
      bank: form.bank,
      accountName: form.accountName.trim(),
      accountNumber: form.accountNumber.trim(),
      addedAt: new Date().toISOString(),
    }
    const next = [account, ...accounts]
    setAccounts(next)
    persistAccounts(user.id, next)
    setForm({ bank: BANK_NAMES[0], accountName: '', accountNumber: '' })
    setOpen(false)
  }

  const removeAccount = (id) => {
    const next = accounts.filter((a) => a.id !== id)
    setAccounts(next)
    persistAccounts(user.id, next)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 lg:max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Bank Accounts</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No bank accounts linked"
          text="Link a bank account to receive withdrawals."
        />
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card key={account.id} className="flex items-center gap-4 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15">
                <CreditCard className="h-5 w-5 text-gold" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-black text-white">{account.bank}</p>
                  <Badge tone="green">Active</Badge>
                </div>
                <p className="truncate text-sm text-white/60">{account.accountName}</p>
                <p className="text-xs font-bold tracking-widest text-white/40">
                  •••• {account.accountNumber.slice(-4)}
                </p>
              </div>
              <button
                onClick={() => removeAccount(account.id)}
                aria-label={`Remove ${account.bank}`}
                className="rounded-xl border border-white/10 bg-navy-800 p-2.5 text-white/40 transition-colors hover:border-danger/50 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Bank Account"
        subtitle="Link a bank account for withdrawals."
      >
        <form onSubmit={addAccount} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-white/70">Bank</span>
            <select
              value={form.bank}
              onChange={(e) => setForm({ ...form, bank: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-navy-800 px-3.5 py-2.5 text-sm font-semibold text-white outline-none focus:border-gold"
            >
              {BANK_NAMES.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Account Name"
            placeholder="Emmanuel David"
            value={form.accountName}
            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
          />
          <Input
            label="Account Number"
            placeholder="0000 0000 0000"
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          />
          {error && (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" fullWidth>
            Link Account
          </Button>
        </form>
      </Modal>
    </div>
  )
}
