"use client"

import { useCart } from "@/hooks/use-cart"
import { useI18n } from "@/contexts/i18n-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { getSettings, type AppSettings } from "@/lib/settings"
import { calculateSubtotal, calculateTaxTotal } from "@/lib/cart-pricing"

export function CheckoutSummary() {
  const { items, getTotalItems, fulfillmentOption, deliveryFee } = useCart()
  const { t } = useI18n()
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  const subtotal = calculateSubtotal(items)
  const vatRate = settings?.vatRate ?? 21
  const tax = calculateTaxTotal(items, vatRate)
  const delivery = deliveryFee ?? 0
  const total = subtotal + tax + delivery

  return (
    <Card className="sticky top-4 bg-slate-100">
      <CardHeader>
        <CardTitle>{t("checkout.orderSummary")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>{t("checkout.subtotal")} ({getTotalItems()} {getTotalItems() === 1 ? t("checkout.item") : t("checkout.items")})</span>
            <span>€{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>{t("checkout.delivery")}</span>
            <div className="flex items-center gap-2">
              {fulfillmentOption === "self-collection" ? (
                <Badge variant="secondary" className="text-xs">
                  {t("checkout.free")}
                </Badge>
              ) : null}
              <span>{fulfillmentOption === "self-collection" ? `€${delivery.toFixed(2)}` : (deliveryFee != null ? `€${delivery.toFixed(2)}` : t("checkout.deliveryCalculated"))}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span>{t("checkout.vat")}</span>
            <span>€{tax.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold text-lg">
          <span>{t("checkout.total")}</span>
          <span>€{total.toFixed(2)}</span>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• {t("checkout.deliveryNote")}</p>
          <p>• {t("checkout.setupService")}</p>
          <p>• {t("checkout.support")}</p>
        </div>
      </CardContent>
    </Card>
  )
}
