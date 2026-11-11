import PromotionBanner from '../../components/home/PromotionBanner'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import AdSlot from '../../components/common/AdSlot'
import { usePromotions } from '../../hooks/usePromotions'
import { useWallet } from '../../context/WalletContext'
import { formatCurrency, formatDate } from '../../utils/format'

export default function PromotionsPage() {
  const { promotions } = usePromotions({ activeOnly: true })
  const { currency } = useWallet()

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:max-w-4xl">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white">Promotions</h1>
      {promotions.length === 0 ? (
        <EmptyState
          title="No active offers right now"
          text="New promotions land here the moment they go live. Keep an eye on the bonus wallet meanwhile."
        />
      ) : (
        <div className="space-y-4">
          {promotions.map((promotion) => (
            <Card key={promotion.id} className="overflow-hidden">
              <PromotionBanner promotion={promotion} />
              <div className="p-4">
                <p className="text-sm text-white/60">{promotion.description}</p>
                {promotion.maxBonus > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge tone="gold">Up to {formatCurrency(promotion.maxBonus, currency)}</Badge>
                    <Badge tone="navy">
                      {formatDate(promotion.startDate)} — {formatDate(promotion.endDate)}
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          ))}
          <AdSlot slot="promotions_bottom" className="mx-auto w-full max-w-2xl" />
        </div>
      )}
      <p className="rounded-xl border border-white/5 bg-royal p-4 text-center text-xs text-white/40">
        Offers are subject to availability and the specific terms shown on each promotion.
      </p>
    </div>
  )
}
