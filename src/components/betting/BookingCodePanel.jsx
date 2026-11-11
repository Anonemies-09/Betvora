import { useEffect, useState } from 'react'
import { Check, ClipboardCopy, Share2, Ticket } from 'lucide-react'
import Button from '../common/Button'
import {
  bookingCodeShareText,
  createBookingCode,
  isValidBookingCode,
  loadBookingCode,
  normalizeBookingCode,
} from '../../services/bookingCodeService'
import { cn } from '../../utils/cn'

function copyToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }
  return Promise.reject(new Error('Clipboard unavailable'))
}

/**
 * Generate a shareable booking code from the current slip, or load someone
 * else's code into it. Pass `onLoad` to enable the load form; omit it for a
 * create-only panel (for example inside the staff booking modal).
 */
export default function BookingCodePanel({
  selections = [],
  onLoad,
  className,
}) {
  const [input, setInput] = useState('')
  const [created, setCreated] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const signature = selections
    .map((s) => `${s.matchId}-${s.market}-${s.outcomeKey}`)
    .join('|')

  // A code only describes the slip it was made from; hide a stale one when the
  // selections change.
  useEffect(() => {
    setCreated(null)
    setCopied('')
  }, [signature])

  const allowLoad = typeof onLoad === 'function'
  const normalized = normalizeBookingCode(input)
  const canSubmit = isValidBookingCode(normalized)

  const flashCopied = (kind) => {
    setCopied(kind)
    setTimeout(() => setCopied(''), 2500)
  }

  const handleCopy = async (text, kind) => {
    setError('')
    try {
      await copyToClipboard(text)
      flashCopied(kind)
    } catch {
      setError('Copy failed. Select the code and copy it manually.')
    }
  }

  const handleCreate = async () => {
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const record = await createBookingCode(selections)
      setCreated(record)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!created) return
    setError('')
    const text = bookingCodeShareText(created.code)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'BETVORA booking code', text })
        return
      } catch {
        // User dismissed the sheet or sharing is blocked: fall through to copy.
      }
    }
    await handleCopy(text, 'share')
  }

  const handleLoad = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!canSubmit) {
      setError('Enter a valid booking code (9 characters).')
      return
    }
    setLoading(true)
    try {
      const result = await loadBookingCode(normalized)
      onLoad(result.selections)
      setInput('')
      setCreated(null)
      setMessage(
        `Loaded ${result.selections.length} selection${result.selections.length === 1 ? '' : 's'}. Set your own stake.`,
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-navy-800/60 p-3.5',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-gold" />
        <p className="text-xs font-black uppercase tracking-wide text-white/70">Booking Code</p>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-white/40">
        Share your picks with a code. They set their own stake at the current odds.
      </p>

      {created ? (
        <div className="mt-2.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-base font-black tracking-[0.18em] text-gold">
              {created.code}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Copy booking code"
                onClick={() => handleCopy(created.code, 'code')}
                className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                {copied === 'code' ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <ClipboardCopy className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                aria-label="Share booking code"
                onClick={handleShare}
                className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                {copied === 'share' ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <p className="mt-1 text-[10px] text-white/40">
            {copied === 'share' ? 'Link copied to clipboard.' : 'Expires when the first match starts.'}
          </p>
        </div>
      ) : (
        selections.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            fullWidth
            className="mt-2.5"
            loading={loading}
            onClick={handleCreate}
          >
            Create share code
          </Button>
        )
      )}

      {allowLoad && (
        <form onSubmit={handleLoad} className="mt-2.5 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter code"
            aria-label="Booking code"
            autoComplete="off"
            maxLength={12}
            className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm font-bold uppercase tracking-widest text-white placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-white/30 outline-none focus:border-gold"
          />
          <Button type="submit" size="sm" disabled={loading || !normalized}>
            Load
          </Button>
        </form>
      )}

      {message && (
        <p className="mt-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-[11px] text-success">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[11px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
