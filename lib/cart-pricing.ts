import type { CartItem } from "@/lib/types"
import { calculateItemTotal } from "@/lib/pricing"

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.totalPrice ?? calculateItemTotal(item)), 0)
}

export function calculateTaxTotal(items: CartItem[], defaultVatRate: number): number {
  return items.reduce((sum, item) => {
    const rate = Number.isFinite(item.taxRate) ? (item.taxRate as number) : defaultVatRate
    const itemTotal = item.totalPrice ?? calculateItemTotal(item)
    return sum + itemTotal * (rate / 100)
  }, 0)
}
