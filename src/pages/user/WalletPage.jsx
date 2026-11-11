import { useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingDown,
  TrendingUp,
  Trophy,
  Landmark,
  CreditCard,
  Gift,
  History,
  Smartphone,
  Phone,
  Banknote,
} from 'lucide-react'
import Card from '../../components/common/Card'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import EmptyState from '../../components/common/EmptyState'
import Tabs from '../../components/common/Tabs'
import AdSlot from '../../components/common/AdSlot'
import WalletCard from '../../components/wallet/WalletCard'
import { useWallet } from '../../context/WalletContext'
import { createDepositRequest, DEPOSIT_NUMBER } from '../../services/depositService'
import { createWithdrawalRequest } from '../../services/withdrawalService'
import { formatCurrency, formatDate, currencySymbol } from '../../utils/format'
import { cn } from '../../utils/cn'

const TRANSACTION_META = {
  deposit: { label: 'Deposit', color: 'text-success', Icon: TrendingDown },
  withdraw: { label: 'Withdraw', color: 'text-white/70', Icon: TrendingUp },
  bet: { label: 'Bet Placed', color: 'text-gold', Icon: TrendingUp },
  win: { label: 'Winnings', color: 'text-success', Icon: Trophy },
  bonus: { label: 'Bonus', color: 'text-gold', Icon: Gift },
  refund: { label: 'Refund', color: 'text-success', Icon: History },
}

const SECTIONS = ['Transactions', 'Payment History', 'Bank', 'Payment Methods', 'Bonuses']

const COMING_SOON = {
  Bank: {
    icon: Landmark,
    title: 'No bank accounts linked',
    text: 'Link a bank account to receive withdrawals.',
  },
  'Payment Methods': {
    icon: CreditCard,
    title: 'Saved payment methods',
    text: 'Mobile money, cards and vouchers you use appear here once you transact.',
  },
  Bonuses: {
    icon: Gift,
    title: 'No bonuses yet',
    text: 'Welcome bonuses and promotions you claim will appear here.',
  },
}

const PAYMENT_METHODS = [
  { id: 'mtn-momo', name: 'MTN Mobile Money', short: 'MTN MoMo', type: 'momo', icon: Smartphone, brand: 'MTN', color: '#FFCC00' },
  { id: 'telecel-cash', name: 'Telecel Cash', short: 'Telecel Cash', type: 'momo', icon: Phone, brand: 'Telecel', color: '#ED1B24' },
  { id: 'at-money', name: 'AT Money', short: 'AT Money', type: 'momo', icon: Banknote, brand: 'AT', color: '#00A651' },
  { id: 'card', name: 'Visa / Mastercard', short: 'Card', type: 'card', icon: CreditCard, brand: 'VISA', color: '#1E88E5' },
  { id: 'bank', name: 'Bank Transfer', short: 'Bank', type: 'bank', icon: Landmark, brand: 'Bank', color: '#4CAF50' },
]

function TransactionRow({ tx, currency }) {
  const meta = TRANSACTION_META[tx.type] || {
    label: tx.type,
    color: 'text-white/70',
    Icon: TrendingUp,
  }
  const positive = tx.amount > 0
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-800">
        <meta.Icon className={cn('h-4.5 w-4.5', meta.color)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">{meta.label}</p>
        <p className="truncate text-xs text-white/40">{tx.note}</p>
        <p className="text-[11px] text-white/25">{formatDate(tx.createdAt, { withYear: true })}</p>
      </div>
      <span className={cn('text-sm font-black', positive ? 'text-success' : 'text-white')}>
        {positive ? '+' : ''}
        {formatCurrency(tx.amount, currency)}
      </span>
    </div>
  )
}

export default function WalletPage() {
  const { balance, currency, transactions, refresh } = useWallet()
  const [section, setSection] = useState('Transactions')
  const [modal, setModal] = useState(null)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState('mtn-momo')
  const [account, setAccount] = useState('')
  const [txRef, setTxRef] = useState('')
  const [stage, setStage] = useState('form')
  const [submittedRequest, setSubmittedRequest] = useState(null)
  const [submittedType, setSubmittedType] = useState(null)

  const isDeposit = modal === 'deposit'
  const activeMethod = PAYMENT_METHODS.find((m) => m.id === method)
  const needsApproval = activeMethod?.type === 'momo' || activeMethod?.type === 'card'

  const openModal = (type) => {
    setError('')
    setAmount('')
    setAccount('')
    setTxRef('')
    setStage('form')
    setSubmittedRequest(null)
    setSubmittedType(null)
    setMethod(type === 'withdraw' ? 'mtn-momo' : 'mtn-momo')
    setModal(type)
  }

  const closeModal = () => {
    setModal(null)
    setStage('form')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (isDeposit) {
      // Manual Telecel Cash deposit: user pays into 0507655475 and submits proof.
      if (!amount || Number(amount) <= 0) {
        setError('Enter a valid amount.')
        return
      }
      if (!account.trim()) {
        setError('Enter your Telecel Cash number.')
        return
      }
      if (!txRef.trim()) {
        setError('Enter the Telecel Cash transaction reference.')
        return
      }
      setLoading(true)
      try {
        const request = await createDepositRequest({
          amount,
          senderPhone: account.trim(),
          txRef: txRef.trim(),
        })
        setSubmittedRequest(request)
        setStage('submitted')
      } catch (err) {
        setError(err.message)
        setStage('form')
      } finally {
        setLoading(false)
      }
      return
    }

    // Withdrawals are manual requests processed by an admin.
    if (!account.trim()) {
      setError(`Enter the ${activeMethod?.short} number to withdraw to.`)
      return
    }
    setLoading(true)
    try {
      const request = await createWithdrawalRequest({
        amount,
        method: activeMethod.short,
        account: account.trim(),
      })
      setSubmittedRequest(request)
      setSubmittedType('withdraw')
      setStage('submitted')
      await refresh()
    } catch (err) {
      setError(err.message)
      setStage('form')
    } finally {
      setLoading(false)
    }
  }

  const paymentTx = transactions.filter((tx) => tx.type === 'deposit' || tx.type === 'withdraw')
  const comingSoon = COMING_SOON[section]
  const list =
    section === 'Transactions'
      ? transactions
      : section === 'Payment History'
        ? paymentTx
        : null

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:max-w-4xl">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white">Wallet</h1>

      <WalletCard
        balance={balance}
        currency={currency}
        onDeposit={() => openModal('deposit')}
        onWithdraw={() => openModal('withdraw')}
        onHistory={() => setSection('Transactions')}
      />

      <Tabs tabs={SECTIONS} active={section} onChange={setSection} />

      {list ? (
        list.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            text="Deposits, withdrawals, bets and winnings will all be itemised here."
          />
        ) : (
          <>
            <Card className="divide-y divide-white/5">
              {list.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} currency={currency} />
              ))}
            </Card>
            <AdSlot slot="wallet_bottom" className="mx-auto w-full max-w-2xl" />
          </>
        )
      ) : (
        <EmptyState
          icon={comingSoon.icon}
          title={comingSoon.title}
          text={comingSoon.text}
        />
      )}

      <Modal
        open={modal !== null}
        onClose={closeModal}
        title={isDeposit ? 'Deposit Funds' : 'Withdraw Funds'}
        subtitle={
          isDeposit
            ? 'Send money to our Telecel Cash number and submit your proof of payment.'
            : 'Cash out to your mobile money or bank account.'
        }
      >
        {stage === 'submitted' ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
              <p className="text-sm font-black text-success">
                {submittedType === 'withdraw' ? 'Withdrawal request submitted' : 'Deposit request submitted'}
              </p>
              <p className="mt-1 text-xs text-white/60">
                {submittedType === 'withdraw'
                  ? `Your withdrawal of ${formatCurrency(submittedRequest?.amount || 0, currency)} is pending processing. The amount has been reserved in your wallet.`
                  : `Your request for ${formatCurrency(submittedRequest?.amount || 0, currency)} is pending verification. It will be credited to your wallet once an admin confirms the payment.`}
              </p>
              {submittedRequest?.txRef && (
                <p className="mt-2 text-[11px] text-white/40">
                  Reference: {submittedRequest.txRef}
                </p>
              )}
            </div>
            <Button fullWidth size="lg" onClick={closeModal}>
              Done
            </Button>
          </div>
        ) : stage === 'confirming' ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
              <p className="text-sm font-black text-white">
                {activeMethod?.type === 'momo'
                  ? `Check your phone — push sent to ${account || 'your device'}`
                  : `Processing ${activeMethod?.short} payment…`}
              </p>
              <p className="text-xs text-white/40">
                Approve the prompt to {isDeposit ? 'credit' : 'debit'} {formatCurrency(Number(amount) || 0, currency)}.
              </p>
            </div>
            <Button fullWidth size="lg" variant="secondary" disabled>
              Waiting for approval…
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {isDeposit && (
              <div className="rounded-xl border border-gold/30 bg-gold/10 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">Pay to (Telecel Cash)</p>
                <p className="mt-1 text-2xl font-black text-white">{DEPOSIT_NUMBER}</p>
                <p className="mt-1 text-xs text-white/60">
                  Send the deposit amount to this number, then fill in the details below so we can verify and credit your wallet.
                </p>
              </div>
            )}
            <Input
              label="Amount"
              type="number"
              min="0"
              step="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              rightSlot={<span className="text-sm font-bold text-gold">{currencySymbol(currency)}</span>}
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              {[100, 500, 1000, 5000, 10000].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(String(value))}
                  className="rounded-lg border border-white/10 bg-navy-800 px-3 py-1.5 text-sm font-bold text-white/60 transition-colors hover:border-gold/50 hover:text-gold"
                >
                  {formatCurrency(value, currency)}
                </button>
              ))}
            </div>

            {!isDeposit && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/40">
                Withdraw to
              </p>
              <div className="grid grid-cols-1 gap-2">
                {PAYMENT_METHODS.filter((m) => (isDeposit ? true : m.type !== 'card')).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                      method === m.id
                        ? 'border-gold bg-gold/10'
                        : 'border-royal-400/40 bg-navy-800 hover:border-gold/50',
                    )}
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black text-navy-800"
                      style={{ background: m.color }}
                    >
                      {m.brand}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-white">{m.name}</span>
                      <span className="block text-[11px] text-white/35">
                        {m.type === 'momo' ? 'Instant • Simulated push' : m.type === 'card' ? 'Card • Instant' : '1–2 days • Manual'}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            )}

            {isDeposit ? (
              <>
                <Input
                  label="Your Telecel Cash number"
                  placeholder="e.g. 054 123 4567"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  inputMode="tel"
                />
                <Input
                  label="Telecel transaction reference"
                  placeholder="e.g. 1234567890"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                />
              </>
            ) : needsApproval ? (
              <Input
                label={activeMethod?.type === 'momo' ? `${activeMethod.short} number` : 'Card number'}
                placeholder={activeMethod?.type === 'momo' ? 'e.g. 054 123 4567' : '4242 4242 4242 4242'}
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                inputMode={activeMethod?.type === 'momo' ? 'tel' : 'numeric'}
              />
            ) : null}

            {error && (
              <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              fullWidth
              variant={isDeposit ? 'primary' : 'secondary'}
              loading={loading}
              disabled={!amount || Number(amount) <= 0}
            >
              {isDeposit ? (
                <>
                  <ArrowDownToLine className="h-4 w-4" /> Submit deposit request
                </>
              ) : (
                <>
                  <ArrowUpFromLine className="h-4 w-4" /> Withdraw {formatCurrency(Number(amount) || 0, currency)}
                </>
              )}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
