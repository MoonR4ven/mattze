import type { Product, CartItem, PricingTier } from "@/lib/types"

function normalizeTiers(tiers?: PricingTier[]) {
  if (!tiers || tiers.length === 0) return []
  return [...tiers]
    .filter((tier) => Number.isFinite(tier.minDays) && Number.isFinite(tier.pricePerDay))
    .sort((a, b) => a.minDays - b.minDays)
}

export function getPricePerDay(product: Product, days: number): number {
  const safeDays = Math.max(1, Math.floor(days || 1))
  const tiers = normalizeTiers(product.pricingTiers)
  if (tiers.length === 0) return product.price

  let bestTier = tiers[0]
  for (const tier of tiers) {
    if (safeDays >= tier.minDays) {
      bestTier = tier
    } else {
      break
    }
  }

  return bestTier.pricePerDay
}

export function calculateItemTotal(item: CartItem): number {
  const days = item.numberOfDays && item.numberOfDays > 0 ? item.numberOfDays : 1
  const pricePerDay = item.price
  return pricePerDay * days * item.quantity
}
